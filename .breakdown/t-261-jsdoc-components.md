# T-261 — JSDoc for Complex Components

**Epic**: M9 / 9.7 Developer Experience  
**Status**: 🟡 Todo  
**Priority**: P2  
**Severity**: 🟢 LOW  
**Effort**: ~45 min  
**Good First Issue**: ✅ Yes

---

## Problem

Non-standard component props (multi-semantic, with quirks) have no documentation. When a developer wants to use `<ImageInspector />` or `<LayerList />`, they have to trace through the component file to understand what each prop means.

Specific offenders:
- `src/components/manifest/image-inspector.tsx` — props have opaque names
- `src/components/manifest/layer-list.tsx` — `maxSize` semantics unclear
- `src/components/repository/repo-table.tsx` — event callback prop semantics
- Custom hooks like `useManifest` — return shape is complex

---

## Solution

Add JSDoc prop comments to complex components:

```ts
interface ImageInspectorProps {
  /** The registry connection used to fetch manifests and config blobs. */
  registry: RegistryConnection
  /** Fully-qualified repository name (e.g. "library/nginx" for Docker Hub). */
  repository: string
  /**
   * The tag or digest reference to inspect.
   * Digest format: "sha256:abc123..."
   * Tag format: "latest", "v1.0.0", etc.
   */
  reference: string
}
```

---

## Files

Prioritised:
- `src/components/manifest/image-inspector.tsx`
- `src/components/manifest/layer-list.tsx`
- `src/hooks/use-manifest.ts` (return type documentation)

Secondary:
- `src/components/repository/repo-table.tsx`
- `src/components/tag/tag-table.tsx`

---

## Dependencies

- None

---

## Acceptance Criteria

- [ ] All `Props` interfaces for complex components have JSDoc on non-obvious fields
- [ ] Custom hooks have a JSDoc comment on the hook function explaining its purpose and return shape
- [ ] `bun run lint` passes

---

## Notes

Only document non-obvious props — skip things like `className?: string` or `children: React.ReactNode`. Focus on domain-specific values (registry IDs, digest formats, namespace sentinel values like `_root`).
