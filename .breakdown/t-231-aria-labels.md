# T-231 — Add Missing ARIA Labels to Icon Buttons

**Epic**: M9 / 9.4 Accessibility  
**Status**: 🟡 Todo  
**Priority**: P1  
**Severity**: 🟠 HIGH  
**Effort**: ~45 min  
**Good First Issue**: ✅ Yes

---

## Problem

Icon-only buttons throughout the UI have no accessible labels. Screen reader users hear "button" with no context:

```tsx
// Current — no label
<Button variant="ghost" size="icon" onClick={handleDelete}>
  <Trash2 className="h-4 w-4" />
</Button>

// Also problematic:
<Button onClick={handleRefresh}>
  <RefreshCw className="h-4 w-4" />
</Button>
```

Affected locations (likely — verify with grep):
- Delete tag button in `src/components/tag/tag-table.tsx`
- Copy digest button in `src/components/manifest/image-inspector.tsx`
- Refresh button in registry/repo views
- Theme toggle in `src/components/layout/`
- Sidebar toggle in `src/components/layout/`

---

## Solution

Add `aria-label` to every icon-only button:

```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={handleDelete}
  aria-label={`Delete tag ${tag.name}`}  // ← specific context, not just "Delete"
>
  <Trash2 className="h-4 w-4" aria-hidden="true" />   // ← hide icon from AT
</Button>
```

For tooltip buttons, use `Tooltip` + `aria-describedby` for extra context (already in shadcn/ui).

---

## Files

Run this grep to find all icon buttons missing labels:
```bash
grep -rn "size=\"icon\"" src/components/ | grep -v "aria-label"
```

Primary files:
- `src/components/tag/tag-table.tsx`
- `src/components/manifest/image-inspector.tsx`
- `src/components/layout/` (sidebar, topbar, theme toggle)
- `src/components/registry/` (delete, edit buttons)

---

## Dependencies

- None

---

## Acceptance Criteria

- [ ] `grep -rn 'size="icon"' src/components/ | grep -v 'aria-label'` returns no results
- [ ] Each `aria-label` is specific (e.g. `"Delete tag v1.0"` not just `"Delete"`)
- [ ] All decorative icons have `aria-hidden="true"`
- [ ] `bun run typecheck` passes

---

## Notes

Labels should include dynamic context when possible (e.g. the tag name). This prevents ambiguity when multiple delete buttons exist on the same page. Template: `aria-label={\`Delete tag ${tag.name}\`}`.
