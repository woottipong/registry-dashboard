# T-220 — Fix N+1 Query in `listNamespaces()`

**Epic**: M9 / 9.3 Performance Optimization  
**Status**: 🟡 Todo  
**Priority**: P1  
**Severity**: 🟠 HIGH  
**Effort**: ~1 hr  
**Good First Issue**: No

---

## Problem

`generic-provider.ts` `listNamespaces()` (lines 46–71) performs an N+1 query pattern:

```ts
// 1. Fetch catalog (1 request)
const repos = await this.client.getCatalog()  // → ["app/frontend", "app/backend", "nginx", ...]

// 2. For EACH repo, fetch tag count (N requests!)
const namespaceCounts = await Promise.all(
  repos.map(async (repo) => {
    const tags = await this.client.listTags(repo)  // ← N concurrent requests
    return { namespace: extractNamespace(repo), count: tags.length }
  })
)
```

For a registry with 100 repos, this fires 101 concurrent HTTP requests. The UI blocks on all of them completing before rendering the namespace list.

---

## Solution

Extract the namespace **purely from repo names** — no additional API calls needed.

```ts
async listNamespaces(): Promise<Namespace[]> {
  const repos = await this.client.getCatalog()

  // Group by namespace using repo path prefix — zero additional requests
  const countMap = new Map<string, number>()
  for (const repo of repos) {
    const slash = repo.indexOf("/")
    const ns = slash === -1 ? "" : repo.slice(0, slash)  // "" = root namespace
    countMap.set(ns, (countMap.get(ns) ?? 0) + 1)
  }

  return Array.from(countMap.entries()).map(([name, repositoryCount]) => ({
    name,
    repositoryCount,
    // Note: tagCount is no longer available without N+1 — omit or set to undefined
  }))
}
```

---

## Files

- `src/lib/providers/generic-provider.ts` — reimpliment `listNamespaces()`
- `src/types/registry.ts` — verify `Namespace` type handles optional `tagCount`

---

## Dependencies

- None

---

## Acceptance Criteria

- [ ] `listNamespaces()` makes exactly 1 HTTP request (catalog fetch)
- [ ] Namespace names are correctly extracted from repo path prefixes
- [ ] Root-level repos (no `/`) are grouped under the `""` (empty string) namespace
- [ ] `registoryCount` reflects the correct number of repos per namespace
- [ ] `bun run typecheck` passes
- [ ] No regression in `src/lib/__tests__/generic-provider.test.ts`

---

## Notes

The trade-off: namespace cards will no longer show total tag count (only repo count). This is an acceptable trade since users can see tag counts by drilling into the namespace. The `_root` sentinel in the URL is UI-level — the provider returns `""` for root repos. The UI route layer handles the conversion.
