# T-214 — Shared `useDebounce` Hook

**Epic**: M9 / 9.2 Code Quality & DRY  
**Status**: 🔵 In Progress  
**Priority**: P0  
**Severity**: 🟡 MEDIUM  
**Effort**: ~30 min  
**Good First Issue**: ✅ Yes

---

## Problem

The debounce pattern is duplicated in at least 3 places:

```ts
// use-repositories-state.ts lines 26-33
const [debouncedSearch, setDebouncedSearch] = useState("")
useEffect(() => {
  const timer = setTimeout(() => setDebouncedSearch(rawSearch), 300)
  return () => clearTimeout(timer)
}, [rawSearch])

// Same pattern in use-registries-state.ts and repos-client.tsx
```

Inconsistent delays (300ms vs 200ms), no shared type, and the pattern must be updated in 3 places for any change.

---

## Solution

### 1. Create `src/hooks/use-debounce.ts`

```ts
import { useState, useEffect } from "react"

export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
```

### 2. Update consumers

```ts
// Before (use-repositories-state.ts):
const [debouncedSearch, setDebouncedSearch] = useState("")
useEffect(() => { ... }, [rawSearch])

// After:
const debouncedSearch = useDebounce(rawSearch, 300)
```

---

## Files

- `src/hooks/use-debounce.ts` — **new file**
- `src/hooks/use-repositories-state.ts` — replace inline debounce
- `src/hooks/use-registries-state.ts` — replace inline debounce (if applicable)
- `src/app/repos/repos-client.tsx` — replace inline debounce (if applicable)

---

## Dependencies

- T-211 ✅ (query keys done — allows clean hook refactor)

---

## Acceptance Criteria

- [ ] `src/hooks/use-debounce.ts` created with generic `useDebounce<T>(value, delay?)` hook
- [ ] All 3 inline debounce patterns replaced with the shared hook
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes
- [ ] Search debouncing still works in the browser (test manually)
