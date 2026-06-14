# AGENTS.md

This is a custom opencode configuration with a multi-agent plugin system. When you land here, you are operating inside that system.

## What this is

A hand-crafted agent squad built on top of opencode, inspired by oh-my-openagent. Each agent has a defined role, a curated prompt, and a recommended model. The system is orchestrated by **rimuru**, who delegates to specialists via the `delegate_task` tool.

The plugin lives at `plugin/my-agents/`. Configuration variants (eco/smart/optimal) live at the root as `my-agents.*.json`.

## The Squad

| Agent | Mode | Role |
|---|---|---|
| **rimuru** | Primary | Orchestrator — classifies intent, plans, delegates, verifies |
| **norman** | Primary | Planner — interviews, produces rigorous plans, validates with gilgamesh |
| **kakashi** | Primary | Deep Worker — autonomous end-to-end: explore → implement → QA solo |
| **urahara** | Subagent | Oracle — architecture decisions, tradeoffs, strategic reasoning |
| **jiraiya** | Subagent | Explorer & Librarian — codebase navigation, file search, pattern discovery, reference lookup |
| **senku** | Subagent | Coder — precise surgical implementation, 1-2 files |
| **rock-lee** | Subagent | Executor — persistent multi-file implementation until fully done |
| **neji** | Subagent | Verifier — runs tsc, lint, tests and build; reports results only (read-only) |
| **gilgamesh** | Subagent | Plan Reviewer — ruthless critic, APPROVED / REVISIONS NEEDED / REJECTED |
| **gojo** | Subagent | Vision — screenshots, images, PDFs, diagrams |
| **gaara** | Subagent | Guardian — repo-identity & boundary checks before writes/commits (read-only) |

Full reference with examples: `squad-codex.md`

## How the system works

### Delegation
Agents talk to each other via the `delegate_task` tool. Use the short alias (`rimuru`, `senku`, `rock-lee`, etc.) — the tool resolves the full name automatically.

```
delegate_task(
  agent: "senku",
  task: "...",         // 6-section format for complex work
  context: "...",      // optional extra context
  notepad: ".rimuru/notepad.md", // optional — injects session memory
  directory: "/abs/path/to/project", // optional — REQUIRED if the task targets a
                                     // different project than the launch cwd
  timeoutMs: 600000    // optional — raise for long persistent work (default 5min)
)
```

### Repo-identity guard (Gaara Guard)
A session can span multiple projects, but the working directory does **not** follow the project the user names. Three layers prevent cross-project contamination:
- **A — `directory` param**: pass the target project's absolute path so the subagent runs there (and its writes are whitelisted).
- **B — prompts**: rimuru/kakashi/senku/rock-lee verify `git remote -v` vs the task's target before writing; delegate to **gaara** to adjudicate when unsure.
- **C — `tool.execute.before` hook**: hard-blocks any write/edit whose path falls outside the active project roots (cwd + delegated `directory`s). Fail-open if no roots are registered.

### Session memory (notepad)
Rimuru maintains `.rimuru/notepad.md` in the project root across a session. Before each delegation, pass it via the `notepad` parameter so subagents inherit accumulated knowledge (conventions, decisions, gotchas). After each delegation, extract key findings and append them to the notepad.

### Delegation prompt format (mandatory for complex work)
```
TASK: [one atomic, specific action]
EXPECTED OUTCOME: [concrete deliverable + how to verify]
REQUIRED TOOLS: [explicit list]
MUST DO: [exhaustive requirements]
MUST NOT DO: [forbidden actions]
CONTEXT: [file paths, patterns, prior findings]
```

### Plan → Review → Execute loop
1. **norman** produces the plan (interviews first for complex tasks)
2. **gilgamesh** reviews it — APPROVED before rimuru executes
3. **rimuru** delegates implementation to senku / rock-lee
4. **rimuru** reads every changed file after delegation — doesn't trust self-reports

## Key files

```
.config/opencode/
├── AGENTS.md                  ← you are here
├── squad-codex.md             ← full agent reference with examples
├── opencode.json              ← MCP servers and plugins
├── my-agents.json             ← agent models (main config)
├── my-agents.free.json        ← FREE models (opencode zen: nemotron-3-ultra, big-pickle, …)
├── my-agents.eco.json         ← cheap models variant (opencode-go)
├── my-agents.smart.json       ← balanced models variant (opencode-go)
├── my-agents.optimal.json     ← best models variant (opencode-go)
├── plugin/my-agents/
│   ├── agents.ts              ← all agent system prompts
│   ├── guard.ts               ← write-boundary allowlist (Gaara Guard)
│   ├── registry.ts            ← sessionID→agent / sessionID→root maps
│   ├── index.ts               ← plugin entrypoint
│   └── tools/
│       └── delegate-task.ts   ← delegation tool implementation
├── context/                   ← shared context injected into sessions
├── skills/                    ← loadable skill packs
└── command/                   ← slash commands
```

## Switching config variants

The active config is loaded from `my-agents.json`. To switch variants, copy the desired file over it (e.g. `cp my-agents.optimal.json my-agents.json`):
- **free** — zero-cost opencode zen models (`nemotron-3-ultra-free`, `big-pickle`, `deepseek-v4-flash-free`, `mimo-v2.5-free` for vision, `north-mini-code-free`). Uses the `opencode/` provider, not `opencode-go/`. Great when you've hit the paid quota.
- **eco** — cheapest paid (opencode-go): mostly `deepseek-v4-flash` + `mimo-v2.5`.
- **smart** — balanced: `minimax-m2.7`/`kimi-k2.6` for reasoning, `kimi-k2.7-code` for coders.
- **optimal** — maximum capability: `minimax-m3`/`deepseek-v4-pro` reasoning, `kimi-k2.7-code` coders, `qwen3.7-plus` vision.

## Notes

- Agents are stateless across delegations — the notepad is the memory bridge
- `gilgamesh` acts as both pre-plan gap checker (metis role) and post-plan validator (momus role)
- `kakashi` is the go-to for self-contained tasks that don't need orchestration
- `rock-lee` and `senku` are both coders — senku for precision, rock-lee for persistence
