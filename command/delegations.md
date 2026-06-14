---
description: Show the delegation tree for this project — who called whom, why, with model and duration, from .tmp/delegations.jsonl
---

# Delegation Tree

Reconstruct and display the chain of `delegate_task` calls recorded for this project. Each line in `.tmp/delegations.jsonl` is one delegation edge (caller → callee).

## task

$ARGUMENTS

## Instructions

### 1. Load the log

```bash
test -f .tmp/delegations.jsonl && wc -l .tmp/delegations.jsonl || echo "No delegations recorded yet (.tmp/delegations.jsonl missing)."
```

If the file is missing, tell the user no delegations have been recorded yet and stop.

### 2. Build the tree

Read `.tmp/delegations.jsonl`. Each record:
```json
{ "ts","caller","callerSession","callee","childSession","reason","directory","model","durationMs","timedOut" }
```

Reconstruct the tree using `callerSession → childSession`:
- Roots are records whose `caller` is `"root"` (called by the user/primary session).
- A record's `callee`/`childSession` becomes the parent of any record whose `callerSession` equals that `childSession`.
- Order siblings by `ts`.

### 3. Render

Print an indented tree. For each node show: callee (short name), reason, model, duration, and ⏱ if it timed out.

```
## Delegation tree — {project}
({n} delegations · {totalDuration})

root
└─ Norman  · "produce the mission plan"            · minimax-m2.7 · 12.3s
   └─ Gilgamesh  · "validate the plan"             · qwen3.6-plus · 4.1s
└─ Senku   · "implement the guard hook"            · mimo-v2.5-pro · 8.7s
└─ Gaara   · "verify target repo before commit"    · qwen3.6-plus · 1.9s ⏱ timeout
```

If `$ARGUMENTS` contains `--flat`, list edges chronologically instead of as a tree:
```
HH:MM:SS  caller → callee   "reason"   (model, duration)
```

### 3b. Verbose mode — show a subagent's prompt & reasoning

Each delegation's full transcript (the prompt sent + the agent's complete response) is saved at `.tmp/delegations/{childSession}.md`.

- If `$ARGUMENTS` contains `--verbose` (no agent named): after the tree, append each transcript in chronological order.
- If `$ARGUMENTS` names an agent (e.g. `/delegations Gilgamesh`): show only that agent's transcript(s). Resolve `childSession` from the tree, then:
  ```bash
  cat .tmp/delegations/{childSession}.md
  ```
  If multiple matches, show the most recent (or list them and ask which).

This is how you inspect WHAT Gilgamesh actually reasoned, even though it ran as a nested session. (For watching it run LIVE, read-only agents like Gilgamesh/jiraiya/gaara/index are flattened to the root session and appear in `Ctrl+X ↓`.)

### 4. Summary line

End with totals: number of delegations, count per agent, total wall time, and any timeouts flagged.

## Notes
- The log is append-only and per-project (`.tmp/delegations.jsonl` at the project root).
- It accumulates across sessions. Suggest `rm .tmp/delegations.jsonl` if the user wants a clean slate.
