# T-210 — Extract `encodeRepoPath()` Utility

**Epic**: M9 / 9.2 Code Quality & DRY  
**Status**: ✅ Done  
**Priority**: P0  
**Severity**: 🟡 MEDIUM  
**Effort**: ~15 min  
**Good First Issue**: ✅ Yes

---

## Summary

Extracted the `encodeRepoPath()` function that appeared in duplicate in `use-tags.ts` and `use-manifest.ts` into a shared location in `src/lib/utils.ts`.

## What Was Done

- Added `encodeRepoPath(repo: string): string` to `src/lib/utils.ts`
- Removed duplicate implementations from `src/hooks/use-tags.ts` and `src/hooks/use-manifest.ts`
- Updated `src/hooks/use-repositories.ts` to also use the shared version

## Files Modified

- `src/lib/utils.ts` — added `encodeRepoPath`
- `src/hooks/use-tags.ts`
- `src/hooks/use-manifest.ts`
- `src/hooks/use-repositories.ts`
