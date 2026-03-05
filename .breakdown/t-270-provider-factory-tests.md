# T-270 — Unit Tests: Provider Factory

**Epic**: M9 / 9.8 Testing  
**Status**: 🟡 Todo  
**Priority**: P2  
**Severity**: 🟡 MEDIUM  
**Effort**: ~2 hr  
**Good First Issue**: No

---

## Problem

`src/lib/providers/generic-provider.ts` and `src/lib/providers/dockerhub-provider.ts` have no unit tests. The providers contain critical business logic (namespace extraction, tag listing, auth token exchange) with no safety net against regressions.

---

## Solution

Create test files using Vitest with mocked `global.fetch`:

```ts
// src/lib/__tests__/generic-provider.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { GenericProvider } from "@/lib/providers/generic-provider"

describe("GenericProvider", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe("listNamespaces()", () => {
    it("groups repos by namespace prefix", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ repositories: ["app/web", "app/api", "nginx"] }),
      })
      vi.stubGlobal("fetch", mockFetch)

      const provider = new GenericProvider(mockClient)
      const ns = await provider.listNamespaces()

      expect(ns).toEqual([
        { name: "app", repositoryCount: 2 },
        { name: "",    repositoryCount: 1 },   // root namespace
      ])
      expect(mockFetch).toHaveBeenCalledTimes(1)   // no N+1
    })

    it("returns empty array for empty registry", async () => { ... })
    it("handles catalog fetch failure gracefully", async () => { ... })
  })

  describe("listTags()", () => { ... })
})
```

---

## Files

- `src/lib/__tests__/generic-provider.test.ts` — create (or extend if existing)
- `src/lib/__tests__/dockerhub-provider.test.ts` — create

---

## Dependencies

- T-250 (provider factory) — test the factory too if it exists

---

## Test Cases to Cover

### GenericProvider
- `listNamespaces()` — namespace grouping, root repos, empty registry
- `listRepositories(namespace)` — filtering, pagination edge cases
- `listTags(repo)` — empty tag list, pagination
- `capabilities()` — returns correct flags

### DockerHubProvider
- `listNamespaces()` — calls Hub API, not catalog
- `listTags(repo)` — handles `library/` prefix for official images
- `capabilities()` — `deleteTag` is false
- Token caching — does not re-fetch unexpired token
- Token refresh — fetches new token when expired

---

## Acceptance Criteria

- [ ] `bun test` passes with ≥80% line coverage on provider files
- [ ] `global.fetch` is mocked (never makes real HTTP requests)
- [ ] Tests cover happy path and error paths
- [ ] Tests run in isolation (no shared state between tests)

---

## Notes

Place tests in `src/lib/__tests__/`. Mock the `RegistryHttpClient` as a dependency of the providers, or mock `global.fetch` and let the real client run. The latter catches more surface area. See the Vitest docs for `vi.stubGlobal("fetch", ...)`.
