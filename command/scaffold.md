---
description: Generate base structure for a new component, module, or feature — auto-detects stack
---

# Scaffold Command

Generates the base file structure for a new component, module, feature, or service.

Usage: `/scaffold [type] [name]`

Examples:
- `/scaffold component UserProfile`
- `/scaffold page /dashboard/analytics`
- `/scaffold api-route /api/orders`
- `/scaffold service OrderService`
- `/scaffold feature checkout`

## Instructions for Agent

### Step 1 — Detect Stack
```bash
ls package.json pyproject.toml *.csproj Gemfile 2>/dev/null
cat package.json 2>/dev/null | grep -E '"next"|"react"|"vue"'
```

### Step 2 — Parse Intent

From the user's input, determine:
- **What to scaffold**: component / page / hook / service / API route / feature / entity / module
- **Name**: derive from user input

### Step 3 — Generate by Stack

---

## Next.js / React / TypeScript

### Component (`/scaffold component [Name]`)
```
components/
└── [Name]/
    ├── index.tsx          # Main component export
    ├── [Name].tsx         # Implementation
    ├── [Name].test.tsx    # Tests
    └── [Name].module.css  # Styles (if needed)
```

`[Name].tsx` template:
```typescript
interface [Name]Props {
  // props
}

export function [Name]({ }: [Name]Props) {
  return (
    <div>
      {/* content */}
    </div>
  )
}
```

### Page (`/scaffold page [route]`)
```
app/[route]/
├── page.tsx          # Server Component (default)
├── loading.tsx       # Loading UI
└── error.tsx         # Error boundary
```

### Hook (`/scaffold hook [name]`)
```
hooks/
└── use-[name].ts
```

Template:
```typescript
export function use[Name]() {
  // state and logic
  return { }
}
```

### API Route (`/scaffold api-route [path]`)
```
app/[path]/
└── route.ts
```

Template:
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  return NextResponse.json({ }, { status: 201 })
}
```

### Feature (`/scaffold feature [name]`)
Full vertical slice:
```
app/[name]/
├── page.tsx
├── loading.tsx
├── error.tsx
components/[name]/
├── [Name]List.tsx
└── [Name]Card.tsx
hooks/
└── use-[name].ts
lib/
└── [name].ts           # Data fetching / utilities
```

---

## C# / .NET

### Service (`/scaffold service [Name]`)
```
Features/[Name]/
├── [Name]Command.cs       # MediatR command
├── [Name]Handler.cs       # Command handler
├── [Name]Query.cs         # MediatR query (if needed)
├── [Name]QueryHandler.cs  # Query handler (if needed)
└── [Name]Dto.cs           # Data transfer objects
Tests/Features/[Name]/
└── [Name]HandlerTests.cs  # xUnit tests
```

### Entity (`/scaffold entity [Name]`)
```
Domain/Entities/[Name].cs
Infrastructure/Data/[Name]Configuration.cs  # EF Core config
Infrastructure/Migrations/               # dotnet ef migrations add Add[Name]
```

---

## Python (FastAPI)

### Module (`/scaffold module [name]`)
```
src/[name]/
├── __init__.py
├── router.py       # FastAPI router
├── service.py      # Business logic
├── schemas.py      # Pydantic models
└── repository.py   # Data access
tests/[name]/
├── __init__.py
└── test_[name].py
```

---

## After Generating

1. Show the user the file tree that will be created
2. Request approval
3. Create files with minimal working templates (no placeholder comments, no lorem ipsum)
4. Remind user to add the new route/module to the app's router/registry if needed
