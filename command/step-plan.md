---
description: Progressive build from scratch — build step by step with human gates, suggestions, and persistent plan
---

# /step-plan

Builds something new progressively. Each step is verified before continuing. The plan persists between sessions. You can pause, adjust, and resume whenever you want.

## task

$ARGUMENTS

---

## Initial setup

Load shared infrastructure:
```
Load: context/workshop/shared.md
```


---

## Phase 0: Intake (2 min)

```bash
# Directory state
ls -la 2>/dev/null | head -20
cat package.json 2>/dev/null | head -10
```

Identify:
- Does something already exist or is this from scratch?
- Target stack (if not in the prompt, infer or ask)
- Approximate scope

---

## Phase 1: Two questions maximum

Before planning, ask only if necessary:

**Required question:**
```
Is this project:
A) Disposable — just needs to work, no plans to grow
B) Seed — may evolve in the future

(If you don't know, choose B — it costs nothing and opens options)
```

If something about the scope is genuinely ambiguous, one second question. Maximum two. Then proceed.

---

## Phase 2: Visible plan (don't execute yet)

Generate the complete plan and save it:

```bash
PLAN_NAME=$(echo "$ARGUMENTS" | tr ' ' '-' | tr '[:upper:]' '[:lower:]' | cut -c1-30)
PLAN_FILE=".tmp/plans/${PLAN_NAME}-$(date +%Y%m%d).md"
mkdir -p .tmp/plans
```

The plan must have:
- Numbered steps with a 1-line description
- Realistic ETA per step
- What is verified at the end of each one
- "Done" criterion for the complete project

If they chose **B (seed):** add to the plan:
- Explicit conventions (semantic names, named constants)
- `## Evolution Notes` section with hooks for future growth

Present the plan to the user:
```
Plan: {name}
Saved to: {plan-file}

Steps:
1. {description} (~{X}min)
2. {description} (~{X}min)
...

Total ETA: ~{X}min
Shall we start? (or adjust anything before)
```

**Wait for response before executing.**

---

## Phase 3: Step-by-step execution

For each step:

1. Briefly announce what you're going to do
2. Execute
3. Verify (section 5 of shared.md)
4. Update the plan file (mark `[x]`)
5. Apply the **Gate Format** (section 3 of shared.md)

If you detect something relevant during execution → add it to `## Suggestions` in the plan.

On failure (max 2 attempts):
- Attempt 1: Direct fix
- Attempt 2: Simpler alternative approach
- If it persists: document in the plan and ask the user

---

## Phase 4: Closure

When all steps are complete:

**If they chose A (disposable):**
```
## Step Plan Complete ✓

**What was built**: {description}
**How to run**: {exact command}
**Main files**: {list}
```

**If they chose B (seed):**

In addition to the summary, write `SEED.md` in the project root:

```markdown
# Seed Notes — {name}

## What was built
{brief description}

## Architecture decisions
{why this structure, what patterns were used}

## To evolve
- Add {X} → modify {file/function}
- Migrate to {framework} → the natural entry points are {list}
- Add tests → the pure logic is in {module}

## Signs you need /evolve
- When {growth condition}
- When {complexity condition}

## Pending suggestions
{list of suggestions that remained in the plan}
```

---

## Continuation

If the session is paused, the state remains in the plan file. To resume:
```
/step-continue {plan-file}
```
