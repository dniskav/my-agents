# Squad Codex — Agent Reference Guide

> Complete reference for all agents in the system: their role, recommended model, and how to invoke them.

---

## English

### Agent Roster

| Agent | Mode | Primary Use | Recommended Model |
|---|---|---|---|
| **Aizen** | Primary | Entry point — analyzes any input (text/images/mixed) and routes via handoff | `qwen3.7-plus` |
| **Rimuru** | Primary | Orchestrate complex multi-step tasks | `minimax-m2.7` |
| **Norman** | Primary | Design implementation plans before executing | `minimax-m2.7` |
| **Kakashi** | Primary | Resolve a complete task end-to-end autonomously | `kimi-k2.6` |
| **Urahara** | Subagent | Deep analysis, architecture decisions, tradeoffs | `kimi-k2.6` |
| **Jiraiya** | Subagent | Navigate codebase, find files, patterns, symbols | `deepseek-v4-flash` |
| **Senku** | Subagent | Precise and surgical implementation | `kimi-k2.7-code` |
| **Rock-Lee** | Subagent | Persistent multi-file implementation until fully done | `kimi-k2.7-code` |
| **Neji** | Subagent | Run tsc, lint, tests, build — report results only (read-only) | `deepseek-v4-flash` |
| **Hange** | Subagent | E2E browser QA with playwright + chrome-devtools, categorized bug reports, never fixes (read-only) | `kimi-k2.6` |
| **Gilgamesh** | Subagent | Review plans and implementations, find gaps and risks | `minimax-m2.7` |
| **Gojo** | Subagent | Analyze screenshots, images, PDFs and diagrams | `qwen3.7-plus` |
| **Gaara** | Subagent | Verify repo identity and boundaries before any write/commit (read-only) | `deepseek-v4-flash` |
| **Shikamaru** | All (primary + subagent) | Maintain the project wiki (`docs/wiki/`) — ingest, query, lint; writes only `.md` | `kimi-k2.6` |

---

### Usage Examples

#### Primary — invoked directly by the user

**Aizen** ← user only (cannot be delegated to by other agents)
> *"[any input — text, screenshots, mixed]"*
> → Analyzes the input (including images), picks the right agent from a routing table, delegates immediately with full context, returns the result. No questions asked.

**Rimuru**
> *"Add JWT authentication to the API, including login, refresh token and route protection middleware"*
> → Classifies intent, calls Jiraiya to explore, Norman to plan, Gilgamesh to review the plan, Senku/rock-lee to implement, verifies every change.

**Norman**
> *"Plan how to migrate the payment system from Stripe v2 to v3 with no downtime"*
> → Interviews to clarify scope, investigates the codebase, produces an ordered plan with verification criteria, passes it through Gilgamesh before delivering.

**Kakashi**
> *"The /api/search endpoint takes 8 seconds, fix it"*
> → Explores on its own, diagnoses the bottleneck, implements the fix, verifies with LSP and build, QAs with curl — all without help.

---

#### Subagents — who calls them and why

**Urahara** ← Rimuru / Kakashi
> *"Should we use Redis or in-process cache for sessions? The system has 3 server instances"*
> → Rimuru calls Urahara when an architecture decision will block implementation and tradeoff analysis is needed before delegating to Norman.

**Jiraiya** ← Rimuru / Kakashi
> *"Find every place authentication is handled and what patterns they use"*
> → Rimuru calls Jiraiya before planning any feature that touches existing code, so Senku doesn't have to discover the codebase alone. Also covers reference lookup and usage examples (previously handled by index).

**Senku** ← Rimuru
> *"Edit `src/middleware/auth.ts` to add refresh token validation following the pattern in `src/middleware/csrf.ts`"*
> → Rimuru delegates to Senku when the task is clear, scoped to 1-2 files and the solution is well defined.

**Rock-Lee** ← Rimuru
> *"Replace all uses of the deprecated `useAuth()` hook with `useSession()` across the 14 components that use it"*
> → Rimuru delegates to Rock-Lee when many files are involved or obstacles are likely to come up during execution.

**Neji** ← Rimuru / Kakashi
> *"Run tsc and the test suite on the current state of the repo"*
> → Rimuru calls Neji after every implementation round to verify the build is clean before closing the task. Neji reports only — never edits.

**Gilgamesh** ← Norman / Rimuru
> *"Review this database migration plan before we execute it"*
> → Norman calls it before delivering any complex plan. Rimuru calls it after receiving the plan from Norman and before executing.

