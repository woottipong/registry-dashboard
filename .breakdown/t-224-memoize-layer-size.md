# T-224 — Memoize Layer `maxSize` Calculation

**Epic**: M9 / 9.3 Performance Optimization  
**Status**: 🟡 Todo  
**Priority**: P2  
**Severity**: 🟢 LOW  
**Effort**: ~5 min  
**Good First Issue**: ✅ Yes

---

## Problem

`src/components/manifest/layer-list.tsx` line 20 recalculates the max layer size on every render:

```ts
// Re-runs Math.max spread on every render — no memoization
const maxSize = Math.max(...layers.map(l => l.size ?? 0))
```

While individually cheap, this runs on every parent re-render and every prop change — unnecessary work for a list that doesn't change.

---

## Solution

Wrap in `useMemo`:

```ts
import { useMemo } from "react"

const maxSize = useMemo(
  () => Math.max(...layers.map(l => l.size ?? 0)),
  [layers]
)
```

---

## Files

- `src/components/manifest/layer-list.tsx` — add `useMemo`

---

## Dependencies

- None

---

## Acceptance Criteria

- [ ] `maxSize` computed only when `layers` reference changes
- [ ] `useMemo` imported from React (verify import is updated)
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes

---

## Notes

This is a micro-optimization. The real value is establishing the pattern of memoizing derived computations in list/manifest components. Good first issue for anyone new to React performance patterns.
