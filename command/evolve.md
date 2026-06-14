---
description: Grow existing code layer by layer — framework migration, clean architecture, new capabilities, without breaking anything along the way
---

# /evolve

Takes existing code and grows it toward where it needs to go. Does not rewrite — transforms incrementally, leaving the code working after each step.

## task

$ARGUMENTS

---

## Initial setup

Load shared infrastructure:
```
Load: context/workshop/shared.md
```


---

## Phase 0: Read current state

```bash
# Stack and structure
ls -la
find . -maxdepth 3 -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/.tmp/*' | head -40
cat package.json 2>/dev/null
cat SEED.md 2>/dev/null    # if it exists, the project was created with /step-plan
cat EVOLUTION_NOTES.md 2>/dev/null
```

Read the main files to understand existing patterns — NOT just the structure, but how the code is written.

---

## Phase 1: Diagnosis

Classify the current state of the code:

```
Current state of {project}:

Stack: {detected technology}
Structure: {honest description — monolithic, modular, mixed}
Patterns: {what conventions it uses}
Tests: {approximate coverage}
Visible technical debt: {short list}

Starting point for evolution: {what's usable}
```

---

## Phase 2: Evolution options

Present relevant options based on what exists and what the user asks for. Don't present everything — only what applies:

```
Evolution options for {project}:

A) {concrete option} — ~{X}h
   What changes: {description}
   What stays the same: {description}

B) {concrete option} — ~{X}h
   ...

C) Progressive (A → B → C in separate sessions)
```

Examples of options depending on context:
- Separate UI logic (if everything is mixed)
- Migrate to React / Vue / Svelte / Angular
- Introduce hexagonal / clean architecture
- Add TypeScript (if pure JS)
- Implement state management (Zustand, Redux, etc.)
- Add test suite from scratch
- Split monolith into modules

**Wait for the user to choose before continuing.**

---

## Phase 3: Migration plan

Once the direction is chosen, generate the migration plan:

Migration plan rules:
- Each step leaves the code **working** — never a broken intermediate state
- Step 1 is always the most conservative (prepares the ground without breaking anything)
- Interfaces are introduced before implementations
- Existing tests must pass at each step

Save the plan to `.tmp/plans/evolve-{project}-{date}.md` using the format from shared.md.

Present the plan and **wait for approval** before executing.

---

## Phase 4: Step-by-step execution

For each step:

1. Describe in one line what transformation is applied
2. Execute the change
3. Verify that what worked before still works (section 5 of shared.md)
4. Update the plan
5. Gate format (section 3 of shared.md) with suggestions if any

### Strangler Fig Principle

For framework or architecture migrations: keep the old version working while introducing the new. Only remove the old one when the new one is verified.

Example for migration to React:
- Step 1: Introduce the React entrypoint without touching existing code
- Step 2: Migrate the simplest component
- Step 3: Migrate components progressively
- Step 4: Remove old code once everything is migrated

---

## Phase 5: Closure

When the evolution is complete:

```
## Evolve Complete ✓

**Before**: {initial state}
**Now**: {final state}
**Steps executed**: {N}
**Tests**: {status}

**Next natural evolution**: {suggestion for next level}
```

Update `SEED.md` or `EVOLUTION_NOTES.md` with the new project state.

---

## Continuation between sessions

The plan persists. To resume:
```
/step-continue {plan-file}
```

To escalate to a full mission if the scope grew:
```
/mission --from-plan {plan-file}
```
