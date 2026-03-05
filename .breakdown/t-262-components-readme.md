# T-262 — Add `src/components/` README

**Epic**: M9 / 9.7 Developer Experience  
**Status**: 🟡 Todo  
**Priority**: P2  
**Severity**: 🟢 LOW  
**Effort**: ~30 min  
**Good First Issue**: ✅ Yes

---

## Problem

`src/components/` has 8 subdirectories but no README. A developer wants to add a new component and doesn't know whether it should go in `registry/`, `repository/`, `manifest/`, `layout/`, `ui/`, or `dashboard/`. The naming conventions (`kebab-case`, one component per file) are in CLAUDE.md but not discoverable inside the component directory itself.

---

## Solution

Create `src/components/README.md`:

```md
# Components

## Directory Structure

| Directory | Purpose |
|-----------|---------|
| `ui/` | shadcn/ui base primitives (Button, Input, Dialog, etc.). **Do not edit these.** |
| `layout/` | App shell: Sidebar, Topbar, Breadcrumbs, AppShell |
| `dashboard/` | Dashboard page widgets: stats cards, activity feed |
| `registry/` | Registry-specific: RegistryCard, AddRegistryDialog |
| `repository/` | Repo browser: repo-table, repo-card |
| `tag/` | Tag list: tag-table, delete-dialog |
| `manifest/` | Image inspector: layer-list, config-inspector, history-timeline |
| `skeletons/` | Loading skeletons for each data type |

## Conventions

- One component per file
- File name = component name in `kebab-case` (e.g. `registry-card.tsx` → `RegistryCard`)
- Props interface named `{ComponentName}Props`
- Use `cn()` from `@/lib/utils` for conditional class names
- Never import from `ui/` with relative paths — always use `@/components/ui/`
- All animations must respect `prefers-reduced-motion` (use `motion-safe:` Tailwind prefix)
```

---

## Files

- `src/components/README.md` — create new

---

## Dependencies

- None

---

## Acceptance Criteria

- [ ] `src/components/README.md` exists
- [ ] All 8 subdirectories are listed with their purpose
- [ ] Naming conventions are documented
- [ ] File is accurate (verify against actual directory contents)

---

## Notes

Keep it short and scannable — this is a reference document, not a tutorial. Developers should be able to find the right directory in under 30 seconds.
