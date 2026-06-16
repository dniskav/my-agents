import type { Plugin } from "@opencode-ai/plugin"
import { readFileSync } from "fs"
import { join } from "path"
import { homedir } from "os"
import { PROMPTS } from "./agents.ts"
import { makeDelegateTask, makeBackgroundResult } from "./tools/delegate-task.ts"
import { makeHandoff } from "./tools/handoff.ts"
import { hashlineRead, hashlineEdit } from "./tools/hashline.ts"
import { allowRoot, isAllowedPath, getRoots } from "./guard.ts"
import { setSessionAgent, setSessionRoot, getSessionRoot, getPendingHandoff, clearPendingHandoff, setAgentOverride, getAgentOverride } from "./registry.ts"

interface AgentEntry {
  model: string
  fallback_models?: Array<{ model: string }>
  mode?: "primary" | "subagent" | "all"
  color?: string
  description?: string
  tools?: Record<string, boolean>
  permission?: Record<string, string>
}

interface GitMasterConfig {
  commit_footer?: boolean
  include_co_authored_by?: boolean
}

interface BrowserEngineConfig {
  provider?: string
}

interface MyAgentsConfig {
  agents: Record<string, AgentEntry>
  git_master?: GitMasterConfig
  browser_automation_engine?: BrowserEngineConfig
}

function loadConfig(): MyAgentsConfig {
  const path = join(homedir(), ".config/opencode/my-agents.json")
  return JSON.parse(readFileSync(path, "utf-8")) as MyAgentsConfig
}

function formatModel(modelID: string): string {
  return modelID.split("/").pop() ?? modelID
}

function buildGitRules(git: GitMasterConfig): string {
  const rules: string[] = []
  if (!git.commit_footer) {
    rules.push("- Do NOT add any AI-generated footer or trailer to git commit messages")
  }
  if (!git.include_co_authored_by) {
    rules.push("- Do NOT add 'Co-Authored-By' lines to git commit messages")
  }
  if (rules.length === 0) return ""
  return `\n\n## Git Rules\n${rules.join("\n")}`
}

function buildBrowserRules(browser: BrowserEngineConfig): string {
  if (!browser.provider) return ""
  return `\n\n## Browser Automation\nWhen tasks require browser interaction, use the \`${browser.provider}\` skill. Load it via \`load_skill("${browser.provider}")\` before attempting any web automation.`
}

