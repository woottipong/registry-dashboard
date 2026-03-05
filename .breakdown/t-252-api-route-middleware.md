# T-252 — Extract API Route Middleware Helpers

**Epic**: M9 / 9.6 Architecture  
**Status**: 🟡 Todo  
**Priority**: P2  
**Severity**: 🟡 MEDIUM  
**Effort**: ~2 hr  
**Good First Issue**: No

---

## Problem

Each BFF API route handler repeats the same boilerplate for:
1. Resolving the registry from `params.id`
2. Verifying the session
3. Wrapping in try/catch and formatting errors as `ApiResponse`

```ts
// Repeated in every route:
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getIronSession(...)
    if (!session.user) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", ... }, data: null }, { status: 401 })
    }
    const registry = await getRegistry(params.id)
    if (!registry) {
      return NextResponse.json({ success: false, error: { code: "REGISTRY_NOT_FOUND", ... }, data: null }, { status: 404 })
    }
    // ... actual logic ...
  } catch (err) {
    return NextResponse.json({ success: false, error: formatError(err), data: null }, { status: 500 })
  }
}
```

This is ~15 lines of boilerplate per route, duplicated 8+ times.

---

## Solution

Create a higher-order route wrapper in `src/lib/api-helpers.ts`:

```ts
// src/lib/api-helpers.ts
export function withRegistryRoute<T>(
  handler: (params: { registry: RegistryConnection; req: Request }) => Promise<T>
) {
  return async (req: Request, { params }: { params: { id: string } }): Promise<NextResponse> => {
    try {
      const session = await getSession()
      if (!session.user) return unauthorizedResponse()

      const registry = await getRegistry(params.id)
      if (!registry) return notFoundResponse("REGISTRY_NOT_FOUND")

      const data = await handler({ registry, req })
      return NextResponse.json({ success: true, data, error: null })
    } catch (err) {
      return errorResponse(err)
    }
  }
}
```

Route usage becomes:
```ts
export const GET = withRegistryRoute(async ({ registry }) => {
  const provider = createProvider(registry)
  return provider.listNamespaces()
})
```

---

## Files

- `src/lib/api-helpers.ts` — create `withRegistryRoute()` wrapper
- `src/app/api/v1/registries/[id]/namespaces/route.ts` — refactor with wrapper
- `src/app/api/v1/registries/[id]/repositories/route.ts` — refactor with wrapper
- Other `[id]/*/route.ts` files — apply incrementally

---

## Dependencies

- T-200 ✅ (routes should already return `ApiResponse<T>`)
- T-250 (recommended — `createProvider` factory reduces more boilerplate)

---

## Acceptance Criteria

- [ ] `withRegistryRoute()` exists in `src/lib/api-helpers.ts`
- [ ] At least 3 routes refactored to use the wrapper
- [ ] Error handling is centralized — no duplicated try/catch blocks
- [ ] All refactored routes return `ApiResponse<T>` correctly
- [ ] `bun run typecheck` passes

---

## Notes

TypeScript generics let `withRegistryRoute<T>()` infer the correct response type from the handler's return type. The wrapper can be extended later to accept options like `requireCapability("deleteTag")` for automatic capability checking.
