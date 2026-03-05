# T-230 — Use Semantic `<table>` Elements

**Epic**: M9 / 9.4 Accessibility  
**Status**: 🟡 Todo  
**Priority**: P1  
**Severity**: 🟠 HIGH  
**Effort**: ~1 hr  
**Good First Issue**: No

---

## Problem

`src/components/repository/repo-table.tsx` and `src/components/tag/tag-table.tsx` render tabular data using `<div>` elements styled as a table rather than native HTML `<table>` elements. Screen readers cannot convey row/column relationships to users.

Example (current):
```tsx
<div role="grid">              ← no table semantics
  <div role="row">
    <div role="columnheader">Name</div>
    <div role="columnheader">Tags</div>
  </div>
  {repos.map(r => (
    <div role="row">
      <div role="gridcell">{r.name}</div>
      <div role="gridcell">{r.tagCount}</div>
    </div>
  ))}
</div>
```

---

## Solution

Replace with native `<table>` HTML. shadcn/ui ships a `Table` component (`src/components/ui/table.tsx`) that wraps native elements with proper styling:

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Tags</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {repos.map(r => (
      <TableRow key={r.name}>
        <TableCell>{r.name}</TableCell>
        <TableCell>{r.tagCount}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## Files

- `src/components/repository/repo-table.tsx` — replace div-grid with `<Table>`
- `src/components/tag/tag-table.tsx` — replace div-grid with `<Table>`
- `src/components/ui/table.tsx` — already exists (shadcn/ui); verify it's present

---

## Dependencies

- None

---

## Acceptance Criteria

- [ ] Both tables use native `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` elements (via shadcn `Table` component)
- [ ] VoiceOver / NVDA correctly announces table, row count, and column headers
- [ ] Sorting column headers have `aria-sort="ascending"` / `"descending"` / `"none"` when sortable
- [ ] Visual layout is unchanged
- [ ] `bun run typecheck` passes

---

## Notes

The shadcn `Table` component is already in the project. This is largely a mechanical swap with some styling adjustment. The `aria-sort` attribute on `<th>` requires wiring to the sort state — verify whether columns are sortable and add accordingly.
