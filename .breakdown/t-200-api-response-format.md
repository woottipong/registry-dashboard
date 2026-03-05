# T-200 — API Response Format Fix

**Epic**: M9 / 9.1 Security Hardening  
**Status**: 🟡 Todo  
**Priority**: P0  
**Severity**: 🔴 CRITICAL  
**Effort**: ~30 min  
**Good First Issue**: ✅ Yes

---

## Problem

`src/app/api/v1/registries/[id]/repositories/[...name]/route.ts` returns raw Docker Registry error format in some paths:

```ts
// ❌ Currently returns Docker Registry raw format:
return NextResponse.json({ errors: [{ code: "...", message: "..." }] }, { status: 404 })

// ✅ Must always return ApiResponse<T>:
return NextResponse.json({ success: false, data: null, error: { code: "...", message: "..." } }, { status: 404 })
```

All API routes **must** return `ApiResponse<T>` from `@/types/api`. Leaking the raw Docker Registry format breaks the client contract and exposes upstream implementation details.

---

## Solution

1. Audit every response in `repositories/[...name]/route.ts` (lines 19–22, 39–42, 88–92)
2. Replace any `{ errors: [...] }` response with `createAppError()` from `@/lib/error-handling.ts`
3. Verify no other API route has the same pattern: `grep -r '"errors"' src/app/api/`

---

## Files

- `src/app/api/v1/registries/[id]/repositories/[...name]/route.ts` — primary fix
- Run `grep -r '"errors":' src/app/api/` to catch any others

---

## Dependencies

- None — standalone fix

---

## Acceptance Criteria

- [ ] Zero occurrences of `{ errors: [...] }` in any API route response
- [ ] All error responses use `{ success: false, data: null, error: { code, message } }`
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes

---

## Notes

The `ApiResponse<T>` type is defined in `src/types/api.ts`. Helper `createAppError()` is in `src/lib/error-handling.ts`. The client hooks expect `payload.success` and `payload.error` — not `payload.errors`.
