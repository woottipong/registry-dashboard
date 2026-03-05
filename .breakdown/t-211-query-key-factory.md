# T-211 — Centralized Query Key Factory

**Epic**: M9 / 9.2 Code Quality & DRY  
**Status**: ✅ Done  
**Priority**: P0  
**Severity**: 🟡 MEDIUM  
**Effort**: ~45 min  
**Good First Issue**: ✅ Yes

---

## Summary

Created `src/lib/constants/query-keys.ts` with a structured `queryKeys` factory. All 5 hooks now use it instead of inline string arrays.

## What Was Done

- Created `src/lib/constants/query-keys.ts` with `queryKeys.registries`, `.namespaces`, `.repositories`, `.tags`, `.manifests`
- Updated all hooks: `use-registries.ts`, `use-namespaces.ts`, `use-repositories.ts`, `use-tags.ts`, `use-manifest.ts`

## Files Modified

- `src/lib/constants/query-keys.ts` — **new file**
- `src/hooks/use-registries.ts`
- `src/hooks/use-namespaces.ts`
- `src/hooks/use-repositories.ts`
- `src/hooks/use-tags.ts`
- `src/hooks/use-manifest.ts`
