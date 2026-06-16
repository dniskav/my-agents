/**
 * Registro sessionID -> nombre de agente.
 *
 * Permite que `delegate_task` resuelva QUIÉN está delegando (el caller),
 * cruzando el sessionID de quien llama con el agente que lo ocupa.
 * Se alimenta desde el hook `chat.message` (que ve msg.sessionID + msg.agent)
 * y desde `delegate_task` (que conoce el agente de cada child session que crea).
 */
const sessionAgent = new Map<string, string>()

export function setSessionAgent(sessionID?: string, agent?: string): void {
  if (sessionID && agent) sessionAgent.set(sessionID, agent)
}

export function getSessionAgent(sessionID?: string): string {
  return (sessionID && sessionAgent.get(sessionID)) || "root"
}

/**
 * Rastreo de la sesión RAÍZ (la del usuario/primary) a través de la cadena de
 * delegaciones. Usado para "aplanar" subagentes read-only: en vez de colgar de
 * su invocador inmediato, cuelgan de la raíz y así son visibles/inspeccionables
 * en la TUI (Ctrl+X ↓) en vivo. El árbol lógico (quién pidió) se conserva aparte
 * en el log de delegaciones (callerSession), no en este parentID.
 */
const sessionRoot = new Map<string, string>()

export function setSessionRoot(sessionID?: string, root?: string): void {
  if (sessionID && root) sessionRoot.set(sessionID, root)
}

export function getSessionRoot(sessionID?: string): string | undefined {
  return sessionID ? sessionRoot.get(sessionID) : undefined
}

/**
 * Pending handoffs: keyed by sessionID.
 * When Aizen calls `handoff`, the intent is stored here (not sent immediately).
 * The `event` hook in index.ts fires `session.prompt` when the session goes idle,
 * avoiding the QUEUED deadlock caused by re-prompting an active session.
 */
export type PendingHandoff = {
  agentKey: string
  task: string
  directory: string
}

const pendingHandoffs = new Map<string, PendingHandoff>()

export function setPendingHandoff(sessionID: string, handoff: PendingHandoff): void {
  pendingHandoffs.set(sessionID, handoff)
}

export function getPendingHandoff(sessionID: string): PendingHandoff | undefined {
  return pendingHandoffs.get(sessionID)
}

export function clearPendingHandoff(sessionID: string): void {
  pendingHandoffs.delete(sessionID)
}

/**
 * Handoff dedup guard: tracks sessions that already fired a handoff this run.
 * Prevents the infinite-loop that occurs when the re-injected prompt is handled
 * again by Aizen (who would call handoff a second time).
 */
const handoffFired = new Set<string>()

export function markHandoffFired(sessionID: string): void {
  handoffFired.add(sessionID)
}

export function hasHandoffFired(sessionID: string): boolean {
  return handoffFired.has(sessionID)
}

/**
 * Agent override: after a handoff, stores which agent should handle subsequent
 * turns in the same session. Used by `experimental.chat.system.transform` to
 * inject the target agent's system prompt, making the LLM behave as that agent
 * without creating a new session.
 */
const agentOverride = new Map<string, string>() // sessionID → agentKey

export function setAgentOverride(sessionID: string, agentKey: string): void {
  agentOverride.set(sessionID, agentKey)
}

export function getAgentOverride(sessionID: string): string | undefined {
  return agentOverride.get(sessionID)
}
