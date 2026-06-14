---
name: plan
description: Plan implementation of a feature, auto-detecting the project stack
---

You are planning a new feature. Start by detecting the project stack, then plan accordingly.

## STEP 1 — Detect Stack

Examine the project root for these indicators (in priority order):

| File/Pattern | Stack |
|---|---|
| `package.json` with `next` dep | Next.js / React / TypeScript |
| `package.json` without `next` | Node.js / TypeScript |
| `*.csproj` or `*.sln` | C# / .NET |
| `pyproject.toml` or `setup.py` | Python |

Run: `ls -la && cat package.json 2>/dev/null || cat pyproject.toml 2>/dev/null || ls *.csproj 2>/dev/null`

## STEP 2 — Load Stack Context

After detecting the stack, load the corresponding standards and skills:

- **Next.js/React/TS** → Load `context/core/standards/code.md` (frontend section) + consult context7 for Next.js/React docs
- **C#/.NET** → Load `context/core/standards/code.md` (C# section) + load `skills/csharp-dotnet/SKILL.md`
- **Python** → Load `context/core/standards/code.md` (Python section) + load `skills/python-engineer/SKILL.md`

## STEP 3 — Analyze Project Structure

Examine relevant files based on detected stack:

**Next.js/React**: Check `app/`, `components/`, `lib/`, `hooks/`, `store/`, existing patterns, `tailwind.config.*`
**C#/.NET**: Check project structure, `Program.cs`, existing services, controllers, `appsettings.json`, EF migrations
**Python**: Check `src/`, existing routers/services, `pyproject.toml` dependencies, existing patterns

## STEP 4 — Consult Documentation

Before asking questions, use context7 to look up:
- Framework-specific patterns relevant to the feature
- Library APIs you'll use
- Best practices for the specific use case

## STEP 5 — Ask Clarifying Questions

Ask up to 8 questions in groups of 2-3. Tailor questions to the stack:

**All stacks**:
- What is the exact user-facing behavior expected?
- What data needs to persist, and what's the shape?
- Are there authentication/authorization requirements?

**Frontend-specific**:
- Where does this live in the UI (new page, modal, inline)?
- Should it be a Server Component or needs client interactivity?
- Are there loading/error states to handle?

**Backend/API-specific**:
- What are the API contract requirements (request/response shape)?
- Are there performance constraints (expected load, latency SLAs)?
- Integration with external services?

Wait for answers between question groups.

## STEP 6 — Deliver Implementation Plan

Structure the plan by stack:

### Frontend Plan Template
```
## Feature: [name]
### Stack: Next.js / React / TypeScript

**Architecture decision**: Server Component / Client Component / hybrid — [justification]

**Files to create/modify**:
- `app/[route]/page.tsx` — [description]
- `components/[Name]/index.tsx` — [description]
- `lib/[name].ts` — [description]
- `hooks/use-[name].ts` — [description if needed]

**Data flow**:
- [how data reaches the component]

**State management**:
- [local state / Zustand store / server state via React Query]

**TDD Plan**:
- [ ] Unit: `use-[name].test.ts` — [what to test]
- [ ] Integration: `[Component].test.tsx` — [what to test]
- [ ] E2E: `[feature].spec.ts` — [critical flows]

**Implementation order** (Red → Green → Refactor):
1. [Step]
2. [Step]
```

### C# Plan Template
```
## Feature: [name]
### Stack: .NET / C#

**Architecture**: Minimal API endpoint / MVC Controller / CQRS command — [justification]

**Files to create/modify**:
- `Features/[Name]/[Name]Command.cs` — [description]
- `Features/[Name]/[Name]Handler.cs` — [description]
- `Data/Entities/[Name].cs` — [description if new entity]
- `Migrations/` — [migration description if needed]

**TDD Plan**:
- [ ] Unit: `[Name]HandlerTests.cs` — xUnit tests for handler logic
- [ ] Integration: `[Name]ApiTests.cs` — full HTTP request tests
- [ ] Repository: TestContainers for DB integration

**Implementation order**:
1. [Step]
2. [Step]
```

### Python Plan Template
```
## Feature: [name]
### Stack: Python / FastAPI

**Files to create/modify**:
- `src/[module]/router.py` — [endpoints]
- `src/[module]/service.py` — [business logic]
- `src/[module]/schemas.py` — [Pydantic models]
- `tests/[module]/test_[name].py` — [test file]

**TDD Plan**:
- [ ] pytest fixtures setup
- [ ] Service unit tests
- [ ] API integration tests with `httpx.AsyncClient`

**Implementation order**:
1. [Step]
2. [Step]
```

## TDD Implementation Order (all stacks)

1. Write failing tests (Red)
2. Implement minimal code to pass (Green)
3. Refactor (extract, clean, optimize)
4. Repeat per increment

Feature to plan: {FEATURE_DESCRIPTION}
