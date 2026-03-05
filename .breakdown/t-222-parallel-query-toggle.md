# T-222 — Disable Unused Parallel Queries

**Epic**: M9 / 9.3 Performance Optimization  
**Status**: 🟡 Todo  
**Priority**: P1  
**Severity**: 🟡 MEDIUM  
**Effort**: ~15 min  
**Good First Issue**: ✅ Yes

---

## Problem

`src/hooks/use-repositories-state.ts` lines 49–61 activates both `repositoriesQuery` and `searchQuery` at the same time, even though only one is actually shown in the UI:

```ts
// Both are always active — wasteful
const repositoriesQuery = useRepositories({ registryId, page, perPage, namespace })
const searchQuery = useSearchRepositories({ registryId, search: debouncedSearch })

// Only one is used:
const repositories = debouncedSearch ? searchQuery.data : repositoriesQuery.data
```

When search is active, `repositoriesQuery` is still fetching. When search is empty, `searchQuery` still refetches on re-renders. This doubles the API call count unnecessarily.

---

## Solution

Use TanStack Query's `enabled` option to mutually exclude the two queries:

```ts
const isSearchMode = debouncedSearch.length > 0

const repositoriesQuery = useRepositories({
  registryId,
  page,
  perPage,
  namespace,
  // Disable when in search mode
}, { enabled: !isSearchMode })

const searchQuery = useSearchRepositories({
  registryId,
  search: debouncedSearch,
  // Only fire when search term exists
}, { enabled: isSearchMode })
```

---

## Files

- `src/hooks/use-repositories-state.ts` — add `enabled` logic
- May need to update `useRepositories` and `useSearchRepositories` hook signatures to accept `enabled` option

---

## Dependencies

- T-211 ✅ (query keys in place)

---

## Acceptance Criteria

- [ ] When `debouncedSearch` is non-empty: only `searchQuery` fires, `repositoriesQuery` is disabled
- [ ] When `debouncedSearch` is empty: only `repositoriesQuery` fires, `searchQuery` is disabled
- [ ] Network tab shows ~50% fewer requests during browse + search transitions
- [ ] `bun run typecheck` passes

---

## Notes

TanStack Query v5 passes `enabled` as part of the options object. If the hook signatures don't currently accept `enabled`, add it: `useRepositories(params, options?: { enabled?: boolean })`. This is a pure performance win with no behavioral regression.
