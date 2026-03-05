# T-233 — Associate Form Labels with Inputs

**Epic**: M9 / 9.4 Accessibility  
**Status**: 🟡 Todo  
**Priority**: P1  
**Severity**: 🟠 HIGH  
**Effort**: ~1 hr  
**Good First Issue**: ✅ Yes

---

## Problem

Form inputs in `src/app/login/login-form.tsx` and registry management forms use placeholder text as a substitute for labels. Several inputs have no associated `<label>` element at all. Screen readers cannot announce the input's purpose.

```tsx
// Current — placeholder only, no label
<Input type="text" placeholder="Registry URL" />

// Also found in add-registry form:
<Input id="url" placeholder="https://registry.example.com" />
// ↑ has an id but no matching <label htmlFor="url">
```

---

## Solution

### Visible label (preferred)

Every input needs a `<label>` with a `htmlFor` matching the input's `id`:

```tsx
<div className="space-y-2">
  <Label htmlFor="registry-url">Registry URL</Label>
  <Input
    id="registry-url"
    type="url"
    placeholder="https://registry.example.com"
    aria-describedby="registry-url-hint"
  />
  <p id="registry-url-hint" className="text-sm text-muted-foreground">
    Include protocol (https://) and port if non-standard
  </p>
</div>
```

### Hidden label (when visible label is impractical)

```tsx
<Label htmlFor="search" className="sr-only">Search repositories</Label>
<Input id="search" type="search" placeholder="Search..." />
```

---

## Files

- `src/app/login/login-form.tsx`
- `src/app/registries/new/` (add registry form)
- `src/app/registries/[id]/` (edit registry form, if it exists)
- `src/components/registry/` (registry forms)

Run audit: `grep -rn "<Input" src/ | grep -v "aria-label\|htmlFor\|<Label"`

---

## Dependencies

- None

---

## Acceptance Criteria

- [ ] Every visible `<Input>` has an associated `<Label>` (visible or `sr-only`)
- [ ] All `<Select>` and `<Textarea>` elements also have labels
- [ ] Passwords use `type="password"` with a visible label
- [ ] `aria-describedby` used for hint/error text
- [ ] VoiceOver correctly announces label when focusing each input
- [ ] `bun run typecheck` passes

---

## Notes

The shadcn/ui `Label` component is already in the project. This integrates with the `htmlFor` / `id` pairing natively. Required for WCAG 2.1 Success Criterion 1.3.1 (Level A).
