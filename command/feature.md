---
description: Implement a new feature in an existing project — integrated with the project's patterns, without breaking what already works
---

# /feature

Adds something new to an existing project. Reads how it's built, implements with the same style, verifies that nothing breaks in the process.

## task

$ARGUMENTS

---

## Initial setup

Load shared infrastructure:
```
Load: context/workshop/shared.md
```


---

## Phase 0: Read the project (before planning)

```bash
# Stack and structure
ls -la
find . -maxdepth 3 -not -path '*/node_modules/*' -not -path '*/.git/*' | head -40
cat package.json 2>/dev/null
```

Read 2-3 representative files to understand:
- What naming conventions the project uses
- How existing components/modules are structured
- What libraries are already available (don't install something they already have)
- If there are established state management patterns
- How existing tests are organized

**Don't invent patterns — extend what already exists.**

---

## Phase 1: Feature plan

Present the plan before executing:

```
Feature: {name}

New files:
  - {file}: {purpose}

Files to modify:
  - {file}: {what changes and why}

New dependency (if applicable):
  - {package} — {do they have something similar? yes/no}

Tests to create/update:
  - {test file}: {what it covers}

Impact on existing:
  - {risk or consideration}

ETA: ~{X}min
```

If the feature touches 4+ files or multiple layers → automatically activate progressive mode (steps with gates).

**Wait for approval before executing.**

---

## Phase 2: Routing to the correct subagent

Detect the stack (section 4 of shared.md) and delegate to the appropriate subagent:

```javascript
task(
  subagent_type="agent/subagents/code/{subagent}",
  description="Implement {feature} for {project}",
  prompt=`
    Implement: {feature description}
    
    Project patterns observed:
    {conventions detected in Phase 0}
    
    Files to create: {list}
    Files to modify: {list with description of changes}
    
    Constraints:
    - Match existing naming conventions
    - Use libraries already in package.json
    - Don't change behavior of existing features
    - Run type check after implementation
    
    Context: {key files the subagent needs to read}
  `
)
```

For simple features (1-2 files, clear stack) → direct execution without subagent.

---

## Phase 3: Verification

```bash
# Type check / build
npx tsc --noEmit 2>&1 | tail -10

# Existing tests — must keep passing
npm test 2>&1 | tail -20

# Smoke check of new feature if MCP playwright is available
# (basic screenshot or evaluate to confirm it works)
```

If existing tests fail → there is a regression. Fix before reporting the feature as complete.

---

## Phase 4: Report

```
## Feature Complete ✓

**What was added**: {description}
**How to use it**: {concrete instruction}

**Files created**: {list}
**Files modified**: {list}

**Tests**: {N passing} — including {N new for this feature}

💡 Suggestions to extend this feature:
  - {possible future improvement}
  - {possible future improvement}
```

---

## For complex features (progressive mode)

If the feature requires multiple steps with gates, use the plan format from shared.md:

```bash
PLAN_FILE=".tmp/plans/feature-{name}-$(date +%Y%m%d).md"
```

Each step of the feature = a verifiable unit that leaves the code working. The incomplete feature must not leave the project broken — use feature flags or additive implementation.
