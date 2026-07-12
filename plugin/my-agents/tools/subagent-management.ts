import { tool } from "@opencode-ai/plugin"
import type { PluginInput } from "@opencode-ai/plugin"
import { getSubagent, updateSubagent, unregisterSubagent } from "../registry.ts"

/** Re-uses the same wait logic as delegate-task but does NOT ping on stall
 *  (the user is in control now — they're the one pinging). */
async function waitForUserResponse(
  client: PluginInput["client"],
  sessionID: string,
  workdir: string,
  timeoutMs: number,
): Promise<{ text: string; timedOut: boolean }> {
  const maxAttempts = Math.max(1, Math.ceil(timeoutMs / 500))
  let timedOut = false
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 500))
    const statusRes = await client.session.status({ query: { directory: workdir } })
    const allStatuses = statusRes.data as Record<string, { type: string }> | undefined
    const sessionStatus = allStatuses?.[sessionID]
    if (!sessionStatus || sessionStatus.type === "idle") break
    if (i === maxAttempts - 1) timedOut = true
  }
  const messagesRes = await client.session.messages({
    path: { id: sessionID },
    query: { directory: workdir },
  })
  const messages: any[] = (messagesRes.data as any) ?? []
  const lastAssistant = [...messages].reverse().find((m: any) => m.info?.role === "assistant")
  const text = ((lastAssistant?.parts ?? []) as any[])
    .filter((p: any) => p.type === "text")
    .map((p: any) => p.text ?? "")
    .join("\n")
    .trim()
  return { text, timedOut }
}

export function makeSubagentPing(client: PluginInput["client"]) {
  return tool({
    description: `Send a follow-up message to an active subagent session and wait for its response.

Use this when a delegate_task returned [STALLED] (or you suspect a subagent is stuck) and you want to ask the subagent directly for a status update, give it new context, or unblock it. The subagent session is still alive — you're adding a new user-turn to its conversation.

Examples:
- "Are you still working? What's the current state?"
- "Stop trying approach X. Try Y instead. Here's why: ..."
- "I see you wrote 3 of 5 files. Continue with the last 2."

After the ping, the tool waits up to timeoutMs for the subagent to respond and returns its reply.`,
    args: {
      task_id: tool.schema.string().describe("The task_id returned by a [STALLED] delegate_task. This is the subagent's sessionID."),
      message: tool.schema.string().describe("The message to send to the subagent. It will be prefixed with [USER FOLLOW-UP] so the subagent knows it came from the orchestrator, not its original prompt."),
      timeoutMs: tool.schema.number().optional().describe("Max time to wait for the subagent to respond (default: 60000 = 60s)."),
    },
    async execute({ task_id, message, timeoutMs }, ctx) {
      const sub = getSubagent(task_id)
      if (!sub) {
        return { output: `No active subagent with task_id=${task_id}.\nPossible causes: (a) the subagent already finished, (b) you already aborted it, (c) the task_id is wrong.\nIf the subagent finished, its output should be in delegations/${task_id.slice(0,16)}.md.` }
      }

      try {
        await client.tui.showToast({
          body: {
            title: `Ping a ${sub.agentAlias}`,
            message: message.slice(0, 60),
            variant: "info",
            duration: 3000,
          },
        })
      } catch {}

      await client.session.prompt({
        path: { id: task_id },
        body: {
          agent: sub.agentKey,
          parts: [{ type: "text", text: `[USER FOLLOW-UP]\n${message}` }],
        } as any,
        query: { directory: sub.workdir },
      })

      const { text, timedOut } = await waitForUserResponse(client, task_id, sub.workdir, timeoutMs ?? 60_000)

      try {
        await client.tui.showToast({
          body: {
            title: `${sub.agentAlias} responded`,
            message: text ? text.slice(0, 60) : "(no text)",
            variant: "success",
            duration: 4000,
          },
        })
      } catch {}

      const output = timedOut
        ? `[TIMEOUT after ${Math.round((timeoutMs ?? 60_000) / 1000)}s — subagent did not respond to ping]\n\n${text || "(no output)"}`
        : text || "(no output)"

      return {
        output,
        metadata: { task_id, ping: true, agent: sub.agentKey, timedOut, response_preview: text.slice(0, 200) },
      }
    },
  })
}

