# Contributing

Gracias por querer mejorar el arnés. Estas son las reglas básicas.

## Estructura

```
plugin/my-agents/
  agents.ts          ← prompts de cada agente
  index.ts           ← registro del plugin + hooks
  guard.ts           ← Gaara Guard (boundary enforcement)
  registry.ts        ← sessionID → agente + raíz
  tools/
    delegate-task.ts ← herramienta delegate_task
command/             ← comandos /loop /delegations /profile
my-agents.json       ← perfil activo (symlink o copia)
my-agents.*.json     ← perfiles: free | eco | smart | optimal
```

## Añadir un agente nuevo

1. Añade su entrada en `my-agents.json` (y los otros perfiles que apliquen).
2. Añade su prompt en `PROMPTS` dentro de `agents.ts`.
3. Si es read-only, agrégalo a `READ_ONLY_AGENTS` en `tools/delegate-task.ts`.
4. Documenta su rol en `AGENTS.md` y en la tabla del `README.md`.

## Convenciones de nombre

Los agentes llevan nombre de personaje de anime relacionado con su función:

| Labor           | Arquetipo de personaje sugerido |
|-----------------|----------------------------------|
| Orquestador     | Estratega / Hokage               |
| Explorador      | Rastreador / Espía               |
| Guardián        | Defensor / Barrera               |
| Coder           | Genio científico / Inventor      |
| Revisor de plan | Rey / Héroe épico                |

## Modificar prompts

Los prompts viven en `agents.ts`. Mantén la sección **Repo Identity (CRITICAL)** en todos los agentes que puedan escribir archivos.

## Perfiles de modelo

Edita el archivo de perfil correspondiente (`my-agents.smart.json`, etc.). Para activar uno:

```bash
cp my-agents.smart.json my-agents.json
# reinicia opencode
```

O usa el comando `/profile smart` desde opencode.

## Tests

```bash
cd plugin/my-agents
bun test tests/
```

Los tests usan mocks y no consumen tokens.

## Pull requests

- Una PR por feature/fix.
- Describe el "por qué" en el cuerpo, no el "qué" (el diff ya lo dice).
- Si añades un agente, incluye un ejemplo de cuándo usarlo.
