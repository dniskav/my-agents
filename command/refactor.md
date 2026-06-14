---
description: Improve code quality without changing its behavior — remove anti-patterns, add tests, apply best practices, update dependencies
---

# /refactor

Analyzes the code, presents a prioritized diagnosis, and executes only the dimensions you choose. External behavior does not change — only internal quality improves.

## task

$ARGUMENTS

---

## Initial setup

Load shared infrastructure:
```
Load: context/workshop/shared.md
```


---

## Phase 0: Deep analysis (touches nothing)

```bash
# Structure and size
find . -maxdepth 4 -not -path '*/node_modules/*' -not -path '*/.git/*' -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.py' -o -name '*.cs' | head -50
wc -l $(find . -maxdepth 4 -not -path '*/node_modules/*' -name '*.ts' -o -name '*.tsx' 2>/dev/null) 2>/dev/null | tail -1

# Existing tests
find . -name '*.test.*' -o -name '*.spec.*' -not -path '*/node_modules/*' | head -20

# Dependencies
cat package.json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); [print(k,v) for k,v in {**d.get('dependencies',{}),**d.get('devDependencies',{})}.items()]" 2>/dev/null
```

Read the largest files to identify real problems, not just structural ones.

---

## Phase 1: Prioritized diagnosis

Always present in this format:

```
Diagnosis of {scope} — {N} files, ~{K} lines

🔴 Urgent (affects maintainability or introduces risk)
  - {concrete problem with location: file:line}
  - {concrete problem}

🟡 Important (technical debt that grows over time)
  - {concrete problem}
  - {concrete problem}

🟢 Improvements (nice to have, not urgent)
  - {concrete problem}
  - {concrete problem}

📦 Dependencies
  - {N} packages with available updates
  - {package}: {current version} → {latest version} {⚠️ if there are breaking changes}
```

Problems to actively look for:

**Anti-patterns:**
- God objects / classes with too many responsibilities
- Direct state mutation where it shouldn't occur
- Deeply nested callbacks (callback hell)
- Magic numbers and magic strings
- Duplicate code (DRY violations)
- Circular dependencies

**Quality:**
- Functions >40 lines
- High cyclomatic complexity
- Variables with generic names (data, temp, x, thing)
- Comments that explain the what instead of the why
- Dead code (functions/variables never used)

**Tests:**
- 0% coverage on business logic
- Tests that test implementation instead of behavior
- Absence of tests for known edge cases

---

## Phase 2: Dimension selection

```
What do you want to refactor? (you can choose multiple)

1. 🔴 {urgent 1}
2. 🔴 {urgent 2}
3. 🟡 {important 1}
4. Add tests for business logic
5. Update dependencies
6. Everything urgent
7. Everything

(Or tell me what to prioritize)
```

**Wait for response before continuing.**

> **Before confirming**, check if any chosen dimension changes the deployment model:
>
> - **Splitting into modules / extracting files** in a single-file project converts imports to `type="module"`, which requires an HTTP server. It will no longer work with `open index.html` — you'll need `npx serve`, `python -m http.server`, etc.
> - **Adding a bundler** (Vite, esbuild…) introduces a build layer that didn't exist before.
>
> If any of these apply, warn explicitly:
> ```
> ⚠️ Dimension "{X}" changes the deployment model:
>    Before: open index.html
>    After: requires HTTP server (e.g. npx serve .)
>    Confirm?
> ```
> If the user doesn't confirm → skip that dimension and continue with the others.

---

## Phase 3: Execution per dimension

Each dimension is executed independently. Recommended order if multiple are chosen:
1. Dead code first (reduces surface area)
2. Renaming / clarity (breaks nothing)
3. Responsibility extraction (the most delicate)
4. Tests (in parallel or at the end, depending on preference)
5. Dependencies (last, may have breaking changes)

For each dimension:

1. Announce what you're going to change and where
2. Execute changes
3. Verify that behavior didn't change (section 5 of shared.md)
4. Gate format (section 3 of shared.md)

### Golden rule of refactoring

**Never change behavior and structure at the same time.** If refactoring also requires changing logic, stop and flag it. They are two distinct operations — first refactor (same behavior), then logic change.

### For responsibility extraction

Before splitting files, verify the deployment context (see warning in Phase 2). If the project is single-file and uses `type="module"` internally, splitting it breaks `open index.html` — only proceed if the user explicitly confirmed.

Pattern: introduce the new abstraction → move the logic → update references → remove the original.

Never: delete the old and write the new in one shot.

---

## Phase 4: Final report

```
## Refactor Complete ✓

**Dimensions applied**: {list}
**Files modified**: {N} ({list if few})
**Lines before/after**: {X} → {Y}
**Tests**: before {N passing} / after {N passing} ✓

**What was NOT touched** (deferred):
- {dimension}: {reason}

**Next steps if you want to continue**:
- For {next level}: use /evolve
- For new features with this clean base: use /feature
```
