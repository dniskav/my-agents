---
description: Run the complete testing pipeline for the current project, auto-detecting the stack
---

# Testing Pipeline (Multi-Stack)

Auto-detects the project stack and runs the appropriate test suite with linting and type checking.

## Stack Detection

```bash
# Run this first to detect stack
ls package.json pyproject.toml *.csproj 2>/dev/null
```

---

## Next.js / React / TypeScript

### Full Pipeline
```bash
# Type check
npx tsc --noEmit

# Lint
npx eslint . --ext .ts,.tsx --max-warnings 0

# Unit + Integration tests
npx vitest run --reporter=verbose

# or Jest:
npx jest --coverage

# E2E (Playwright — only if playwright is configured)
npx playwright test
```

### Test Strategy
- **Unit tests** (60%): hooks, utilities, pure functions
- **Integration tests** (30%): components with Testing Library — test behavior, not implementation
- **E2E tests** (10%): critical flows with Playwright

### Patterns
```typescript
// ✅ Testing Library — test user behavior
import { render, screen, userEvent } from '@testing-library/react'

test('adds item to cart on button click', async () => {
  render(<ProductCard product={mockProduct} />)
  await userEvent.click(screen.getByRole('button', { name: /add to cart/i }))
  expect(screen.getByText(/1 item/i)).toBeInTheDocument()
})

// ✅ Custom hook test
import { renderHook, act } from '@testing-library/react'

test('useCart adds and removes items', () => {
  const { result } = renderHook(() => useCart())
  act(() => result.current.addItem({ id: '1', price: 10 }))
  expect(result.current.total).toBe(10)
})
```

### Common Issues
- **Failing import**: Check `vitest.config.ts` aliases match `tsconfig.json` paths
- **Async state**: Use `waitFor` or `findBy*` queries for async updates
- **MSW not intercepting**: Ensure `server.listen()` is called in `beforeAll`

---

## Python

### Full Pipeline
```bash
# Format check
uv run ruff format --check .

# Lint
uv run ruff check .

# Type check
uv run mypy src/

# Tests with coverage
uv run pytest --cov=src --cov-report=term-missing -v
```

### Test Strategy
- `pytest` with fixtures (no heavy mocks)
- `pytest-asyncio` for async endpoints
- Real database via `TestContainers` or SQLite for unit tests
- `httpx.AsyncClient` for API integration tests

### Patterns
```python
# ✅ FastAPI integration test
async def test_create_user(client: AsyncClient):
    response = await client.post("/users", json={"email": "a@b.com"})
    assert response.status_code == 201
    assert response.json()["email"] == "a@b.com"
```

---

## C# / .NET

### Full Pipeline
```bash
# Format check
dotnet format --verify-no-changes

# Build (catches type errors)
dotnet build --no-restore

# Tests with coverage
dotnet test --collect:"XPlat Code Coverage" --logger trx

# View coverage report (optional)
reportgenerator -reports:coverage.xml -targetdir:coverage-report
```

### Test Strategy
- **xUnit** for all tests
- **Moq** for unit test mocks
- **TestContainers** for integration tests with real DB
- **WebApplicationFactory** for full HTTP stack tests

### Patterns
```csharp
// ✅ Handler unit test
public class PlaceOrderHandlerTests
{
    [Fact]
    public async Task Handle_WithValidCommand_ReturnsSuccess()
    {
        var inventoryMock = new Mock<IInventoryService>();
        inventoryMock.Setup(x => x.IsAvailable(It.IsAny<Guid>())).ReturnsAsync(true);

        var handler = new PlaceOrderHandler(inventoryMock.Object);
        var result = await handler.Handle(new PlaceOrderCommand(Guid.NewGuid()), CancellationToken.None);

        Assert.True(result.IsSuccess);
    }
}

// ✅ API integration test
public class OrdersApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task POST_Orders_Returns201()
    {
        var response = await _client.PostAsJsonAsync("/orders", new { productId = Guid.NewGuid() });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }
}
```

---

## Pipeline Steps (executed by agent)

1. Detect stack from project files
2. Run type checker / compiler
3. Run linter
4. Run test suite with coverage
5. Report: pass/fail counts, coverage %, any warnings
6. On failure: STOP → report → propose fix → request approval
