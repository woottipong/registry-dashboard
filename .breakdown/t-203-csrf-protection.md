# T-203 — CSRF Protection

**Epic**: M9 / 9.1 Security Hardening  
**Status**: 🟡 Todo  
**Priority**: P0  
**Severity**: 🔴 CRITICAL  
**Effort**: ~1.5 hr  
**Good First Issue**: No

---

## Problem

All state-changing endpoints lack CSRF protection:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/v1/registries` (create registry)
- `PUT /api/v1/registries/[id]` (update registry)
- `DELETE /api/v1/registries/[id]` (delete registry)
- `DELETE /api/v1/registries/[id]/manifests/[...path]` (delete tag)

A malicious third-party site could submit cross-origin requests to these endpoints using the victim's browser cookies.

---

## Solution

### Option A — Custom Request Header Check (recommended, simpler)

Require `X-Requested-With: XMLHttpRequest` header on all mutating requests. Browsers enforce SOP — cross-origin forms cannot set custom headers.

```ts
// src/middleware.ts — add to existing middleware
const MUTATING_METHODS = ["POST", "PUT", "PATCH", "DELETE"]
if (MUTATING_METHODS.includes(request.method)) {
  const requestedWith = request.headers.get("X-Requested-With")
  if (requestedWith !== "XMLHttpRequest") {
    return new NextResponse(
      JSON.stringify({ success: false, data: null, error: { code: "CSRF_REJECTED", message: "CSRF check failed" } }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    )
  }
}
```

```ts
// src/lib/api-client.ts or fetch wrapper — add header on all mutations
headers: { "X-Requested-With": "XMLHttpRequest", ... }
```

### Option B — Double-Submit Cookie Pattern

Include a CSRF token in a non-HttpOnly cookie and require it to be echoed in the request header. More robust for public APIs but adds complexity not needed for a single-user self-hosted tool.

**Recommendation: Option A** for this project.

---

## Files

- `src/middleware.ts` — add CSRF check for mutating methods
- Any client-side fetch calls making POST/PUT/DELETE — add `X-Requested-With` header
- Document exclusions: `/api/auth/login` may need exemption (pre-auth)

---

## Dependencies

- None (can be done before T-201)

---

## Acceptance Criteria

- [ ] All POST/PUT/DELETE/PATCH routes reject requests without `X-Requested-With: XMLHttpRequest`
- [ ] Rejection returns `403` with `ApiResponse` error format
- [ ] Login endpoint (`/api/auth/login`) still works from the login form
- [ ] All existing mutations from client hooks continue to work (add the header to all fetch calls)
- [ ] `bun run typecheck` passes

---

## Notes

The `/api/auth/login` endpoint is a special case — the user is not yet authenticated, so it cannot use a session-based CSRF token. The custom header approach still protects it because cross-origin form submissions cannot set `X-Requested-With`. Exempt `/_next/` and `/api/health` from the check. Document CSRF approach in `SECURITY.md` (T-264).
