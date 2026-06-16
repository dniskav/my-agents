import { tool } from "@opencode-ai/plugin"
import type { PluginInput } from "@opencode-ai/plugin"
import { readFileSync, appendFileSync, writeFileSync, mkdirSync } from "fs"
import { join } from "path"
import { allowRoot } from "../guard.ts"
import { setSessionAgent, getSessionAgent, setSessionRoot, getSessionRoot } from "../registry.ts"

/** Subagentes read-only: se "aplanan" a la sesión raíz para ser visibles en vivo
 *  en la TUI (Ctrl+X ↓). No escriben, así que el riesgo de sesiones huérfanas
 *  al perder la anidación es trivial. Los que escriben se mantienen anidados. */
const READ_ONLY_AGENTS = new Set([
  "Gilgamesh - (Plan Reviewer)",
  "Jiraiya - (Explorer)",
  "Gaara - (Guardian)",
  "Neji - (Verifier)",
])

// Agents that exist in the system but cannot be delegated to programmatically.
// Aizen is the user-facing entry point — calling it from inside the harness
// would create a routing loop with no value.
const DISPATCH_ONLY_AGENTS = new Set(["aizen"])

const AGENT_ALIASES: Record<string, string> = {
  Rimuru:    "Rimuru - (Orchestrator)",
  Norman:    "Norman - (Planner)",
  Urahara:   "Urahara - (Oracle)",
  Jiraiya:   "Jiraiya - (Explorer)",
  Kakashi:   "Kakashi - (Deep Worker)",
  Senku:     "Senku - (Coder)",
  "Rock-Lee": "Rock-Lee - (Executor)",
  Neji:      "Neji - (Verifier)",
  Gilgamesh: "Gilgamesh - (Plan Reviewer)",
  Gojo:      "Gojo - (Vision)",
  Gaara:     "Gaara - (Guardian)",
}

