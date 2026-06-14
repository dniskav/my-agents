# Squad Codex — Agent Reference Guide

> Complete reference for all agents in the system: their role, recommended model, and how to invoke them.

---

## English

### Agent Roster

| Agent | Mode | Primary Use | Recommended Model |
|---|---|---|---|
| **rimuru** | Primary | Orchestrate complex multi-step tasks | `kimi-k2.6` |
| **norman** | Primary | Design implementation plans before executing | `minimax-m2.7` |
| **kakashi** | Primary | Resolve a complete task end-to-end autonomously | `deepseek-v4-pro` |
| **urahara** | Subagent | Deep analysis, architecture decisions, tradeoffs | `kimi-k2.6` |
| **jiraiya** | Subagent | Navigate codebase, find files, patterns, symbols | `deepseek-v4-flash` |
| **senku** | Subagent | Precise and surgical implementation | `mimo-v2.5-pro` |
| **rock-lee** | Subagent | Persistent multi-file implementation until fully done | `mimo-v2.5-pro` |
| **killua** | Subagent | Fast isolated tasks: renames, typos, simple edits | `deepseek-v4-flash` |
| **gilgamesh** | Subagent | Review plans and implementations, find gaps and risks | `minimax-m2.7` |
| **index** | Subagent | Find references, docs and usage examples in the codebase | `qwen3.6-plus` |
| **gojo** | Subagent | Analyze screenshots, images, PDFs and diagrams | `mimo-v2.5` |

---

### Usage Examples

#### Primary — invoked directly by the user

**rimuru**
> *"Add JWT authentication to the API, including login, refresh token and route protection middleware"*
> → Classifies intent, calls jiraiya to explore, norman to plan, gilgamesh to review the plan, senku/rock-lee to implement, verifies every change.

**norman**
> *"Plan how to migrate the payment system from Stripe v2 to v3 with no downtime"*
> → Interviews to clarify scope, investigates the codebase, produces an ordered plan with verification criteria, passes it through gilgamesh before delivering.

**kakashi**
> *"The /api/search endpoint takes 8 seconds, fix it"*
> → Explores on its own, diagnoses the bottleneck, implements the fix, verifies with LSP and build, QAs with curl — all without help.

---

#### Subagents — who calls them and why

**urahara** ← rimuru / kakashi
> *"Should we use Redis or in-process cache for sessions? The system has 3 server instances"*
> → Rimuru calls urahara when an architecture decision will block implementation and tradeoff analysis is needed before delegating to norman.

**jiraiya** ← rimuru / kakashi
> *"Find every place authentication is handled and what patterns they use"*
> → Rimuru calls jiraiya before planning any feature that touches existing code, so senku doesn't have to discover the codebase alone.

**senku** ← rimuru
> *"Edit `src/middleware/auth.ts` to add refresh token validation following the pattern in `src/middleware/csrf.ts`"*
> → Rimuru delegates to senku when the task is clear, scoped to 1-2 files and the solution is well defined.

**rock-lee** ← rimuru
> *"Replace all uses of the deprecated `useAuth()` hook with `useSession()` across the 14 components that use it"*
> → Rimuru delegates to rock-lee when many files are involved or obstacles are likely to come up during execution.

**killua** ← rimuru
> *"Rename the variable `usr` to `user` in `auth.ts` line 42"*
> → Rimuru delegates to killua when the task is so simple it doesn't justify the overhead of senku.

**gilgamesh** ← norman / rimuru
> *"Review this database migration plan before we execute it"*
> → Norman calls it before delivering any complex plan. Rimuru calls it after receiving the plan from norman and before executing.

**index** ← rimuru / kakashi
> *"How is the Repository pattern implemented in this codebase? Give me examples with file:line"*
> → Any agent calls it when they need to know how something is done *here*, without having to explore the full codebase.

**gojo** ← rimuru / kakashi
> *"The user attached a mockup of the new dashboard — describe its structure and the components we need"*
> → Rimuru or kakashi call it when there's an image or PDF to interpret before planning or implementing.

---
---

## Español

### Tabla de Agentes

