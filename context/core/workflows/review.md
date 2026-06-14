<!-- Context: workflows/review | Priority: high | Version: 2.0 | Updated: 2026-05-08 -->

# Code Review Guidelines

## Quick Reference

**Golden Rule**: Review code as you'd want yours reviewed - thoroughly but kindly

**Checklist**: Functionality, Code Quality, Security, Testing, Performance, Maintainability

**Report Format**: Summary, Assessment, Issues (🔴🟡🔵), Positive Observations, Recommendations

**Principles**: Constructive, Thorough, Timely

---

## Principles

**Constructive**: Focus on code not person, explain WHY, suggest improvements, acknowledge good practices
**Thorough**: Check functionality not just style, consider edge cases, think maintainability, look for security
**Timely**: Review promptly, don't block unnecessarily, prioritize critical issues

## Review Checklist

### Functionality
- [ ] Does what it's supposed to do
- [ ] Edge cases handled
- [ ] Error cases handled
- [ ] No obvious bugs

### Code Quality
- [ ] Clear, descriptive naming
- [ ] Functions/methods small and focused (< 20 lines)
- [ ] Composition over inheritance
- [ ] Follows project conventions
- [ ] DRY — no duplication, reusable abstractions

### Security
- [ ] Input validation at system boundaries
- [ ] No SQL injection vulnerabilities (parameterized queries)
- [ ] No XSS vulnerabilities
- [ ] No hardcoded secrets (environment variables used)
- [ ] Sensitive data handled properly
- [ ] Auth/authorization appropriate

### Testing
- [ ] Tests present for new behavior
- [ ] Edge cases tested
- [ ] Tests are independent and deterministic
- [ ] Test names describe behavior

### Performance
- [ ] No N+1 queries or unnecessary loops
- [ ] Efficient data structures and algorithms
- [ ] Async/background processing for expensive operations
- [ ] Caching implemented where appropriate

### Maintainability
- [ ] Code is easy to understand
- [ ] Complex logic has explanatory comments (WHY, not WHAT)
- [ ] Easy to modify/extend

## Review Report Format

```markdown
## Code Review: {Feature/PR Name}

**Summary:** {Brief overview}
**Assessment:** Approve / Needs Work / Requires Changes

---

### Issues Found

#### 🔴 Critical (Must Fix)
- **File:** `src/auth.js:42`
  **Issue:** Password stored in plain text
  **Fix:** Hash password before storing

#### 🟡 Warnings (Should Fix)
- **File:** `src/user.js:15`
  **Issue:** No input validation
  **Fix:** Validate email format

#### 🔵 Suggestions (Nice to Have)
- **File:** `src/utils.js:28`
  **Issue:** Could be more concise
  **Fix:** Use array methods instead of loop

---

### Positive Observations
- ✅ Good test coverage (95%)
- ✅ Clear function names
- ✅ Proper error handling

---

### Recommendations
{Next steps, improvements, follow-up items}
```

## Common Issues

### Security
🔴 Hardcoded credentials or secrets
🔴 SQL injection vulnerabilities (use parameterized queries)
🔴 Missing input validation at boundaries
🔴 Exposed sensitive data in logs

### Code Quality
🟡 Large functions (>20 lines)
🟡 Deep inheritance hierarchies
🟡 Missing abstractions for duplicated logic
🟡 Inconsistent naming conventions

### Testing
🟡 Missing tests for new behavior
🟡 Tests relying on implementation details
🟡 Flaky tests (time-dependent, shared state)
🟡 Tests not verifying side effects

## Best Practices

✅ Review within 24 hours
✅ Provide specific, actionable feedback
✅ Explain WHY, not just WHAT
✅ Suggest alternatives
✅ Acknowledge good work
✅ Use severity levels (Critical/Warning/Suggestion)
✅ Test the code if possible
✅ Check for security issues first

**Golden Rule**: Review code as you'd want yours reviewed - thoroughly but kindly.
