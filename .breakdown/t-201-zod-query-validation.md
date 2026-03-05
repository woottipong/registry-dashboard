# T-201 — Zod Validation on Query Params

**Epic**: M9 / 9.1 Security Hardening  
**Status**: 🟡 Todo  
**Priority**: P0  
**Severity**: 🔴 CRITICAL  
**Effort**: ~2 hr  
**Good First Issue**: ✅ Yes

---

## Problem

11 of 13 API routes have zero query parameter validation. `page`, `perPage`, `search`, and `namespace` are consumed raw from `searchParams` — they can be `NaN`, negative, `Infinity`, or oversized strings. This allows:

- Unintentional negative page numbers → confusing upstream Registry API calls
- `perPage=999999` → huge response payloads
- `search=<10000 chars>` → unbounded regex/string operations upstream

---

## Solution

### 1. Create shared schema

`src/lib/validators/query-schemas.ts`:
```ts
import { z } from "zod"

export const listQuerySchema = z.object({
  page:      z.coerce.number().int().min(1).default(1),
  perPage:   z.coerce.number().int().min(1).max(100).default(20),
  search:    z.string().max(200).optional(),
  namespace: z.string().max(200).optional(),
})

export type ListQuery = z.infer<typeof listQuerySchema>
```

### 2. Apply to all GET routes

```ts
// In each route handler:
const query = listQuerySchema.safeParse({
  page: searchParams.get("page"),
  perPage: searchParams.get("perPage"),
  search: searchParams.get("search"),
  namespace: searchParams.get("namespace"),
})
if (!query.success) {
  return NextResponse.json(
    { success: false, data: null, error: { code: "INVALID_PARAMS", message: query.error.message } },
    { status: 422 }
  )
}
const { page, perPage, search, namespace } = query.data
```

---

## Files

- `src/lib/validators/query-schemas.ts` — **new file**
- `src/app/api/v1/registries/[id]/repositories/route.ts`
- `src/app/api/v1/registries/[id]/namespaces/route.ts`
- `src/app/api/v1/registries/[id]/repositories/[...name]/route.ts`
- `src/app/api/v1/registries/[id]/manifests/[...path]/route.ts`
- `src/app/api/v1/registries/[id]/blobs/[...path]/route.ts`
- Any other routes accepting query params

---

## Dependencies

- None — standalone addition

---

## Acceptance Criteria

- [ ] `src/lib/validators/query-schemas.ts` created with `listQuerySchema`
- [ ] All GET routes parse `page`/`perPage`/`search`/`namespace` through Zod before use
- [ ] Invalid params return `422 Unprocessable Entity` with `ApiResponse` error
- [ ] Valid params pass through normally
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes

---

## Notes

`z.coerce.number()` handles string → number conversion from URL params. Use `z.string().max(200)` for search to prevent DoS via large inputs. The 422 status code is semantically correct for validation failures (distinct from 400 bad request).
