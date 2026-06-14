---
description: Systematic debugging — reproduce, bisect, fix. Works for any stack.
---

# Debug Command

Systematic debugging workflow: reproduce → isolate → root cause → fix → verify.

## Instructions for Agent

When the user runs `/debug [error or description]`:

### Phase 1 — Reproduce

1. Gather all available information:
   ```bash
   # Check recent error logs
   cat .log 2>/dev/null || journalctl -n 50 2>/dev/null || true

   # Check current git state
   git log --oneline -5
   git status
   ```

2. Ask the user (if not provided):
   - "What is the exact error message or behavior?"
   - "When did it start? After what change?"
   - "Is it reproducible consistently or intermittent?"
   - "Which environment? (local / staging / production)"

3. Reproduce locally:
   - Run the minimal command/request that triggers the bug
   - Confirm you can reproduce before proceeding

### Phase 2 — Isolate

Detect the affected stack and use appropriate tools:

**TypeScript / React / Next.js**:
```bash
# Check for TS errors
npx tsc --noEmit 2>&1 | head -50

# Check for runtime errors in browser
# (ask user to paste console errors if browser-side)

# Narrow to failing test
npx vitest run --reporter=verbose 2>&1 | grep -A 5 "FAIL"
```

**Python**:
```bash
# Full traceback
uv run python -m pytest tests/ -x --tb=long 2>&1 | tail -50

# Type errors
uv run mypy src/ 2>&1 | grep "error:"
```

**C# / .NET**:
```bash
# Build errors
dotnet build 2>&1 | grep -E "error|warning"

# Failing tests
dotnet test --logger "console;verbosity=detailed" 2>&1 | grep -A 10 "FAILED"
```

**Rails**:
```bash
rails test 2>&1 | grep -A 10 "Failure\|Error"
```

### Phase 3 — Bisect Root Cause

Narrow down using:

1. **Git bisect** (if regression after a change):
   ```bash
   git log --oneline -20  # find last known good commit
   git bisect start
   git bisect bad HEAD
   git bisect good <last-good-sha>
   ```

2. **Eliminate layers**:
   - Comment out recent changes one by one
   - Add logging/breakpoints at entry point and narrow inward
   - Check: is it data-dependent? environment-dependent? timing-dependent?

3. **Check common culprits by stack**:
   - **TS/React**: missing `await`, stale closure, wrong `useEffect` deps, hydration mismatch
   - **Python**: mutable default arg, import side effect, async/sync mixing, missing `await`
   - **C#**: `.Result` on async (deadlock), `DbContext` reuse across threads, missing `CancellationToken`, EF tracking issue
   - **Rails**: missing `includes` (N+1), callback order, missing transaction, encoding issue

### Phase 4 — Propose Fix

Present findings:
```
## Debug Report

**Error**: [exact error message]
**Root Cause**: [explanation in plain language]
**Location**: [file:line]

**Proposed Fix**:
[code snippet showing the fix]

**Why this fixes it**: [1-2 sentences]

**Approval needed before applying the fix.**
```

### Phase 5 — Fix and Verify

After approval:
1. Apply the minimal fix (don't refactor while debugging)
2. Re-run the reproduction steps
3. Confirm error is gone
4. Run the full test suite to check for regressions
5. Report result

### Phase 6 — Prevent Recurrence (optional)

Suggest:
- A test that would have caught this
- A type/lint rule that would catch it at compile time
- Documentation to add if the fix is non-obvious
