import { tool } from "@opencode-ai/plugin"
import type { PluginInput } from "@opencode-ai/plugin"

const AGENT_ALIASES: Record<string, string> = {
  Rimuru:      "Rimuru - (Orchestrator)",
  Norman:      "Norman - (Planner)",
  Urahara:     "Urahara - (Oracle)",
  Jiraiya:     "Jiraiya - (Explorer)",
  Kakashi:     "Kakashi - (Deep Worker)",
  Senku:       "Senku - (Coder)",
  "Rock-Lee":  "Rock-Lee - (Executor)",
  Neji:        "Neji - (Verifier)",
  Gilgamesh:   "Gilgamesh - (Plan Reviewer)",
  Gojo:        "Gojo - (Vision)",
  Gaara:       "Gaara - (Guardian)",
}

/**
 * Handoff: re-routes the current session to a specialist agent.
 * Unlike delegate_task (which spawns a subsession), handoff re-prompts
 * the SAME session so the target agent becomes the primary for all
 * subsequent turns.
 */
export function makeHandoff(client: PluginInput["client"]) {
  return tool({
    description: `Route the current session to a specialist agent, making them the primary agent for all subsequent turns. The target agent responds directly to the user — no intermediate relay.

Use this instead of delegate_task. Aizen ALWAYS uses handoff, never delegate_task.

After calling handoff, return empty output — the target agent takes over immediately.`,

    args: {
      agent: tool.schema
        .string()
        .describe("Short agent name: Rimuru | Norman | Urahara | Jiraiya | Kakashi | Senku | Rock-Lee | Neji | Gilgamesh | Gojo | Gaara"),
      task: tool.schema
        .string()
        .describe("The user's original request verbatim. If images were present, append your visual analysis (errors, stack traces, ports, paths extracted from the screenshot)."),
      reason: tool.schema
        .string()
        .describe("One line: why this agent."),
    },

    async execute({ agent, task, reason }, ctx) {
      const normalized = agent.toLowerCase().trim()
      const agentKey =
        Object.entries(AGENT_ALIASES).find(([k]) => k.toLowerCase() === normalized)?.[1]
        ?? agent

      // Queue a new prompt in the same session with the target agent.
      // OpenCode processes it after Aizen's current turn completes,
      // making the target agent the active one for subsequent turns.
      await (client.session.prompt as any)({
        path:  { id: ctx.sessionID },
        body:  {
          agent: agentKey,
          parts: [{ type: "text", text: task }],
        },
        query: { directory: ctx.directory },
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

      // Return empty — target agent takes over, Aizen exits silently.
      return { output: "" }
    },
  })
}
