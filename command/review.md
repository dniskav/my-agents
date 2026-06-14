---
description: Interactive code review of the current branch changes — security, quality, performance, UX
---

# Code Review Command

Performs a structured code review of all changes on the current branch compared to the base branch.

## Instructions for Agent

When the user runs `/review`:

### Step 1 — Gather Changes
```bash
# Find base branch
git log --oneline -20
git diff main...HEAD --stat 2>/dev/null || git diff master...HEAD --stat 2>/dev/null || git diff HEAD~1 --stat
```

Get the full diff:
```bash
git diff main...HEAD 2>/dev/null || git diff master...HEAD 2>/dev/null || git diff HEAD~1
```

### Step 2 — Detect Stack
Read changed file extensions to identify the primary stack (`.ts/.tsx`, `.py`, `.cs`, `.rb`).

### Step 3 — Load Standards
Load `/Users/daniel/.config/opencode/context/core/standards/code.md` (relevant stack section).

### Step 4 — Delegate to Reviewer Subagent
Delegate to `subagents/code/reviewer` with the diff content and this structured review template:

---

## Review Template

### 🔒 Security
- [ ] No secrets, API keys, or credentials in code
- [ ] Input validation at all external boundaries
- [ ] No SQL injection vectors (raw queries, string interpolation)
- [ ] Auth/authz checks present where needed
- [ ] No sensitive data logged or exposed in errors

### ✅ Code Quality
- [ ] Functions/methods have single responsibility
- [ ] No obvious code duplication
- [ ] Naming is clear and consistent
- [ ] No dead code or commented-out blocks
- [ ] Error cases handled explicitly (no silent failures)
- [ ] No `any` types (TS) / untyped variables (Python) / `object` overuse (C#)

### ⚡ Performance
- [ ] No N+1 query patterns
- [ ] No synchronous calls to external services in hot paths
- [ ] No unnecessary re-renders (React) / missed `AsNoTracking` (EF Core) / missing `await` (async paths)
- [ ] Large data sets paginated, not loaded in full

### 🎨 UX / Frontend (if applicable)
- [ ] Loading states handled
- [ ] Error states displayed to user (not just console)
- [ ] Accessibility: keyboard navigation, ARIA labels, contrast
- [ ] Responsive behavior considered
- [ ] No layout shifts on data load

### 🧪 Test Coverage
- [ ] New logic has corresponding tests
- [ ] Edge cases and error paths tested
- [ ] No tests that only test implementation details (test behavior)

---

## Output Format

For each category, report:

```
### 🔒 Security
✅ No issues found

### ✅ Code Quality
⚠️ [file:line] — [issue description]
   Suggestion: [what to do instead]

### ⚡ Performance  
🚨 [file:line] — [critical issue]
   Suggestion: [what to do instead]
```

Severity levels:
- 🚨 **Critical** — must fix before merge (security, data loss risk, breaking change)
- ⚠️ **Warning** — should fix (quality, performance, maintainability)
- 💡 **Suggestion** — optional improvement (style, minor optimization)

At the end, provide a **Summary**:
```
## Summary
- Files reviewed: X
- Critical issues: X
- Warnings: X
- Suggestions: X
- Overall: ✅ Ready to merge / ⚠️ Fix warnings first / 🚨 Block — critical issues
```
