---
description: Fast PoC mission — something demoable in 30-60 minutes, minimal ceremony
---

You are running a **Tiny Mission** — a lightweight version of /mission optimized for speed. Goal: something working and presentable in 30-60 minutes. Skip everything that doesn't directly ship value.

## task

$ARGUMENTS

---

## CRITICAL: User interaction points

Only stop for:
1. **One clarifying question** (if truly ambiguous) — max 1, then proceed
2. **A blocker that cannot be resolved** — ask user, then continue

Do NOT stop for plan approval. Do NOT run full verification. Move fast.

---

## Phase 0: Metrics check + Quick intake (2 minutes max)

```bash
# Metrics flag
cat 

# Stack detection
ls package.json pyproject.toml *.csproj 2>/dev/null
cat package.json 2>/dev/null | grep -E '"name"|"next"|"react"' | head -5

# Structure snapshot
find . -maxdepth 2 -not -path '*/node_modules/*' -not -path '*/.git/*' | head -30
```

Read one key file to understand existing patterns (e.g., an existing component or route).

If artifacts attached (PDF/doc): read them quickly, extract the core requirement only.

---

## Phase 1: Seed question + one clarification max

**Always ask this first** (takes 5 seconds, saves hours later):

```
Is this PoC:
A) Disposable — just needs to work today
B) Seed — may grow in the future

(If you don't know, choose B — it costs nothing)
```

STOP. Wait for answer. This changes how you name things and structure the output.

If something else is genuinely ambiguous → one additional question max. Then proceed immediately.

---

## Phase 2: Micro-plan (internal only — don't show to user)

Think through:
1. What's the minimal deliverable that demonstrates the feature?
2. What 2-4 steps get there?
3. What's the simplest implementation that works?

Rules for PoC planning:
- No tests required (but note gaps at the end)
- No full error handling (happy path is enough)
- No i18n, no accessibility audit, no performance optimization
- Use the fastest approach, not the most scalable
- Hard-code where sensible — this is a PoC

Announce the plan briefly:
```
Starting tiny mission: [task]
Steps: [1-line per step]
ETA: ~[X] minutes
```

Then start immediately — no approval gate.

---

## Phase 3: Execute (fast, direct)

Execute steps sequentially (no swarm, no worktrees — too slow for PoC).

After each step:
- Run type check / build check only: `npx tsc --noEmit` / `dotnet build` / `mypy src/`
- Skip linting, skip full test suite
- Fix type errors inline (max 2 attempts, then note it and move on)

Progress updates inline:
```
✓ Step 1: [what was done]
✓ Step 2: [what was done]
→ Step 3: [doing now]
```

On failure (max 2 attempts per step):
- Attempt 1: Fix directly
- Attempt 2: Try simpler approach
- Attempt 3: Note it, skip, continue → report at the end

---

## Phase 4: Smoke check

Run only what's needed to confirm "it works":

```bash
# JS/TS: does it build?
npx tsc --noEmit 2>&1 | tail -5

# Python: does it import?
uv run python -c "import src.main" 2>&1

# C#: does it build?
dotnet build 2>&1 | tail -5
```

If it passes → done. If it fails → fix the blocker, then done.

---

## Phase 5: Summary

**If seed answer was A (disposable)** — report inline in chat:

```
## Tiny Mission Complete ✓

**What's working**: [1-2 sentences]
**Files created/modified**: [list]
**How to run/demo**: [exact command or steps]

**Known gaps** (not blocking for PoC):
- [ ] No unit tests
- [ ] No error handling for [X]

**Next step if you want to productionize**: [1 specific recommendation]
```

**If seed answer was B (seed)** — report inline AND write `SEED.md` in project root:

```markdown
# Seed Notes — {project name}

## What was built
{1-2 sentence description}

## Architecture decisions
{why this structure, what patterns were used}

## To evolve this
- Add {X} → modify {file/function}
- Migrate to {framework} → natural entry points are {list}
- Add tests → pure logic lives in {module/section}

## Signs you need /evolve
- When {growth condition}
- When {complexity condition}

## Pending suggestions
{any improvements noticed but skipped for speed}
```

No `mission-report.md`. No session cleanup. Done.

---

## Budget awareness

If the user specified `--budget Xh` or `--budget Xmin`:
- Planner limits scope to fit within the budget
- If the task is too large, call out what fits and what doesn't:
  ```
  Budget: 45 min
  Fits: [core feature A + basic UI]
  Deferred: [auth, error states, tests]
  ```
