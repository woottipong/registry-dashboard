# T-266 — Extract Hardcoded Magic Values

**Epic**: M9 / 9.7 Developer Experience  
**Status**: 🟡 Todo  
**Priority**: P2  
**Severity**: 🟢 LOW  
**Effort**: ~45 min  
**Good First Issue**: ✅ Yes

---

## Problem

Numeric and string literals are scattered inline with no explanation:

```ts
// What does 5 mean? Why 60000?
await new Promise(r => setTimeout(r, 60000))

// Why 100? Is this the Hub rate limit?
if (tagCount > 100) { ... }

// Why "library"? Is this Docker Hub specific?
const repo = namespace === "library" ? name : `${namespace}/${name}`
```

Found across:
- `src/lib/providers/dockerhub-provider.ts` — rate limit values, token TTL
- `src/lib/registry-client.ts` — timeout values
- `src/hooks/use-repositories-state.ts` — pagination defaults, debounce delays
- `src/components/dashboard/` — stats thresholds

---

## Solution

Create `src/lib/constants/` (already exists from T-211) and add a new file:

```ts
// src/lib/constants/index.ts (or split across files)
export const DOCKER_HUB_RATE_LIMIT_ANONYMOUS = 100       // req / 6 hours
export const DOCKER_HUB_RATE_LIMIT_AUTHENTICATED = 200   // req / 6 hours
export const DOCKER_HUB_NAMESPACE_OFFICIAL = "library"   // official image namespace

export const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000      // 5 min before actual expiry
export const REQUEST_TIMEOUT_MS = 30_000                   // 30s HTTP timeout

export const DEFAULT_PAGE_SIZE = 20
export const DEFAULT_DEBOUNCE_MS = 300

export const ROOT_NAMESPACE_SENTINEL = "_root"            // URL param for root repos
```

Replace each inline literal with the named constant.

---

## Files

- `src/lib/constants/index.ts` — create or extend
- `src/lib/providers/dockerhub-provider.ts`
- `src/lib/registry-client.ts`
- `src/hooks/use-repositories-state.ts`

---

## Dependencies

- T-211 ✅ (`constants/query-keys.ts` already established the directory)

---

## Acceptance Criteria

- [ ] No unexplained numeric literals (timeouts, limits, counts) in provider/hook files
- [ ] Constants are named descriptively with units in the name (e.g. `_MS`, `_MB`)
- [ ] `bun run typecheck` passes

---

## Notes

Use `const` with `as const` for string unions. Group constants by domain in separate files if the set grows large: `constants/docker-hub.ts`, `constants/ui.ts`. Priority: anything in `providers/` and network client code first.
