# T-240 — Fix ESLint Errors

**Epic**: M9 / 9.5 Lint & Types  
**Status**: ✅ Done  
**Priority**: P0  
**Severity**: 🔴 CRITICAL  
**Effort**: ~2 hr  
**Completed**: Session 3

---

## Problem

26 ESLint errors across the codebase prevented clean `bun run lint` output, blocking CI pipelines and masking real issues.

Primary categories:
- `@typescript-eslint/no-explicit-any` — untyped parameters/returns
- `@typescript-eslint/no-unused-vars` — dead variables
- `react-hooks/exhaustive-deps` — missing effect dependencies
- `no-undef` — references to non-existent variables

---

## Solution Applied

Systematically fixed all 26 errors:

1. Replaced `any` with `unknown` and applied Zod/type-guard narrowing
2. Prefixed truly unused variables with `_` or removed them
3. Added missing dependencies to `useEffect`/`useCallback`/`useMemo` dependency arrays
4. Fixed undefined references (import issues)

---

## Files Affected

- `src/app/api/v1/registries/[id]/repositories/[...name]/route.ts`
- `src/components/repository/repo-table.tsx`
- `src/hooks/use-repositories-state.ts`
- `src/hooks/use-registries-state.ts`
- Various others across the codebase

---

## Verification

```bash
bun run lint
# ✓ 0 errors, 1 warning (TanStack Table React Compiler — unfixable, 3rd party)
```

---

## Notes

The remaining 1 warning is from the TanStack Table library's internal code and cannot be resolved without a library update. It was documented and accepted.