interface AgentsConfig {
  agents: Record<string, { model: string }>
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function formatModel(modelID: string): string {
  return modelID.split("/").pop() ?? modelID
}

/** Deriva un motivo corto: el campo `reason`, o la primera línea útil del task. */
function deriveReason(task: string, reason?: string): string {
  if (reason && reason.trim()) return reason.trim().slice(0, 120)
  const firstLine = task.split("\n").map((l) => l.trim()).find((l) => l.length > 0) ?? ""
  return firstLine.replace(/^TASK:\s*/i, "").slice(0, 120)
}

/** Append-only log del árbol de delegaciones, por proyecto, en .tmp/delegations.jsonl */
function logDelegation(rootDir: string, entry: Record<string, unknown>): void {
  try {
    const dir = join(rootDir, ".tmp")
    mkdirSync(dir, { recursive: true })
    appendFileSync(join(dir, "delegations.jsonl"), JSON.stringify(entry) + "\n")
  } catch {
    // logging es best-effort — nunca debe romper una delegación
  }
}

/** Persiste el transcript completo (prompt enviado + respuesta) de una delegación
 *  en .tmp/delegations/{childSession}.md, para inspeccionar su razonamiento después
 *  (incluso si fue una sesión anidada que no aparece en la TUI). */
function writeTranscript(
  rootDir: string,
  childSession: string,
  meta: Record<string, unknown>,
  prompt: string,
  response: string,
): void {
  try {
    const dir = join(rootDir, ".tmp", "delegations")
    mkdirSync(dir, { recursive: true })
    const header =
      `# ${meta.callee}  ← ${meta.caller}\n\n` +
      `- reason: ${meta.reason}\n` +
      `- model: ${meta.model}\n` +
      `- directory: ${meta.directory}\n` +
      `- started: ${meta.ts}\n` +
      `- duration: ${meta.durationMs}ms${meta.timedOut ? " (TIMEOUT)" : ""}\n` +
      `- session: ${childSession}\n`
    const body = `\n## Prompt sent\n\n${prompt}\n\n## Response\n\n${response || "(no output)"}\n`
    writeFileSync(join(dir, `${childSession}.md`), header + body)
  } catch {
    // best-effort
  }
}

/** Shared logic: build prompt, create session, send prompt. Returns sessionID. */
async function spawnSession(
  client: PluginInput["client"],
  {
    agentKey,
    workdir,
    parentID,
    prompt,
  }: { agentKey: string; workdir: string; parentID: string; prompt: string },
): Promise<string> {
  const created = await client.session.create({
    body: { parentID },
    query: { directory: workdir },
  })
  const sessionID = (created.data as any)?.id as string | undefined
  if (!sessionID) throw new Error("could not create subagent session")

  await client.session.prompt({
    path: { id: sessionID },
    body: {
      agent: agentKey,
      parts: [{ type: "text", text: prompt }],
    } as any,
    query: { directory: workdir },
  })

  return sessionID
}

/** Shared logic: poll until idle, fetch last assistant message. */
async function waitForResult(
  client: PluginInput["client"],
  sessionID: string,
  workdir: string,
  timeoutMs: number,
): Promise<{ text: string; timedOut: boolean }> {
  const maxAttempts = Math.max(1, Math.ceil(timeoutMs / 500))
  let timedOut = false
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(500)
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

export function makeDelegateTask(client: PluginInput["client"], cfg: AgentsConfig) {
  return tool({
    description: `Delegate a task to a specialized subagent.
Available agents: ${Object.keys(AGENT_ALIASES).join(", ")}.
Use the short alias (e.g. "Senku") — the tool resolves the full name automatically.

Agents and when to use them:
- Rimuru: orchestrate nested multi-step tasks
- Norman: produce a full implementation plan
- Urahara: deep analysis, tradeoffs, strategic questions
- Jiraiya: explore codebase — find files, symbols, patterns, docs and usage examples (read-only)
- Kakashi: autonomous end-to-end work — one agent explores, implements, verifies and QAs solo
- Senku: implement code — write, edit, refactor (precise, surgical)
- Rock-Lee: implement with persistence — multi-file changes, iterative fixes, keep going until done
- Neji: run quality checks — tsc, lint, tests, build — and report results (read-only)
- Gilgamesh: review a plan or implementation for gaps and risks
- Gojo: analyze screenshots, images, diagrams
- Gaara: repo-identity & boundary guardian — verify you're in the right repo before writes/commits

BACKGROUND MODE: set background=true to fire-and-forget — returns a task_id immediately so you
can launch multiple agents in parallel. Retrieve results later with background_result(task_id).
Use background=true when tasks are independent and you don't need the result before starting others.
Use background=false (default) when the result is needed before the next step.

IMPORTANT: if the task targets a DIFFERENT project than where opencode was launched,
you MUST pass the absolute path of that project via the \`directory\` argument, or the
subagent will run in the wrong working directory.`,

    args: {
      agent: tool.schema
        .string()
        .describe("Short agent name: Rimuru | Norman | Urahara | Jiraiya | Kakashi | Senku | Rock-Lee | Neji | Gilgamesh | Gojo | Gaara"),
      task: tool.schema
        .string()
        .describe("Full task description — be explicit, include all needed context inline. Use the 6-section format when delegating complex work: TASK / EXPECTED OUTCOME / TOOLS TO USE / MUST DO / MUST NOT DO / CONTEXT"),
      context: tool.schema
        .string()
        .optional()
        .describe("Optional extra context appended after the task (file paths, prior findings, constraints)"),
      reason: tool.schema
        .string()
        .optional()
        .describe("Short one-line WHY for this delegation (e.g. 'validate the plan before execution'). Recorded in the delegation tree. If omitted, derived from the task's first line."),
      notepadPath: tool.schema
        .string()
        .optional()
        .describe("Path to session notepad file relative to the working directory (e.g. '.rimuru/notepad.md'). If provided, its content is injected as Inherited Wisdom so the subagent benefits from accumulated session knowledge."),
      directory: tool.schema
        .string()
        .optional()
        .describe("Absolute path of the working directory for the subagent. Defaults to the current session directory. REQUIRED when the task targets a different project/folder than where opencode was launched — otherwise the subagent edits the wrong repo."),
      timeoutMs: tool.schema
        .number()
        .optional()
        .describe("Max time to wait for the subagent before flagging a timeout. Defaults to 300000 (5 min). Raise it for long persistent work (Rock-Lee, Kakashi). Ignored in background mode."),
      background: tool.schema
        .boolean()
        .optional()
        .describe("Fire-and-forget mode. Returns task_id immediately — use background_result(task_id) to retrieve the result later. Use this to run independent agents in true parallel."),
    },

    async execute({ agent, task, context, reason, notepadPath, directory, timeoutMs, background }, ctx) {
      const normalized = agent.toLowerCase().trim()

      if (DISPATCH_ONLY_AGENTS.has(normalized)) {
        return {
          output: `⛔ Cannot delegate to Aizen — it is the user-facing entry point, not a subagent. ` +
                  `Aizen routes tasks to the squad; the squad does not route back to Aizen.`,
        }
      }

      const agentKey =
        Object.entries(AGENT_ALIASES).find(([k]) => k.toLowerCase() === normalized)?.[1] ?? agent
      const workdir = directory ?? ctx.directory
      const caller = getSessionAgent(ctx.sessionID)
      const reasonText = deriveReason(task, reason)
      const startedAt = Date.now()

      allowRoot(workdir)

      let inheritedWisdom = ""
      if (notepadPath) {
        try {
          const notepadContent = readFileSync(join(workdir, notepadPath), "utf-8").trim()
          if (notepadContent) {
            inheritedWisdom = `\n\n## Inherited Wisdom\n${notepadContent}`
          }
        } catch {
          // notepad doesn't exist yet — that's fine
        }
      }

      const dirNotice =
        directory && directory !== ctx.directory
          ? `\n\n## Working Directory\nYou are operating in: ${workdir}\nThis is DIFFERENT from where opencode was launched. Run \`pwd\` and \`git remote -v\` first and confirm this is the intended project before any write or commit.`
          : ""

      const prompt = context
        ? `${task}\n\n## Context\n${context}${dirNotice}${inheritedWisdom}`
        : `${task}${dirNotice}${inheritedWisdom}`

      ctx.metadata({ title: `→ ${agentKey}${background ? " [bg]" : ""}` })

      const rootSession = getSessionRoot(ctx.sessionID) ?? ctx.sessionID
      // Background tasks always attach to rootSession so they appear in the TUI sidebar.
      // Sync writer agents stay nested under the caller for in-context visibility.
      const parentID = (background || READ_ONLY_AGENTS.has(agentKey)) ? rootSession : ctx.sessionID

      const sessionID = await spawnSession(client, { agentKey, workdir, parentID, prompt })

      setSessionAgent(sessionID, agentKey)
      setSessionRoot(sessionID, rootSession)

      const [shortName] = agentKey.split(" - ")
      try {
        await client.tui.showToast({
          body: {
            title:    `🤖 ${shortName}${background ? " [bg]" : ""} corriendo`,
            message:  background ? "Visible en el sidebar — usa background_result para recoger el resultado" : "Ctrl+X ↓ para ver los subagentes",
            variant:  "info",
            duration: 4000,
          },
        })
      } catch {
        // showToast no disponible (headless) — ignorar
      }

      // Background mode: return immediately with task_id
      if (background) {
        logDelegation(ctx.directory, {
          ts: new Date(startedAt).toISOString(),
          caller,
          callerSession: ctx.sessionID,
          callee: agentKey,
          childSession: sessionID,
          reason: reasonText,
          directory: workdir,
          model: formatModel(cfg.agents[agentKey]?.model ?? agentKey),
          background: true,
        })
        return {
          output: `Background task started. task_id: ${sessionID}`,
          metadata: { task_id: sessionID, agent: agentKey, directory: workdir, background: true },
        }
      }

      // Sync mode: poll until done
      const { text, timedOut } = await waitForResult(client, sessionID, workdir, timeoutMs ?? 300_000)

      const modelID = cfg.agents[agentKey]?.model ?? agentKey
      const durationMs = Date.now() - startedAt

      const edge = {
        ts: new Date(startedAt).toISOString(),
        caller,
        callerSession: ctx.sessionID,
        callee: agentKey,
        childSession: sessionID,
        reason: reasonText,
        directory: workdir,
        model: formatModel(modelID),
        durationMs,
        timedOut,
      }
      logDelegation(ctx.directory, edge)
      writeTranscript(ctx.directory, sessionID, edge, prompt, text)

      return {
        output: timedOut ? `[TIMEOUT after ${Math.round((timeoutMs ?? 300_000) / 1000)}s]\n\n${text || "(no output)"}` : text || "(no output)",
        metadata: { agent: agentKey, model: formatModel(modelID), sessionID, timedOut, directory: workdir, caller, reason: reasonText, durationMs },
      }
    },
  })
}

export function makeBackgroundResult(client: PluginInput["client"]) {
  return tool({
    description: `Retrieve the result of a background task started with delegate_task(background=true).
Blocks until the session is idle, then returns the full result.
Use this after launching multiple background agents to collect their outputs.`,

    args: {
      task_id: tool.schema
        .string()
        .describe("The task_id returned by delegate_task(background=true)"),
      directory: tool.schema
        .string()
        .optional()
        .describe("Working directory of the background session. Defaults to current directory."),
      timeoutMs: tool.schema
        .number()
        .optional()
        .describe("Max wait time in ms. Defaults to 300000 (5 min)."),
    },

    async execute({ task_id, directory, timeoutMs }, ctx) {
      const workdir = directory ?? ctx.directory
      const { text, timedOut } = await waitForResult(client, task_id, workdir, timeoutMs ?? 300_000)

      try {
        await client.tui.showToast({
          body: {
            title:    "✅ Background task complete",
            message:  task_id.slice(0, 16),
            variant:  "success",
            duration: 3000,
          },
        })
      } catch {}

      return {
        output: timedOut
          ? `[TIMEOUT after ${Math.round((timeoutMs ?? 300_000) / 1000)}s]\n\n${text || "(no output)"}`
          : text || "(no output)",
        metadata: { task_id, timedOut },
      }
    },
  })
}
