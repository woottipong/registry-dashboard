# T-232 — Respect `prefers-reduced-motion`

**Epic**: M9 / 9.4 Accessibility  
**Status**: 🟡 Todo  
**Priority**: P1  
**Severity**: 🟡 MEDIUM  
**Effort**: ~30 min  
**Good First Issue**: ✅ Yes

---

## Problem

CSS animations and transitions in `src/app/globals.css` and component-level inline styles do not check `prefers-reduced-motion`. Users with vestibular disorders who have set the OS-level "Reduce Motion" preference will still see spinning loaders, fade animations, and slide-in transitions.

---

## Solution

### In `globals.css` — global media query rule

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
```

### For Tailwind animations — use `motion-safe:` / `motion-reduce:` variants

```tsx
// Before:
<div className="animate-spin">

// After:
<div className="motion-safe:animate-spin">
```

### For framer-motion (if used) — check `useReducedMotion()`

```tsx
import { useReducedMotion } from "framer-motion"

const shouldReduceMotion = useReducedMotion()
<motion.div
  animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
/>
```

---

## Files

- `src/app/globals.css` — add global `prefers-reduced-motion` block
- Scan for `animate-` Tailwind classes: `grep -rn "animate-" src/components/`
- Replace with `motion-safe:animate-` variants

---

## Dependencies

- None

---

## Acceptance Criteria

- [ ] `globals.css` includes the `prefers-reduced-motion: reduce` block
- [ ] All Tailwind `animate-*` classes use `motion-safe:` prefix
- [ ] With "Reduce Motion" OS setting active, no spinning/fading animations visible
- [ ] Loading spinners are replaced with static indicators under reduced motion
- [ ] `bun run lint` passes

---

## Notes

WCAG 2.1 Success Criterion 2.3.3 (AAA) and 2.3.1 (AA) both cover motion. The global CSS rule is a safety net; the Tailwind `motion-safe:` approach is more explicit and preferred. Start with the global rule for a quick win, then audit individual components.
