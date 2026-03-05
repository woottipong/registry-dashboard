# T-260 — JSDoc for Provider Classes

**Epic**: M9 / 9.7 Developer Experience  
**Status**: 🟡 Todo  
**Priority**: P2  
**Severity**: 🟢 LOW  
**Effort**: ~1 hr  
**Good First Issue**: ✅ Yes

---

## Problem

`src/lib/providers/generic-provider.ts` and `src/lib/providers/dockerhub-provider.ts` have no JSDoc comments. A developer new to the codebase can't distinguish the two providers or understand their behavioural differences without reading every line.

---

## Solution

Add JSDoc to each class and public method:

```ts
/**
 * Generic Docker Registry V2 provider.
 *
 * Supports any registry that implements the standard Docker Registry HTTP API V2.
 * See: https://distribution.github.io/distribution/spec/api/
 *
 * @example
 * const provider = new GenericProvider(client)
 * const namespaces = await provider.listNamespaces() // derived from /v2/_catalog
 */
export class GenericProvider implements RegistryProvider {
  /**
   * Lists namespaces derived from repository path prefixes.
   * Makes exactly 1 HTTP request (catalog fetch).
   * Root-level repos (no "/" in name) are grouped under the "" namespace.
   */
  async listNamespaces(): Promise<Namespace[]> { ... }
}
```

---

## Files

- `src/lib/providers/generic-provider.ts`
- `src/lib/providers/dockerhub-provider.ts`
- `src/lib/providers/types.ts` — add JSDoc to the `RegistryProvider` interface methods

---

## Dependencies

- None (but do after T-250 so the factory is also documented)

---

## Acceptance Criteria

- [ ] All public methods in both provider classes have JSDoc
- [ ] `RegistryProvider` interface has method-level docs explaining contracts
- [ ] Class-level `@example` blocks show basic usage
- [ ] `bun run lint` passes (no JSDoc lint errors)

---

## Notes

Focus on "why" and "gotchas" (e.g. Docker Hub rate limits, the `_catalog` limitation, JWT token lifetime). Skip internal private methods unless behaviour is non-obvious.
