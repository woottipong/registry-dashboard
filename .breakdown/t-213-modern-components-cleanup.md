# T-213 — Remove `modern-*` Component Duplicates

**Epic**: M9 / 9.2 Code Quality & DRY  
**Status**: 🟡 Todo  
**Priority**: P1  
**Severity**: 🟡 MEDIUM  
**Effort**: ~1 hr  
**Good First Issue**: No (requires design decision)

---

## Problem

There are 6 `modern-*` files that duplicate logic from their original counterparts. This doubles maintenance burden — every bug must be fixed in two places, and the design rationale for having both has been lost.

| Modern file | Original |
|-------------|----------|
| `src/app/modern-dashboard-client.tsx` | `src/app/dashboard-client.tsx` |
| `src/components/dashboard/modern-activity-feed.tsx` | `src/components/dashboard/activity-feed.tsx` |
| `src/components/dashboard/modern-stats-cards.tsx` | `src/components/dashboard/stats-cards.tsx` |
| `src/components/dashboard/modern-chart.tsx` | `src/components/dashboard/chart.tsx` (if exists) |
| `src/app/registries/modern-registries-page.tsx` | `src/app/registries/page.tsx` |
| `src/app/repos/modern-repos-client.tsx` | `src/app/repos/repos-client.tsx` |

---

## Solution

**Decision needed first**: Determine which version is canonical.

### Option A — Adopt `modern-*` as canonical (recommended)
1. Rename `modern-*` files → original names (e.g., `modern-dashboard-client.tsx` → `dashboard-client.tsx`)
2. Delete old original files
3. Update all imports

### Option B — Keep originals, merge `modern-*` improvements
1. Port animations/improvements from `modern-*` into original files
2. Delete `modern-*` files
3. Update all imports

---

## Files

- `src/app/modern-dashboard-client.tsx`
- `src/app/dashboard-client.tsx`
- `src/components/dashboard/modern-*.tsx`
- `src/app/registries/modern-registries-page.tsx`
- `src/app/repos/modern-repos-client.tsx`
- `src/app/page.tsx` — update import to chosen canonical

---

## Dependencies

- None — standalone

---

## Acceptance Criteria

- [ ] Zero `modern-` prefixed files remain in `src/`
- [ ] All imports updated to point to canonical files
- [ ] No visual regression (run dev server and compare pages)
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes

---

## Notes

Before deleting originals, diff each pair to find any improvements in the original that weren't ported to `modern-*`. The `modern-*` versions typically have Framer Motion animations + glassmorphism styling — verify the design decision with the maintainer before choosing a direction.
