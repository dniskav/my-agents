<!-- Context: standards/code | Priority: critical | Version: 3.0 | Updated: 2026-05-08 -->
# Code Standards (Multi-Stack)

## Quick Reference

**Core Philosophy**: Composition over Inheritance, Rich Domain Logic, Explicit over Implicit
**Golden Rule**: If you can't easily test it, refactor it

**Universal Patterns** (apply to every stack):
- ✅ Composition over inheritance
- ✅ Domain logic in the domain layer (models/services/entities), not in controllers/handlers
- ✅ Explicit transactions for multi-step critical operations
- ✅ Strict validation at system boundaries (user input, external APIs)
- ✅ Descriptive naming — code should read like prose
- ✅ Single responsibility per module/class/function

**Universal Anti-Patterns** (avoid in every stack):
- ❌ Fat controllers / fat handlers
- ❌ Deep inheritance hierarchies
- ❌ Silent failures (swallowed exceptions, empty catch blocks)
- ❌ Synchronous calls to external services in critical paths
- ❌ `any` types / dynamic casts as escape hatches

---

## Stack-Specific Standards

### Frontend — TypeScript / React / Next.js

**Architecture**:
- Server Components by default in Next.js App Router; use `"use client"` only when necessary (interactivity, browser APIs, hooks)
- Co-locate state as close to usage as possible; lift only when multiple consumers need it
- Global state with Zustand; server state with React Query or SWR
- Strict TypeScript (`strict: true` in tsconfig) — no `any`, no `@ts-ignore` without explanation

**Component Design**:
- Functional components with hooks exclusively (no class components)
- Extract reusable logic into custom hooks (`use` prefix)
- Keep components small: if it scrolls, split it
- Props interfaces over inline types for reusability
- Avoid prop drilling beyond 2 levels — use context or composition

**Styling**:
- Tailwind utility classes as primary approach
- CSS Modules for complex, component-specific styles
- Design tokens via CSS custom properties for theming
- Mobile-first responsive design

**Performance**:
- `React.memo` and `useMemo` only when profiling confirms need (premature optimization is code smell)
- Dynamic imports (`next/dynamic`) for heavy client-side components
- Optimize images with `next/image`
- Core Web Vitals as acceptance criteria for UI features

**Patterns**:
```typescript
// ✅ Server Component with async data
export default async function UserProfile({ id }: { id: string }) {
  const user = await getUser(id)
  return <ProfileCard user={user} />
}

// ✅ Custom hook encapsulating logic
function useCart() {
  const [items, setItems] = useState<CartItem[]>([])
  const total = useMemo(() => items.reduce((sum, i) => sum + i.price, 0), [items])
  const addItem = useCallback((item: CartItem) => setItems(prev => [...prev, item]), [])
  return { items, total, addItem }
}

// ❌ Business logic in component
function Checkout() {
  const handleSubmit = async () => {
    const tax = price * 0.21        // domain logic leaking into UI
    const final = price + tax
    await fetch('/api/order', ...)  // no error handling, no loading state
  }
}
```

**Testing**:
- Vitest + Testing Library for unit/integration
- Playwright for E2E (critical flows only)
- Test behavior from the user's perspective, not implementation details

---

### Python

→ Load skill `python-engineer` for detailed patterns, project structure, and tooling decisions.

**Quick rules**:
- Python 3.10+ with type hints everywhere
- `uv` for dependency management, `ruff` for lint/format, `mypy` for types
- `pytest` for all testing; async tests with `pytest-asyncio`
- `src/` layout with `pyproject.toml` (PEP 621)
- FastAPI for APIs, async by default

---

### C# / .NET

→ Load skill `csharp-dotnet` for detailed patterns, EF Core usage, and architecture decisions.

**Quick rules**:
- C# 12+ with .NET 8+ LTS
- Nullable reference types enabled (`<Nullable>enable</Nullable>`)
- Minimal APIs for simple services; MVC Controllers for complex apps
- EF Core with Code First migrations; avoid raw SQL unless performance-critical
- `xUnit` + `Moq` + `TestContainers` for testing
- Async/await throughout — never block async code with `.Result` or `.Wait()`

---

## Naming Conventions

| Stack | Classes | Files | Methods/Functions | Constants |
|-------|---------|-------|-------------------|-----------|
| TypeScript | `PascalCase` | `kebab-case.ts` | `camelCase` | `SCREAMING_SNAKE` |
| Python | `PascalCase` | `snake_case.py` | `snake_case` | `SCREAMING_SNAKE` |
| C# | `PascalCase` | `PascalCase.cs` | `PascalCase` | `PascalCase` (const) |

---

## Error Handling

```typescript
// TS ✅ — explicit Result type or typed throws
async function getUser(id: string): Promise<User | null> {
  const user = await db.user.findUnique({ where: { id } })
  return user
}

// TS ❌ — swallowed error
try { await riskyOp() } catch {}
```

```python
# Python ✅ — specific exceptions
try:
    result = await service.process(data)
except ValidationError as e:
    raise HTTPException(status_code=422, detail=str(e))

# Python ❌ — bare except
try:
    result = process()
except:
    pass
```

```csharp
// C# ✅ — domain exceptions or Result pattern
public async Task<Result<Order>> PlaceOrderAsync(PlaceOrderCommand cmd)
{
    if (!await _inventory.IsAvailable(cmd.ProductId))
        return Result.Failure<Order>("Product out of stock");
    // ...
}

// C# ❌ — catch all and swallow
try { await PlaceOrder(); } catch (Exception) { }
```

---

## Validation Boundaries

Only validate at system entry points:
- HTTP request handlers (controllers, route handlers, API endpoints)
- Message queue consumers
- CLI argument parsing
- External API response parsing

Trust internal code between validated boundaries. Do not add defensive null checks inside domain logic for data that was already validated at entry.