export function makeSubagentAbort(client: PluginInput["client"]) {
  return tool({
    description: `Abandon a stalled subagent session. Sends a final [ABORT] message asking the subagent to wrap up and report state in 1-2 paragraphs, waits up to 45s for its final report, then stops tracking it.

Use this when:
- The subagent has been stalled for too long and is clearly hopeless
- The task is no longer needed (user changed direction)
- You want to free the sessionID so you can re-delegate fresh

After abort, the subagent session itself may keep running in opencode but you won't see its output here. If you need a fresh attempt, just call delegate_task again — it will get a new sessionID.`,
    args: {
      task_id: tool.schema.string().describe("The task_id of the subagent to abort."),
      reason: tool.schema.string().optional().describe("Why you're aborting. Included in the [ABORT] message so the subagent can prioritize wrap-up over starting new work."),
    },
    async execute({ task_id, reason }, ctx) {
      const sub = getSubagent(task_id)
      if (!sub) {
        return { output: `No active subagent with task_id=${task_id}. Either it already finished or was aborted.` }
      }

      const abortMsg =
        `[ABORT] The caller is abandoning this task.${reason ? ` Reason: ${reason}` : ""}\n\n` +
        `Please FINISH what you are doing NOW and report final state in 1-2 paragraphs. ` +
        `If you have already written files, list which ones and whether they are in a consistent state (compile / pass tests). ` +
        `Do not attempt new tasks — just close and report.`

      try {
        await client.tui.showToast({
          body: {
            title: `Aborting ${sub.agentAlias}`,
            message: reason ?? "No reason specified",
            variant: "warning",
            duration: 3500,
          },
        })
      } catch {}

      await client.session.prompt({
        path: { id: task_id },
        body: {
          agent: sub.agentKey,
          parts: [{ type: "text", text: abortMsg }],
        } as any,
        query: { directory: sub.workdir },
      })

      const { text, timedOut } = await waitForUserResponse(client, task_id, sub.workdir, 45_000)

      unregisterSubagent(task_id)

      const report = text
        ? `Final report from ${sub.agentAlias}:\n\n${text}`
        : `${sub.agentAlias} did not respond to abort${timedOut ? " (timeout 45s)" : ""}.`

      return {
        output: report,
        metadata: { task_id, aborted: true, agent: sub.agentKey, got_report: !!text, timedOut },
      }
    },
  })
}

export function makeSubagentStatus(client: PluginInput["client"]) {
  return tool({
    description: `Check the current state of an active subagent session without sending any message.

Returns a JSON object with: task_id, agent, status (idle/busy), idle boolean, elapsed_seconds, total_messages, watchdog_pings, started_at, last_activity, and the last 500 chars of the most recent assistant message.

Use this BEFORE deciding to ping or abort a stalled subagent — it tells you whether the subagent is still actually doing something (new messages) or has truly gone silent.`,
    args: {
      task_id: tool.schema.string().describe("The task_id of the subagent to check."),
    },
    async execute({ task_id }, ctx) {
      const sub = getSubagent(task_id)
      if (!sub) {
        return { output: `No active subagent with task_id=${task_id}. Either it finished, was aborted, or the task_id is wrong.` }
      }

      const statusRes = await client.session.status({ query: { directory: sub.workdir } })
      const sessionStatus = (statusRes.data as any)?.[task_id]

      const msgRes = await client.session.messages({
        path: { id: task_id },
        query: { directory: sub.workdir },
      })
      const messages: any[] = (msgRes.data ?? []) as any[]
      const lastAssistant = [...messages].reverse().find((m: any) => m.info?.role === "assistant")
      const lastText = ((lastAssistant?.parts ?? []) as any[])
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text ?? "")
        .join("\n")
        .trim()
      const lastTextSnippet = lastText.length > 500 ? lastText.slice(-500) : lastText

      const lastMessage = messages[messages.length - 1]
      const lastTs = lastMessage?.info?.time?.created ?? sub.startedAt
      const elapsed = Date.now() - sub.startedAt

      const info = {
        task_id,
        agent: sub.agentAlias,
        agent_full: sub.agentKey,
        status: sessionStatus?.type ?? "unknown",
        idle: sessionStatus?.type === "idle",
        elapsed_seconds: Math.round(elapsed / 1000),
        total_messages: messages.length,
        watchdog_pings: sub.pingCount,
        started_at: new Date(sub.startedAt).toISOString(),
        last_activity: new Date(lastTs).toISOString(),
        last_assistant_text: lastTextSnippet || "(none)",
        original_task_preview: sub.task,
      }

      return {
        output: JSON.stringify(info, null, 2),
        metadata: { task_id, status: sessionStatus?.type, idle: sessionStatus?.type === "idle", total_messages: messages.length },
      }
    },
  })
}