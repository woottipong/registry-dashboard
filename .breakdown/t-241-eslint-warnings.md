# T-241 — Fix ESLint Warnings

**Epic**: M9 / 9.5 Lint & Types  
**Status**: ✅ Done  
**Priority**: P0  
**Severity**: 🟠 HIGH  
**Effort**: ~1 hr  
**Completed**: Session 3

---

## Problem

Multiple ESLint warnings existed alongside the 26 errors. Key warning categories:

- `@typescript-eslint/no-unused-vars` — variables declared but never used (warnings, not errors)
- Import-order inconsistencies
- Potentially unhandled promise rejections

---

## Solution Applied

Removed or prefixed unused imports and variables:

```ts
// Before:
import { foo, bar, baz } from "@/lib/something"  // baz never used

// After:
import { foo, bar } from "@/lib/something"
```

Cleaned up across all component and hook files flagged by the linter.

---

## Files Affected

- Multiple component files under `src/components/`
- Hook files under `src/hooks/`

---

## Verification

```bash
bun run lint
# ✓ 0 errors, 1 warning
# Remaining warning: TanStack Table React Compiler (3rd party, unfixable)
```

---

## Notes

The 1 remaining warning is explicitly from TanStack Table's internal implementation and is not actionable. It was triaged and accepted. TypeScript strict mode (`noUnusedLocals: true`) would catch future violations at compile time — this is a recommended follow-up (T-252 area).
