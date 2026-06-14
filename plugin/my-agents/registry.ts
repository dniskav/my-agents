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
