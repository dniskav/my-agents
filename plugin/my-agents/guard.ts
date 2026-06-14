import { resolve } from "path"

/**
 * Boundary guard (capa C del "Gaara Guard").
 *
 * Mantiene un allowlist de raíces de trabajo permitidas para escrituras.
 * - El cwd inicial de opencode se registra al arrancar el plugin.
 * - Cada delegación con `directory` explícito registra esa ruta.
 *
 * Filosofía fail-open: si NO hay raíces registradas, no se aplica enforcement
 * (no rompe sesiones normales). Si hay raíces, una escritura fuera de TODAS
 * ellas se bloquea — evita que un subagente toque un repo que no es el objetivo.
 */
const allowedRoots = new Set<string>()

export function allowRoot(dir?: string): void {
  if (dir && dir.trim()) allowedRoots.add(resolve(dir))
}

export function getRoots(): string[] {
  return [...allowedRoots]
}

export function isAllowedPath(filePath: string): boolean {
  if (allowedRoots.size === 0) return true // fail-open: sin roots → sin enforcement
  const target = resolve(filePath)
  for (const root of allowedRoots) {
    if (target === root || target.startsWith(root + "/")) return true
  }
  return false
}
