<!-- Context: standards/tests | Priority: critical | Version: 2.0 | Updated: 2026-05-08 -->

# Testing Standards

## Quick Reference

**Golden Rule**: Test behavior, not implementation

**Pyramid**: Unit (fast, many) → Integration (medium) → E2E (slow, few)

**Principles**: Independent, Deterministic, Readable, Fast

---

## Universal Principles

- **Test behavior, not implementation** — tests should survive refactors that don't change behavior
- **One assertion per test** — makes failures immediately obvious
- **Independent tests** — no shared mutable state between tests; each test sets up its own data
- **Deterministic** — same inputs always produce same outputs; no flakiness
- **Descriptive names** — `when {context}, {expected behavior}` format

## What to Test

### ✅ Always Test
- Public API contracts (inputs → outputs)
- Business logic and domain rules
- Error cases and edge cases
- Integration points (DB, external services)
- Security boundaries (auth, authorization)

### ❌ Don't Test
- Framework internals
- Implementation details (private methods, internal state)
- Trivial getters/setters with no logic
- Third-party library behavior

## Test Levels

### Unit Tests
- Pure functions and isolated modules
- No I/O — mock external dependencies
- Must be fast (< 10ms each)
- Highest volume

### Integration Tests
- Test real interactions between modules
- Use real database (test DB or in-memory)
- Test the full request/response cycle for API routes
- Use factories or fixtures for test data

### E2E Tests
- Critical user journeys only
- Run against a real (or staging) environment
- Playwright for web, httpx for APIs
- Slowest — keep to minimum

## Stack-Specific Runners

| Stack | Unit/Integration | E2E |
|-------|-----------------|-----|
| TypeScript | Vitest + Testing Library | Playwright |
| Python | pytest + httpx.AsyncClient | Playwright / pytest-playwright |
| C# | xUnit + Moq + TestContainers | Playwright |

## Test Structure (AAA Pattern)

```typescript
it('returns null when user does not exist', async () => {
  // Arrange
  const repo = new UserRepository(testDb)

  // Act
  const result = await repo.findById('non-existent-id')

  // Assert
  expect(result).toBeNull()
})
```

## Test Data

- **Factories** — build minimal valid objects; set only what the test needs
- **Fixtures** — use static fixtures for reference/lookup data that doesn't change
- **Never** share mutable state between tests
- **Isolate** DB tests with transactions rolled back after each test, or recreate tables

## Common Pitfalls

🔴 Tests that pass in isolation but fail in sequence (shared state)
🔴 Tests that depend on execution order
🔴 Mocking what you don't own (leads to false positives)
🟡 Over-mocking internal dependencies (test the real thing when fast enough)
🟡 Testing private methods directly (symptom of poor design)
🟡 Snapshot tests for everything (brittle, noisy diffs)

## Coverage

- Coverage is a floor, not a ceiling
- 80% coverage with meaningful tests > 100% with trivial assertions
- Focus on critical paths: auth, payments, data mutations
- Untested code is a liability — prioritize high-risk areas