**Gojo** ← Rimuru / Kakashi
> *"The user attached a mockup of the new dashboard — describe its structure and the components we need"*
> → Rimuru or Kakashi call it when there's an image or PDF to interpret before planning or implementing.

**Neji** ← Rimuru / Kakashi
> *"Run tsc and the test suite on the current state of the repo"*
> → Rimuru calls Neji after every implementation round to verify the build is clean before closing the task. Neji reports only — never edits.

**Hange** ← Rimuru / Kakashi
> *"The admin panel is built — test all flows: login, dashboard, settings, 404 behavior"*
> → Rimuru calls Hange after implementation passes Neji checks. Hange starts the dev server, drives every flow with playwright, observes network and console with chrome-devtools, and returns a structured report (🔴 BLOCKERS / 🟡 MEDIUM / 🟢 LOW / ✅ Passing). Read-only — never fixes, never suggests code changes.
> For QA-only requests: Rimuru presents the report and stops. For implementation tasks: Rimuru fixes blockers and calls Hange again until all flows pass.

**Gilgamesh** ← Norman / Rimuru
> *"Review this database migration plan before we execute it"*
> → Norman calls it before delivering any complex plan. Rimuru calls it after receiving the plan from Norman and before executing.

**Gojo** ← Rimuru / Kakashi
> *"The user attached a mockup of the new dashboard — describe its structure and the components we need"*
> → Rimuru or Kakashi call it when there's an image or PDF to interpret before planning or implementing.

**Gaara** ← Rimuru / Kakashi
> *"We're about to write to this directory — confirm it's the neuron library and not the neuron app"*
> → Called before any write or commit when the session spans multiple projects or the target repo is ambiguous. Read-only — verdicts only, never edits.

**Shikamaru** ← user (primary) / Rimuru / Kakashi (subagent)
> *"Document this repo" / "Update the wiki after this change"*
> → Bootstraps or updates `docs/wiki/` in the target repo: architecture pages, cross-cutting concepts, distilled guides. Rimuru delegates to it after significant implementations land. Only touches `.md` files — a hard guard blocks anything else.

---
---

## Español

### Tabla de Agentes

| Agente | Modo | Uso principal | Modelo recomendado |
|---|---|---|---|
| **Aizen** | Principal | Punto de entrada — analiza cualquier input (texto/imágenes/mixto) y enruta via handoff | `qwen3.7-plus` |
| **Rimuru** | Principal | Orquestar tareas complejas multi-paso | `minimax-m2.7` |
| **Norman** | Principal | Diseñar planes de implementación antes de ejecutar | `minimax-m2.7` |
| **Kakashi** | Principal | Resolver una tarea completa end-to-end solo | `kimi-k2.6` |
| **Urahara** | Subagente | Análisis profundo, decisiones de arquitectura, tradeoffs | `kimi-k2.6` |
| **Jiraiya** | Subagente | Navegar el codebase, encontrar archivos, patrones, símbolos | `deepseek-v4-flash` |
| **Senku** | Subagente | Implementación precisa y quirúrgica | `kimi-k2.7-code` |
| **Rock-Lee** | Subagente | Implementación persistente multi-archivo hasta completar | `kimi-k2.7-code` |
| **Neji** | Subagente | Ejecutar tsc, lint, tests, build — solo reporta resultados (solo lectura) | `deepseek-v4-flash` |
| **Hange** | Subagente | QA E2E con playwright + chrome-devtools, reporte categorizado de bugs, nunca arregla (solo lectura) | `kimi-k2.6` |
| **Gilgamesh** | Subagente | Revisar planes e implementaciones, encontrar gaps y riesgos | `minimax-m2.7` |
| **Gojo** | Subagente | Analizar screenshots, imágenes, PDFs y diagramas | `qwen3.7-plus` |
| **Gaara** | Subagente | Verificar identidad del repo y límites antes de cualquier escritura/commit (solo lectura) | `deepseek-v4-flash` |
| **Shikamaru** | Todos (principal + subagente) | Mantener la wiki del proyecto (`docs/wiki/`) — ingest, query, lint; solo escribe `.md` | `kimi-k2.6` |

---

### Ejemplos de uso

#### Principales — el usuario los invoca directamente

**Aizen** ← solo el usuario (ningún agente puede delegarle)
> *"[cualquier input — texto, screenshots, mixed]"*
> → Analiza el input (incluyendo imágenes), elige el agente correcto de una tabla de routing, delega de inmediato con el contexto completo, devuelve el resultado. Sin preguntas.

**Rimuru**
> *"Agrega autenticación JWT a la API, incluyendo login, refresh token y middleware de protección de rutas"*
> → Clasifica intent, llama a Jiraiya para explorar, Norman para planear, Gilgamesh para revisar el plan, Senku/rock-lee para implementar, verifica cada cambio.

