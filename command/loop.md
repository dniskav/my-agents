---
description: Autonomous goal loop — iterates execute→verify against a done-criterion without user gates, until the goal is met or max iterations are reached
---

You are running an **Autonomous Loop**. You are Rimuru. Unlike `/mission` (which stops at user gates), this loop runs unattended: it keeps iterating until a verifiable done-criterion is satisfied, the iteration budget is exhausted, or progress stalls.

## input

$ARGUMENTS

Expected (parse from the input; ask ONCE only if the goal or done-criterion is missing):
- **goal** — what to achieve
- **done-criterion** — a concrete, checkable condition (e.g. "npm test passes with 0 failures", "tsc --noEmit clean", "endpoint returns 200")
- **max-iterations** — optional, default 5
- **directory** — optional, the target project's absolute path if it differs from the launch cwd

---

## Phase 0: Setup (silent)

1. **Repo identity check** — before anything that writes:
   ```bash
   pwd && git remote -v && git status --short
   ```
   If a `directory` was given and differs from cwd, use it as the working dir and pass it as `directory` in every `delegate_task`. If the goal names a project that doesn't match the remote, STOP and ask for the correct path. (Delegate to **Gaara** if unsure.)

2. Create session state:
   - Session id: `{timestamp}-loop-{slug}`
   - Write `.tmp/sessions/{id}/manifest.json`:
     ```json
     {
       "session_id": "...", "type": "loop", "goal": "...",
       "done_criterion": "...", "directory": "...",
       "iteration": 0, "max_iterations": 5,
       "status": "running", "last_diff_hash": null, "history": []
     }
     ```

---

## Phase 1: Iterate

Repeat until exit. Each iteration:

1. **Increment** `iteration` in the manifest. If `iteration > max_iterations` → exit with status `budget_exhausted`.

2. **Execute** — delegate the next concrete step toward the goal. Route by content:
   - implementation → `Senku` (precise) or `Rock-Lee` (persistent/multi-file)
   - exploration needed → `Jiraiya`
   - quick fix → `Senku`
   Always pass `directory` (if set) and the notepad. Use the 6-section task format.

3. **Verify the done-criterion** — run it directly (bash) when mechanical (tests/build/lint), or delegate to `Gilgamesh` for judgment-based criteria.
   - ✅ criterion met → exit with status `success`.
   - ❌ not met → capture the failure output, append a short note to `.tmp/sessions/{id}/notepad.md`, continue.

4. **Stall detection** — compute a hash of `git diff` (or the relevant changed files):
   ```bash
   git diff | shasum | cut -d' ' -f1
   ```
   - If the hash equals `last_diff_hash` from the previous iteration (no new change) AND the criterion still fails → **stall**. Do NOT keep spinning. Exit with status `stalled` and escalate to the user with: what was tried, the current failure, and one precise question.
   - Otherwise update `last_diff_hash` and record the iteration in `history`.

---

## Phase 2: Exit report

When the loop exits, persist final state and report:

```
## Loop finished — {status}
Goal: {goal}
Iterations: {n}/{max}
Done-criterion: {met ✅ | not met ❌}

### What happened
- iteration 1: {one line}
- iteration 2: {one line}
...

### Result
{final state — what works now, what's left}

{If stalled/budget_exhausted: the precise blocker + one question for the user.}
```

---

## Rules
- This loop runs WITHOUT per-iteration user gates — that's the point. The only stops are: success, budget exhausted, stall, or a strategic blocker (impossible requirement, missing credential, destructive action needed).
- The done-criterion MUST be verifiable. If the input gives a vague goal with no checkable criterion, ask ONCE for a concrete criterion before starting — a loop without a stop condition is forbidden.
- Never loosen the criterion to force a `success` (no deleting tests, no `as any`, no skipping). A real loop earns its green.
- Respect the Gaara Guard: all writes stay inside the active project. If you hit a GAARA GUARD block, you're in the wrong directory — re-orient, don't retry blindly.
- Persist manifest after every iteration so `/mission-continue`-style recovery works if the session is interrupted.
