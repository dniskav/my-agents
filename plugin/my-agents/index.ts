import type { Plugin } from "@opencode-ai/plugin"
import { readFileSync } from "fs"
import { join } from "path"
import { homedir } from "os"
import { PROMPTS } from "./agents.ts"
import { makeDelegateTask, makeBackgroundResult } from "./tools/delegate-task.ts"
import { allowRoot, isAllowedPath, getRoots } from "./guard.ts"
import { setSessionAgent } from "./registry.ts"

interface AgentEntry {
  model: string
  fallback_models?: Array<{ model: string }>
  mode?: "primary" | "subagent" | "all"
  color?: string
  description?: string
  tools?: Record<string, boolean>
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
