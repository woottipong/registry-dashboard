# T-212 — `assertApiSuccess<T>()` Helper

**Epic**: M9 / 9.2 Code Quality & DRY  
**Status**: ✅ Done  
**Priority**: P0  
**Severity**: 🟡 MEDIUM  
**Effort**: ~30 min  
**Good First Issue**: ✅ Yes

---

## Summary

Added `assertApiSuccess<T>()` to `src/lib/error-handling.ts` to replace inconsistent inline response checking in hooks.

## What Was Done

- Added `assertApiSuccess<T>(response: Response): Promise<T>` to `src/lib/error-handling.ts`
- Refactored `src/hooks/use-registries.ts` to use it (replaced 3 separate local implementations: `registryKeys`, `readJson<T>`, `handleApiResponse<T>`)

## Files Modified

- `src/lib/error-handling.ts` — added `assertApiSuccess`
- `src/hooks/use-registries.ts` — removed local implementations