export const server: Plugin = async (input) => {
  const cfg = loadConfig()
  const lastAgent = new Map<string, string>()
  // Sessions where the next text generation should be blanked (post-handoff silence)
  const silenceAfterHandoff = new Set<string>()

  // Capa C del guard: registrar el cwd inicial como raíz permitida para escrituras.
  allowRoot((input as any).directory ?? (input as any).worktree ?? process.cwd())

  const gitRules = cfg.git_master ? buildGitRules(cfg.git_master) : ""
  const browserRules = cfg.browser_automation_engine ? buildBrowserRules(cfg.browser_automation_engine) : ""
  const globalSuffix = gitRules + browserRules

  return {
    config: async (ocCfg) => {
      const agents: Record<string, any> = {}

      for (const [name, entry] of Object.entries(cfg.agents)) {
        const basePrompt = PROMPTS[name] ?? ""
        agents[name] = {
          model:       entry.model,
          mode:        entry.mode ?? "primary",
          color:       entry.color,
          description: entry.description,
          prompt:      basePrompt + globalSuffix,
          ...(entry.tools ? { tools: entry.tools } : {}),
          ...(entry.permission ? { permission: entry.permission } : {}),
        }
      }

      agents["plan"]    = { disable: true }
      agents["build"]   = { disable: true }
      agents["explore"] = { disable: true }
      agents["general"] = { disable: true }

      ocCfg.agent = agents
    },

    tool: {
      delegate_task:     makeDelegateTask(input.client, cfg),
      background_result: makeBackgroundResult(input.client),
      handoff:           makeHandoff(input.client),
      hashline_read:     hashlineRead,
      hashline_edit:     hashlineEdit,
    },

    "tool.execute.after": async (hookInput: any, hookOutput: any) => {
      const tool = hookInput?.tool ?? ""
      const output: unknown = hookOutput?.output

      // 1. Tool Output Truncator — evita context bloat en herramientas verbosas.
      const TRUNCATABLE = new Set(["grep", "glob", "bash", "webfetch", "lsp_diagnostics", "read"])
      if (TRUNCATABLE.has(tool) && typeof output === "string") {
        const MAX = tool === "webfetch" ? 40_000 : 150_000
        if (output.length > MAX) {
          hookOutput.output =
            output.slice(0, MAX) +
            `\n\n[... truncated — ${output.length - MAX} chars omitted to prevent context bloat ...]`
        }
      }

      // 2. Edit Error Recovery — cuando edit falla, fuerza releer el archivo antes de reintentar.
      if (tool === "edit" && typeof output === "string") {
        const EDIT_ERRORS = [
          "oldString and newString must be different",
          "oldString not found",
          "oldString found multiple times",
        ]
        const matched = EDIT_ERRORS.find((e) => output.includes(e))
        if (matched) {
          hookOutput.output =
            output +
            `\n\n⚠️ EDIT FAILED (${matched}).\n` +
            `You MUST re-read the file with the Read tool to get its current exact content before retrying. ` +
            `Do not guess or reconstruct the content from memory — read it, then edit with the exact string you see.`
        }
      }

      // 3. Empty Response Detector — avisa cuando delegate_task devuelve vacío.
      if (tool === "delegate_task" && (output === "" || output === "(no output)" || output === null || output === undefined)) {
        hookOutput.output =
          `⚠️ DELEGATE TASK returned no output. The subagent either failed silently, ` +
          `ran out of context, or was interrupted. Do not assume the task completed. ` +
          `Re-delegate with more specific instructions or a shorter scope.`
      }

      // 4. Handoff silence: blank any text Aizen generates after a SUCCESSFUL handoff.
      //    Only silence when output is empty (successful dispatch) — the dedup guard
      //    returns a non-empty error that should remain visible if it fires.
      if (tool === "handoff") {
        const sid: string | undefined = hookInput?.sessionID
        const out: unknown = hookOutput?.output
        if (sid && (out === "" || out === undefined || out === null)) {
          silenceAfterHandoff.add(sid)
        }
      }
    },

    // Capa C — Gaara Guard: bloquea write/edit fuera de las raíces de trabajo
    // permitidas (cwd inicial + cualquier `directory` delegado explícitamente).
    // Fail-open: si no hay raíces registradas, no interfiere.
    //
    // VERIFICAR CON TOKENS: la firma exacta del hook (hookInput.tool, hookOutput.args.filePath)
    // está validada por self-test con mocks, no contra el runtime real. Si en una corrida real
    // las escrituras fuera del proyecto NO se bloquean, ajustar los nombres de campo de abajo
    // (probar: hookInput.tool, y args.filePath / args.path / args.file). El acceso es defensivo:
    // si no encuentra el path, no bloquea, así que nunca rompe una escritura legítima.
    "tool.execute.before": async (hookInput: any, hookOutput: any) => {
      const toolName = hookInput?.tool ?? ""
      if (toolName !== "write" && toolName !== "edit") return
      const args = hookOutput?.args ?? {}
      const filePath: unknown = args.filePath ?? args.path ?? args.file
      if (typeof filePath !== "string" || !filePath) return
      if (!isAllowedPath(filePath)) {
        throw new Error(
          `🛑 GAARA GUARD: bloqueado intento de escribir en\n  ${filePath}\n` +
          `que está FUERA de los proyectos activos:\n` +
          getRoots().map((r) => `  - ${r}`).join("\n") +
          `\n\nSi de verdad debes trabajar en otra carpeta, delega con el parámetro ` +
          `'directory' apuntando a la ruta absoluta de ese proyecto.`
        )
      }
    },

    // 4. Compaction Context Injector — cuando el contexto se compacta, estructura
    // el resumen para preservar requests originales, trabajo hecho, pendientes y restricciones.
    "experimental.session.compacting": async (_input: any, output: any) => {
      output.context = output.context ?? []
      output.context.push(
        `When summarizing this session, your compacted summary MUST include these five sections:
1. ORIGINAL REQUESTS — list every user request verbatim, exactly as stated
2. FINAL GOAL — the overarching objective in one sentence
3. COMPLETED WORK — what was fully implemented, verified, or resolved (with file paths)
4. PENDING TASKS — what is incomplete, blocked, or not yet started
5. CONSTRAINTS & PROHIBITED APPROACHES — decisions made, patterns to follow, things explicitly ruled out

Do not omit section 5. Losing constraints causes agents to repeat rejected approaches.`
      )
    },

    // Enforces Aizen's silence after handoff. Keep silencing until session.idle
    // fires — thinking models emit multiple text.complete calls per turn, so we
    // must NOT delete from silenceAfterHandoff on the first completion.
    "experimental.text.complete": async (textInput: any, textOutput: any) => {
      const sid: string | undefined = textInput?.sessionID
      if (!sid || !silenceAfterHandoff.has(sid)) return
      textOutput.text = ""
    },

    // Handoff dispatcher: after Aizen's turn ends (session.idle), activates the
    // target agent IN THE SAME SESSION by re-prompting (now idle = no QUEUED deadlock).
    // The agent's prompt is injected via messages.transform (invisible to the user).
    event: async ({ event }) => {
      if (event.type !== "session.idle") return
      const { sessionID } = event.properties

      // Clear silence flag once the turn is fully complete
      silenceAfterHandoff.delete(sessionID)

      const handoff = getPendingHandoff(sessionID)
      if (!handoff) return
      clearPendingHandoff(sessionID)

      setAgentOverride(sessionID, handoff.agentKey)
      setSessionAgent(sessionID, handoff.agentKey)

      const [shortName] = handoff.agentKey.split(" - ")

      try {
        // Re-inject just the original task — messages.transform injects the agent
        // prompt invisibly (LLM sees it, user does not).
        await (input.client.session.prompt as any)({
          path:  { id: sessionID },
          body:  { parts: [{ type: "text", text: handoff.task }] },
          query: { directory: handoff.directory },
        })
      } catch (err) {
        try {
          await input.client.tui.showToast({
            body: {
              title:   `⚠️ Handoff falló → ${shortName}`,
              message: String(err),
              variant: "error",
              duration: 6000,
            },
          })
        } catch {}
      }
    },

    // Injects the target agent's full prompt into the FIRST user message before
    // each LLM call — invisible to the user (stored messages are not affected),
    // but the LLM receives the correct role context for every turn.
    "experimental.chat.messages.transform": async (_: any, msgOutput: any) => {
      const messages: Array<{ info: any; parts: any[] }> = msgOutput?.messages ?? []
      // Derive sessionID from any message in the history
      const sid: string | undefined = messages.find((m) => m.info?.sessionID)?.info?.sessionID
      if (!sid) return
      const overrideAgent = getAgentOverride(sid)
      if (!overrideAgent) return
      const targetPrompt = PROMPTS[overrideAgent]
      if (!targetPrompt) return
      const [shortName] = overrideAgent.split(" - ")

      // Prepend the agent override to the FIRST user message only.
      // The full history is sent each call, so we inject once at the beginning
      // to give the LLM its role context before seeing any conversation.
      const firstUser = messages.find((m) => m.info?.role === "user")
      if (!firstUser) return
      const existingText = (firstUser.parts as any[])
        .filter((p) => p.type === "text")
        .map((p) => p.text ?? "")
        .join("\n")
      firstUser.parts = [
        {
          type: "text",
          text: [
            `<agent_override>`,
            `You are now ${shortName}. Disregard your previous role. Your instructions:`,
            ``,
            targetPrompt + globalSuffix,
            `</agent_override>`,
            ``,
            existingText,
          ].join("\n"),
        },
      ]
    },

    // Limits Aizen's token output after a handoff so the response is effectively
    // empty. Works in tandem with text.complete (which blanks whatever is generated).
    "chat.params": async (paramInput: any, paramOutput: any) => {
      const sid: string | undefined = paramInput?.sessionID
      if (!sid || !silenceAfterHandoff.has(sid)) return
      paramOutput.maxOutputTokens = 10
    },

    // Keeps system.transform as a secondary mechanism — replaces Aizen's system
    // prompt with the target agent's if the hook receives the sessionID.
    "experimental.chat.system.transform": async (transformInput: any, transformOutput: any) => {
      const sid: string | undefined = transformInput?.sessionID
      if (!sid) return
      const overrideAgent = getAgentOverride(sid)
      if (!overrideAgent) return
      const targetPrompt = PROMPTS[overrideAgent]
      if (!targetPrompt) return
      transformOutput.system = [targetPrompt + globalSuffix]
    },

    "chat.message": async (msg) => {
      const agent = msg.agent
      if (!agent) return

      // Mantener el registro sessionID -> agente para el árbol de delegaciones.
      setSessionAgent(msg.sessionID, agent)

      const prev = lastAgent.get(msg.sessionID)
      if (prev === agent) return
      lastAgent.set(msg.sessionID, agent)

      const entry = cfg.agents[agent]
      if (!entry) return

      const [name, role] = agent.split(" - ")
      const model = formatModel(msg.model?.modelID ?? entry.model)

      await input.client.tui.showToast({
        body: {
          title:    `⚡ ${name}  ·  ${role?.replace(/[()]/g, "") ?? ""}`,
          message:  model || "ready",
          variant:  "info",
          duration: 3000,
        },
      })
    },
  }
}