**Norman**
> *"Planea cómo migrar el sistema de pagos de Stripe v2 a v3 sin downtime"*
> → Entrevista para clarificar scope, investiga el codebase, produce plan con tasks ordenadas y criterios de verificación, lo pasa por Gilgamesh antes de entregar.

**Kakashi**
> *"El endpoint /api/search tarda 8 segundos, arréglalo"*
> → Explora solo con sus herramientas, diagnostica el cuello de botella, implementa la solución, verifica con LSP y build, hace QA con curl — todo sin ayuda.

---

#### Subagentes — quién los llama y para qué

**Urahara** ← Rimuru / Kakashi
> *"¿Usamos Redis o un cache en proceso para las sesiones? El sistema tiene 3 instancias del servidor"*
> → Rimuru llama a Urahara cuando una decisión de arquitectura bloqueará la implementación y necesita análisis de tradeoffs antes de delegarle a Norman.

**Jiraiya** ← Rimuru / Kakashi
> *"Encuentra todos los lugares donde se maneja autenticación y qué patrones usan"*
> → Rimuru llama a Jiraiya antes de planear cualquier feature que toque código existente, para que Senku no tenga que descubrir el codebase solo. También cubre búsqueda de referencias y ejemplos de uso (rol que antes tenía index).

**Senku** ← Rimuru
> *"Edita `src/middleware/auth.ts` para agregar validación de token de refresh según el patrón en `src/middleware/csrf.ts`"*
> → Rimuru lo delega cuando la tarea es clara, acotada a 1-2 archivos y la solución está bien definida.

**Rock-Lee** ← Rimuru
> *"Reemplaza todos los usos del hook deprecated `useAuth()` por `useSession()` en los 14 componentes que lo usan"*
> → Rimuru lo delega cuando hay muchos archivos involucrados o es probable que surjan obstáculos durante la ejecución.

**Neji** ← Rimuru / Kakashi
> *"Ejecuta tsc y la suite de tests sobre el estado actual del repo"*
> → Rimuru llama a Neji después de cada ronda de implementación para verificar que el build está limpio antes de cerrar la tarea. Solo reporta — nunca edita.

**Gilgamesh** ← Norman / Rimuru
> *"Revisa este plan de migración de base de datos antes de que lo ejecutemos"*
> → Norman lo llama antes de entregar cualquier plan complejo. Rimuru lo llama después de recibir el plan de Norman y antes de ejecutar.

**Hange** ← Rimuru / Kakashi
> *"El admin panel está listo — probá todos los flujos: login, dashboard, configuración, 404"*
> → Rimuru llama a Hange después de que la implementación pasa los checks de Neji. Hange levanta el servidor, recorre cada flujo con playwright, observa red y consola con chrome-devtools, y entrega un reporte estructurado (🔴 BLOCKERS / 🟡 MEDIUM / 🟢 LOW / ✅ Passing). Solo lectura — nunca arregla, nunca sugiere código.
> Para requests de solo QA: Rimuru presenta el reporte y para. Para tareas de implementación: Rimuru arregla los blockers y vuelve a llamar a Hange hasta que todos los flujos pasen.

**Gilgamesh** ← Norman / Rimuru
> *"Revisa este plan de migración de base de datos antes de que lo ejecutemos"*
> → Norman lo llama antes de entregar cualquier plan complejo. Rimuru lo llama después de recibir el plan de Norman y antes de ejecutar.

**Gojo** ← Rimuru / Kakashi
> *"El usuario adjuntó un mockup del nuevo dashboard — describe la estructura y los componentes que necesitamos"*
> → Rimuru o Kakashi lo llaman cuando hay una imagen o PDF que interpretar antes de poder planear o implementar.

**Gaara** ← Rimuru / Kakashi
> *"Vamos a escribir en este directorio — confirma que es la librería neuron y no la app neuron"*
> → Se llama antes de cualquier escritura o commit cuando la sesión abarca múltiples proyectos o el repo destino es ambiguo. Solo lectura — emite veredictos, nunca edita.

**Shikamaru** ← usuario (principal) / Rimuru / Kakashi (subagente)
> *"Documenta este repo" / "Actualiza la wiki después de este cambio"*
> → Crea o actualiza `docs/wiki/` en el repo destino: páginas de arquitectura, conceptos transversales, guías destiladas. Rimuru lo delega después de que aterrizan implementaciones importantes. Solo toca archivos `.md` — un guard duro bloquea cualquier otra cosa.