| Agente | Modo | Uso principal | Modelo recomendado |
|---|---|---|---|
| **rimuru** | Principal | Orquestar tareas complejas multi-paso | `kimi-k2.6` |
| **norman** | Principal | Diseñar planes de implementación antes de ejecutar | `minimax-m2.7` |
| **kakashi** | Principal | Resolver una tarea completa end-to-end solo | `deepseek-v4-pro` |
| **urahara** | Subagente | Análisis profundo, decisiones de arquitectura, tradeoffs | `kimi-k2.6` |
| **jiraiya** | Subagente | Navegar el codebase, encontrar archivos, patrones, símbolos | `deepseek-v4-flash` |
| **senku** | Subagente | Implementación precisa y quirúrgica | `mimo-v2.5-pro` |
| **rock-lee** | Subagente | Implementación persistente multi-archivo hasta completar | `mimo-v2.5-pro` |
| **killua** | Subagente | Tareas rápidas aisladas: renombrar, typos, edits simples | `deepseek-v4-flash` |
| **gilgamesh** | Subagente | Revisar planes e implementaciones, encontrar gaps y riesgos | `minimax-m2.7` |
| **index** | Subagente | Buscar referencias, docs y ejemplos de uso en el codebase | `qwen3.6-plus` |
| **gojo** | Subagente | Analizar screenshots, imágenes, PDFs y diagramas | `mimo-v2.5` |

---

### Ejemplos de uso

#### Principales — el usuario los invoca directamente

**rimuru**
> *"Agrega autenticación JWT a la API, incluyendo login, refresh token y middleware de protección de rutas"*
> → Clasifica intent, llama a jiraiya para explorar, norman para planear, gilgamesh para revisar el plan, senku/rock-lee para implementar, verifica cada cambio.

**norman**
> *"Planea cómo migrar el sistema de pagos de Stripe v2 a v3 sin downtime"*
> → Entrevista para clarificar scope, investiga el codebase, produce plan con tasks ordenadas y criterios de verificación, lo pasa por gilgamesh antes de entregar.

**kakashi**
> *"El endpoint /api/search tarda 8 segundos, arréglalo"*
> → Explora solo con sus herramientas, diagnostica el cuello de botella, implementa la solución, verifica con LSP y build, hace QA con curl — todo sin ayuda.

---

#### Subagentes — quién los llama y para qué

**urahara** ← rimuru / kakashi
> *"¿Usamos Redis o un cache en proceso para las sesiones? El sistema tiene 3 instancias del servidor"*
> → Rimuru llama a urahara cuando una decisión de arquitectura bloqueará la implementación y necesita análisis de tradeoffs antes de delegarle a norman.

**jiraiya** ← rimuru / kakashi
> *"Encuentra todos los lugares donde se maneja autenticación y qué patrones usan"*
> → Rimuru llama a jiraiya antes de planear cualquier feature que toque código existente, para que senku no tenga que descubrir el codebase solo.

**senku** ← rimuru
> *"Edita `src/middleware/auth.ts` para agregar validación de token de refresh según el patrón en `src/middleware/csrf.ts`"*
> → Rimuru lo delega cuando la tarea es clara, acotada a 1-2 archivos y la solución está bien definida.

**rock-lee** ← rimuru
> *"Reemplaza todos los usos del hook deprecated `useAuth()` por `useSession()` en los 14 componentes que lo usan"*
> → Rimuru lo delega cuando hay muchos archivos involucrados o es probable que surjan obstáculos durante la ejecución.

**killua** ← rimuru
> *"Renombra la variable `usr` a `user` en `auth.ts` línea 42"*
> → Rimuru lo delega cuando la tarea es tan simple que no justifica el overhead de senku.

**gilgamesh** ← norman / rimuru
> *"Revisa este plan de migración de base de datos antes de que lo ejecutemos"*
> → Norman lo llama antes de entregar cualquier plan complejo. Rimuru lo llama después de recibir el plan de norman y antes de ejecutar.

**index** ← rimuru / kakashi
> *"¿Cómo se implementa el patrón Repository en este codebase? Dame ejemplos con file:line"*
> → Cualquier agente lo llama cuando necesita saber cómo algo se hace *aquí*, sin tener que explorar el codebase completo.

**gojo** ← rimuru / kakashi
> *"El usuario adjuntó un mockup del nuevo dashboard — describe la estructura y los componentes que necesitamos"*
> → Rimuru o kakashi lo llaman cuando hay una imagen o PDF que interpretar antes de poder planear o implementar.
