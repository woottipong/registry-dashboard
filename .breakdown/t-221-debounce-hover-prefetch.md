# T-221 — Debounce Tag Prefetch on Repo Hover

**Epic**: M9 / 9.3 Performance Optimization  
**Status**: 🟡 Todo  
**Priority**: P1  
**Severity**: 🟡 MEDIUM  
**Effort**: ~20 min  
**Good First Issue**: ✅ Yes

---

## Problem

`src/components/repository/repo-table.tsx` fires a tag prefetch on every `onMouseEnter` event:

```tsx
// Fire prefetch immediately on every hover — no debounce
onMouseEnter={() => {
  queryClient.prefetchQuery({ queryKey: queryKeys.tags.byRepo(registryId, repo.name) })
}}
```

A user moving the mouse quickly over 10 rows triggers 10 concurrent prefetch requests. With Docker Hub rate limits (200/6h), this can exhaust the rate limit while just browsing.

---

## Solution

Add a 200ms debounce before firing the prefetch, and cancel it on `onMouseLeave`:

```tsx
// Using the shared useDebounce hook (T-214):
const [hoveredRepo, setHoveredRepo] = useState<string | null>(null)
const debouncedHoveredRepo = useDebounce(hoveredRepo, 200)

useEffect(() => {
  if (debouncedHoveredRepo) {
    queryClient.prefetchQuery({
      queryKey: queryKeys.tags.byRepo(registryId, debouncedHoveredRepo),
      staleTime: STALE_TIME_TAGS,
    })
  }
}, [debouncedHoveredRepo, registryId, queryClient])

// In each row:
onMouseEnter={() => setHoveredRepo(repo.name)}
onMouseLeave={() => setHoveredRepo(null)}
```

---

## Files

- `src/components/repository/repo-table.tsx` — add debounced hover prefetch

---

## Dependencies

- T-214 (shared `useDebounce` hook) — or inline the debounce here if T-214 isn't done yet

---

## Acceptance Criteria

- [ ] Fast mouse movement over 10 rows fires at most 1–2 prefetch requests
- [ ] Hovering on a row for >200ms still triggers the prefetch
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes

---

## Notes

The 200ms delay is a good balance — intentional hover triggers prefetch, accidental hover (fast pass-through) does not. `STALE_TIME_TAGS` is defined in `src/lib/query-client.ts` (60 seconds).
