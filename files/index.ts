import type { Plugin } from "@opencode-ai/plugin"
import { readFileSync } from "fs"
import { join } from "path"
import { homedir } from "os"
import { PROMPTS } from "./agents.ts"
import { makeDelegateTask } from "./tools/delegate-task.ts"

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
          ...(entry.fallback_models ? { fallback_models: entry.fallback_models } : {}),
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
      delegate_task: makeDelegateTask(input.client, cfg),
    },

    "chat.message": async (msg) => {
      const agent = msg.agent
      if (!agent) return

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
