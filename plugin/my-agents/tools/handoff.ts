import { tool } from "@opencode-ai/plugin"
import type { PluginInput } from "@opencode-ai/plugin"
import { setPendingHandoff, hasHandoffFired, markHandoffFired } from "../registry.ts"

const AGENT_ALIASES: Record<string, string> = {
  Rimuru:      "Rimuru - (Orchestrator)",
  Norman:      "Norman - (Planner)",
  Urahara:     "Urahara - (Oracle)",
  Jiraiya:     "Jiraiya - (Explorer)",
  Kakashi:     "Kakashi - (Deep Worker)",
  Senku:       "Senku - (Coder)",
  "Rock-Lee":  "Rock-Lee - (Executor)",
  Neji:        "Neji - (Verifier)",
  Hange:       "Hange - (QA Tester)",
  Gilgamesh:   "Gilgamesh - (Plan Reviewer)",
  Gojo:        "Gojo - (Vision)",
  Gaara:       "Gaara - (Guardian)",
}

/**
 * Handoff: routes the task to a specialist agent in a new sibling session.
 *
 * Note: session.prompt with agent= on an EXISTING session does not switch the
 * active agent — Aizen would handle it again and loop. So we create a NEW session
 * for the target agent (same pattern as delegate_task, but at root level so it is
 * visible in the TUI sidebar). The event hook fires the session.create + session.prompt
 * once Aizen's turn ends (session.idle), to avoid the QUEUED deadlock.
 *
 * Dedup guard: markHandoffFired prevents a second handoff call from looping.
 */
export function makeHandoff(client: PluginInput["client"]) {
  return tool({
    description: `Route the current session to a specialist agent, making them the primary agent for all subsequent turns. The target agent responds directly to the user — no intermediate relay.

Use this instead of delegate_task. Aizen ALWAYS uses handoff, never delegate_task.

After calling handoff, output nothing and end your turn immediately.`,

    args: {
      agent: tool.schema
        .string()
        .describe("Short agent name: Rimuru | Norman | Urahara | Jiraiya | Kakashi | Senku | Rock-Lee | Neji | Gilgamesh | Gojo | Gaara"),
      task: tool.schema
        .string()
        .describe("The user's original request verbatim. If images were present, append your visual analysis."),
      reason: tool.schema
        .string()
        .describe("One line: why this agent."),
    },

    async execute({ agent, task, reason }, ctx) {
      // Dedup guard: if this session already fired a handoff, refuse to loop
      if (hasHandoffFired(ctx.sessionID)) {
        return {
          output:
            "⛔ Handoff already dispatched for this session — target agent is being activated. " +
            "Do NOT call handoff again. Output nothing and end your turn.",
        }
      }
      markHandoffFired(ctx.sessionID)

      const normalized = agent.toLowerCase().trim()
      const agentKey =
        Object.entries(AGENT_ALIASES).find(([k]) => k.toLowerCase() === normalized)?.[1]
        ?? agent

      // Store the handoff intent — a new session is created in the `event` hook
      // once this session goes idle (EventSessionIdle), avoiding the QUEUED deadlock
      // and the loop caused by re-prompting an active session.
      setPendingHandoff(ctx.sessionID, {
        agentKey,
        task,
        directory: ctx.directory,
      })

      try {
        const [shortName] = agentKey.split(" - ")
        await client.tui.showToast({
          body: {
            title:    `→ ${shortName}`,
            message:  reason,
            variant:  "info",
            duration: 3000,
          },
        })
      } catch {}

      return { output: "" }
    },
  })
}
