# T-263 — Document API Contract (OpenAPI or Markdown)

**Epic**: M9 / 9.7 Developer Experience  
**Status**: 🟡 Todo  
**Priority**: P2  
**Severity**: 🟡 MEDIUM  
**Effort**: ~3 hr  
**Good First Issue**: No

---

## Problem

The BFF API routes under `src/app/api/v1/` have no machine-readable or human-readable contract documentation. Developers building new hooks or debugging issues must trace through each route file to discover:
- What query parameters are accepted
- What the response shape is
- What error codes are returned
- What authentication is required

Without a contract document, breaking changes are invisible until runtime.

---

## Solution

### Option A — Markdown API Reference (quick, 1 pass)

Create `doc/api-reference.md`:

```md
# Registry Dashboard — BFF API Reference

All routes require session authentication (HTTP-only cookie).
All responses use `ApiResponse<T>` format.

## Authentication
POST /api/auth/login
POST /api/auth/logout  
GET  /api/auth/me

## Registries
GET  /api/v1/registries/[id]/namespaces
  Response: ApiResponse<Namespace[]>
  
GET  /api/v1/registries/[id]/repositories
  Query: ?namespace=string&page=number&perPage=number&search=string
  Response: ApiResponse<Repository[]>
  
...
```

### Option B — OpenAPI 3.1 spec (better, 2–3 passes)

Create `doc/openapi.yaml` + add `@anatine/zod-openapi` to generate schemas from Zod validators (after T-201).

---

## Files

- `doc/api-reference.md` (Option A) — create new
- OR `doc/openapi.yaml` (Option B)

---

## Dependencies

- T-200 ✅ (routes should use `ApiResponse<T>`)
- T-201 (Zod query validation) — do T-263 after T-201 so the documented query params are accurate

---

## Acceptance Criteria

**Option A:**
- [ ] All 13 BFF API routes are documented
- [ ] Request params, response shape, and error codes are listed for each
- [ ] Auth requirements are noted

**Option B (if chosen):**
- [ ] `openapi.yaml` is valid (passes `swagger-parser` validation)
- [ ] Schema definitions match actual Zod validators

---

## Notes

Start with Option A for speed — a markdown file is better than nothing and takes 2–3 hours. Option B adds maintainability but requires more tooling. Option B can be done as a follow-up after the Markdown version stabilises.
