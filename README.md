<div align="center">

# 🧠 my-agents

### A hand-crafted multi-agent squad for [opencode](https://opencode.ai)

One orchestrator. Ten specialists. Zero chaos.  

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![opencode](https://img.shields.io/badge/built%20for-opencode-black)](https://opencode.ai)
[![TypeScript](https://img.shields.io/badge/plugin-TypeScript-3178c6)](./plugin)
[![profiles](https://img.shields.io/badge/model%20profiles-free%20%7C%20eco%20%7C%20smart%20%7C%20optimal-brightgreen)](#-model-profiles)

</div>

---

**my-agents** turns opencode into a coordinated team. Instead of one model doing everything, a primary orchestrator (**rimuru**) classifies your intent, plans the work, and delegates each piece to the right specialist — a planner, an explorer, surgical coders, a ruthless reviewer, a vision agent, and more. Each agent has a curated prompt, a recommended model, and the minimum tools it needs.

It's inspired by `oh-my-openagent`, rebuilt from scratch with a focus on **safety** (a repo-boundary guard), **observability** (a delegation tree you can inspect), and **cost control** (swappable model profiles, including a fully free one).

## ✨ Features

- **🥷 11-agent squad** orchestrated via a custom `delegate_task` tool — agents call each other with a strict 6-section task format. Each agent has a focused role with no overlap.
- **🛡️ Repo-Identity Guard ("Gaara")** — three layers that stop an agent from editing the *wrong* repository (the classic "I ran opencode in project A but asked it to fix project B" footgun).
- **🔁 Autonomous loops & missions** — `/loop` iterates `execute → verify` against a checkable done-criterion without per-step gates; `/mission` runs a full gated workflow with crash-safe state.
- **🌳 Delegation tree** — every delegation is logged (who called whom, why, model, duration) and each subagent's full prompt + reasoning is saved for inspection via `/delegations`.
- **💸 Model profiles** — `free`, `eco`, `smart`, `optimal`. Switch with `/profile`. The `free` profile runs entirely on opencode zen's zero-cost models.
- **🧠 Session notepad** — a shared memory file bridges the stateless subagents across a session.

## 🥷 The Squad

| Agent | Mode | Role |
|---|---|---|
| **rimuru** | primary | Orchestrator — classifies intent, plans, delegates, verifies |
| **norman** | primary | Planner — interviews, produces rigorous plans (validated by gilgamesh) |
| **kakashi** | primary | Deep Worker — autonomous end-to-end: explore → implement → QA solo |
| **urahara** | subagent | Oracle — architecture decisions, tradeoffs, strategic reasoning |
| **jiraiya** | subagent | Explorer & Librarian — codebase navigation, search, reference lookup (read-only) |
| **senku** | subagent | Coder — precise, surgical implementation |
| **rock-lee** | subagent | Executor — persistent multi-file implementation until done |
| **neji** | subagent | Verifier — runs tsc / lint / tests / build and reports results (read-only) |
| **gilgamesh** | subagent | Plan Reviewer — ruthless critic: APPROVED / REVISIONS / REJECTED |
| **gojo** | subagent | Vision — screenshots, images, PDFs, diagrams |
| **gaara** | subagent | Guardian — repo-identity & boundary checks before writes/commits (read-only) |

Full reference with examples: [`squad-codex.md`](./squad-codex.md) · System prompts: [`plugin/my-agents/agents.ts`](./plugin/my-agents/agents.ts)

## 🛡️ Repo-Identity Guard

A single opencode session can touch more than one project — but the working directory does **not** follow the project you name. my-agents prevents cross-project contamination with three layers:

- **A — `directory` param** on `delegate_task`: run a subagent in the *target* project's path (and whitelist its writes).
- **B — prompts**: rimuru, kakashi, senku, rock-lee verify `git remote -v` against the task's target before writing; delegate to **gaara** to adjudicate when unsure.
- **C — `tool.execute.before` hook**: hard-blocks any `write`/`edit` whose path falls outside the active project roots. Fail-open when no roots are registered.

## 🔁 Loops, missions & the delegation tree

| Command | What it does |
|---|---|
| `/mission "<task>"` | Full gated workflow: intake → plan → review → execute → verify, with crash-safe state in `.tmp/sessions/` |
| `/swarm "<task>"` | Decompose and run independent subtasks in parallel |
| `/loop "<goal>" --done "<criterion>"` | Autonomous loop: iterate until a verifiable criterion passes, budget runs out, or progress stalls |
| `/delegations [--verbose｜<agent>]` | Show the who-called-whom tree; inspect any subagent's saved prompt + reasoning |
| `/profile [free｜eco｜smart｜optimal]` | Switch the active model profile and remind you to restart |

## 💸 Model profiles

Each profile is a `my-agents.<name>.json` file. The active one is `my-agents.json`; `/profile` copies a profile over it.

| Profile | Provider | Vibe |
|---|---|---|
| **free** | `opencode` (zen) | Zero cost — `nemotron-3-ultra`, `big-pickle`, `mimo-v2.5` (vision), `north-mini-code` |
| **eco** | `opencode-go` | Cheapest paid — mostly `deepseek-v4-flash` + `mimo-v2.5` |
| **smart** | `opencode-go` | Balanced — `minimax-m2.7` / `kimi-k2.6`, `kimi-k2.7-code` for coders |
| **optimal** | `opencode-go` | Max capability — `minimax-m3` / `deepseek-v4-pro`, `kimi-k2.7-code`, `qwen3.7-plus` (vision) |

> Model assignments are matched to each role (reasoning vs coding vs vision) and refreshed as new models land. Tweak any `model` / `fallback_models` to taste.

## 📦 Install

```bash
# 1. Clone into your opencode config dir (back up any existing one first)
git clone https://github.com/dniskav/my-agents.git ~/.config/opencode

# 2. Install the plugin's dependency
cd ~/.config/opencode && npm install   # or: bun install

# 3. Make sure opencode.json loads the plugin (it does by default here):
#    "plugin": ["./plugin/my-agents/index.ts"]

# 4. Pick a profile and restart opencode
cp my-agents.smart.json my-agents.json
```

Requires [opencode](https://opencode.ai) and a TypeScript-capable runtime (bun recommended). The paid profiles need an `opencode-go` subscription; the **free** profile needs only opencode zen.

## 🗂️ Structure

```
.
├── AGENTS.md                 # how the system works (start here)
├── squad-codex.md            # full agent reference with examples
├── opencode.json             # MCP servers + plugin registration
├── my-agents.json            # ACTIVE model config
├── my-agents.{free,eco,smart,optimal}.json   # profiles
├── my-agents.schema.json     # config schema
├── plugin/my-agents/
│   ├── agents.ts             # all agent system prompts
│   ├── index.ts              # plugin entry: agents, guard hook, toasts
│   ├── guard.ts              # write-boundary allowlist (Gaara Guard)
│   ├── registry.ts           # sessionID → agent / root maps
│   └── tools/delegate-task.ts# delegation tool + logging + transcripts
├── command/                  # slash commands (/mission, /loop, /profile, …)
└── context/                  # shared context injected into sessions
```

## ⚠️ Disclaimer

This harness is an **autonomous agent system**: it can read, write, and delete files, run shell commands, and create git commits on your behalf. The Gaara Guard reduces the blast radius, but it is **not a sandbox**. Run it on code you can afford to have modified, keep backups / version control, and review what it does. Provided **as is**, with **no warranty and no liability** — see [LICENSE](./LICENSE).

## 📄 License

[MIT](./LICENSE) © 2026 dniskav — use it freely, no strings attached.

<div align="center">
<sub>Built for terminal-dwellers who want a team, not a single model. 🥷</sub>
</div>
