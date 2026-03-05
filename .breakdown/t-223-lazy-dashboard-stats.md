# T-223 — Lazy-Load Dashboard Registry Stats

**Epic**: M9 / 9.3 Performance Optimization  
**Status**: 🟡 Todo  
**Priority**: P1  
**Severity**: 🟡 MEDIUM  
**Effort**: ~1 hr  
**Good First Issue**: No

---

## Problem

`src/hooks/use-dashboard-data.ts` lines 39–48 uses `useQueries` to fetch stats for **all** registries simultaneously on page load:

```ts
// Fires N concurrent requests — one per registry — immediately on mount
const statsQueries = useQueries({
  queries: registries.map(registry => ({
    queryKey: queryKeys.registries.byId(registry.id),
    queryFn: () => fetchRegistryStats(registry.id),
  }))
})
```

With 10 registries, this fires 10 concurrent API calls when the dashboard loads, even if the user's viewport only shows 2–3 stats cards.

---

## Solution

### Option A — Staggered loading (recommended)

Load first N registries eagerly, defer the rest:

```ts
const EAGER_COUNT = 3

const eagerRegistries = registries.slice(0, EAGER_COUNT)
const deferredRegistries = registries.slice(EAGER_COUNT)

const eagerQueries = useQueries({ queries: eagerRegistries.map(...) })

// Deferred — only fetch after eager queries complete
const allEagerDone = eagerQueries.every(q => !q.isLoading)
const deferredQueries = useQueries({
  queries: deferredRegistries.map(r => ({
    ...makeQuery(r),
    enabled: allEagerDone,   // wait for above-fold to complete
  }))
})
```

### Option B — Intersection Observer (complex)

Only fetch stats for registries whose cards are in the viewport. Requires passing refs from the components — higher complexity for diminishing returns.

---

## Files

- `src/hooks/use-dashboard-data.ts` — implement staggered `useQueries`

---

## Dependencies

- T-211 ✅ (query keys)

---

## Acceptance Criteria

- [ ] First 3 registry stats load immediately on mount
- [ ] Remaining stats load only after the first 3 complete
- [ ] Dashboard still displays all stats (no data hidden)
- [ ] `bun run typecheck` passes

---

## Notes

The `EAGER_COUNT` value (3) should be a constant or configurable. For most users with 1–3 registries, Option A effectively loads all stats and the deferred set is empty — no regression. For power users with many registries, this prevents a thundering herd on page load.
