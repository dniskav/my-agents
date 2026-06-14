---
description: Surgical fix with prior impact analysis — fixes exactly what is broken without touching anything else
---

# /fix

Fixes something specific without breaking anything in the process. First maps the impact, establishes a baseline, applies the minimum necessary change, verifies that nothing broke.

## task

$ARGUMENTS

---

## Initial setup

Load shared infrastructure:
```
Load: context/workshop/shared.md
```


---

## Phase 0: Understand the fix

Before searching in the code, understand what is being reported:
- What incorrect behavior occurs?
- Where does it manifest? (component, function, route, endpoint)
- When does it occur? (always, under certain condition, with certain data)

If the prompt doesn't have enough info to locate the problem, ask once before searching.

---

## Phase 1: Impact mapping (touches nothing)

Locate the source of the problem and map everything that could be affected:

```bash
# Search for the symbol/function/component involved
grep -r "{symbol}" --include="*.ts" --include="*.tsx" --include="*.js" -l .
```

Present the map before touching anything:

```
Fix: {problem description}
Origin: {file:line}

Directly affects:
  - {file}: {what it does with the affected symbol}

Consumers (use what we're going to change):
  - {file}: {how it uses it}

Lateral risk (could break indirectly):
  - {file}: {reason for risk}

Existing tests that cover this area:
  - {test file}: {what it tests}
```

---

## Phase 2: Baseline

If there are tests that cover the affected area, run them BEFORE touching anything:

```bash
npm test -- --testPathPattern="{area}" 2>&1 | tail -20
```

Record exactly what passes and what fails in the current state. This is the baseline against which you will verify afterward.

If there are no tests, describe the current behavior by reading the code.

---

## Phase 3: Surgical fix

Apply the minimum necessary change to correct the problem.

**Strict rules:**
- Only modify what is necessary for the fix — nothing more
- Don't take the opportunity to clean up nearby code
- Don't rename variables "while you're at it"
- Don't add related features
- If you see something that should be improved → note it as a suggestion, don't touch it

If the fix requires changes in multiple files, do them in order: first the origin, then the consumers.

---

## Phase 4: Verification

```bash
# Type check
npx tsc --noEmit 2>&1 | tail -10

# Tests for the affected area
npm test -- --testPathPattern="{area}" 2>&1 | tail -20

# Global tests if the area is infrastructure
npm test 2>&1 | tail -20
```

Compare against the Phase 2 baseline:
- Tests that were passing before → must keep passing ✓
- The behavior reported as broken → must be corrected ✓

If something that was passing now fails → there is a regression. Do not report the fix as complete. Analyze and correct before continuing.

---

## Phase 5: Minimum impact report

```
## Fix Complete ✓

**Problem**: {description}
**Root cause**: {what was wrong and why}

**Changes applied**:
- {file}: {modified line(s)} — {what changed}

**Verified**:
- {file}: no changes, behavior confirmed
- Tests: {N} passing (same as before)

**Not touched**: {list of files that were reviewed but not modified}
```

---

## Phase 6: Opportunity detection (always execute)

After applying the fix, review the touched code and its immediate context looking for improvement signals. This phase is observational — don't execute anything yet.

Signals to actively look for:

**Mixed responsibilities**
- A class or function does too many things at once
- The fix required understanding 3+ layers to find the origin

**Unnecessary coupling**
- The fix in one file forced changes in another with no conceptual relationship
- There are direct dependencies where there should be contracts (interfaces, callbacks, events)

**Emerging patterns**
- Similar code in 2+ places that could be extracted
- Business logic mixed with UI or network logic
- Magic constants that should be centralized

**Missing tests**
- The bug existed because there was no test that would cover it
- There are obvious edge cases without coverage

If you detect any signal, present it as actionable options:

```
## Opportunities detected

The fix exposed the following. None are urgent — choose if you want to continue:

A) {short title}
   What: {concrete description of what's wrong}
   Where: {file(s):line(s)}
   How to fix it: {specific action — extract X, separate Y, add test for Z}
   Suggested command: /refactor / /feature / /test

B) {short title}
   ...

(Or write "no" to stop here)
```

If there is nothing relevant → don't invent suggestions. End with the Phase 5 report only.
