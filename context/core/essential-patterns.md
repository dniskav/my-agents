# Essential Patterns — Multi-Stack Development

## Quick Reference

**Core Philosophy**: Composition over Inheritance, Domain Logic in the Domain Layer, Explicit over Implicit

**Universal patterns**:
- ✅ Composition over inheritance (modules, hooks, traits)
- ✅ Business logic in the domain layer — not in controllers/handlers/components
- ✅ Explicit transactions for multi-step critical operations
- ✅ Strict validation at system boundaries only
- ✅ Descriptive naming — code reads like prose

**Universal anti-patterns**:
- ❌ Fat controllers / fat handlers / fat components
- ❌ Deep inheritance hierarchies
- ❌ Silent failures (empty catch, swallowed exceptions)
- ❌ Synchronous external calls in critical paths
- ❌ `any` types / untyped parameters as escape hatches

---

## Stack references

For detailed patterns per stack, load the relevant skill or section:

- **TypeScript / React / Next.js** → `context/core/standards/code.md` (Frontend section) + `skills/frontend-design/`
- **Python** → `context/core/standards/code.md` (Python section) + `skills/python-engineer/SKILL.md`
- **C# / .NET** → `context/core/standards/code.md` (C# section) + `skills/csharp-dotnet/SKILL.md`

---

## Universal Testing Principles

- Test behavior from the user's perspective, not implementation details
- One assertion per test when possible — makes failures obvious
- Tests should be independent (no shared mutable state between tests)
- Fast tests enable fast feedback — avoid unnecessary I/O in unit tests
- Name tests as: `{when context} {expected behavior}`

Stack-specific test runners:
- TypeScript → Vitest + Testing Library + Playwright (E2E)
- Python → pytest + httpx.AsyncClient (API tests)
- C# → xUnit + Moq + TestContainers (integration)

---

## Universal Documentation Principles

- Document WHY, not WHAT (the code shows what; only the author knows why)
- Public APIs need examples, not just parameter descriptions
- Architecture decisions belong in ADR files, not inline comments
- Keep docs close to the code they describe (co-location)

---

## Quick Checklist (pre-commit)

- ✅ Business logic in domain layer, not controllers/handlers
- ✅ No `any` types or untyped parameters
- ✅ Explicit error handling at boundaries
- ✅ Tests written for new behavior
- ✅ No secrets, tokens, or credentials in code
- ✅ No synchronous external service calls in critical paths
