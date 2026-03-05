# T-250 — Centralize Provider Instantiation

**Epic**: M9 / 9.6 Architecture  
**Status**: 🟡 Todo  
**Priority**: P2  
**Severity**: 🟡 MEDIUM  
**Effort**: ~2 hr  
**Good First Issue**: No

---

## Problem

`src/lib/providers/` exports `GenericProvider` and `DockerHubProvider` — but each API route that needs a provider must instantiate it manually:

```ts
// Duplicated across every API route:
const registry = await getRegistry(params.id)
const client = new RegistryHttpClient(registry)
const provider = registry.type === "dockerhub"
  ? new DockerHubProvider(client, registry)
  : new GenericProvider(client)
```

This pattern is repeated in:
- `/namespaces/route.ts`
- `/repositories/route.ts`
- `/repositories/[...name]/route.ts`
- `/manifests/[...path]/route.ts`
- `/blobs/[...path]/route.ts`

If a new registry type is added (e.g. GitHub Container Registry), every route must be updated.

---

## Solution

Create a factory function in `src/lib/providers/index.ts`:

```ts
// src/lib/providers/index.ts
export function createProvider(registry: RegistryConnection): RegistryProvider {
  const client = new RegistryHttpClient(registry)
  switch (registry.type) {
    case "dockerhub":
      return new DockerHubProvider(client, registry)
    case "generic":
    default:
      return new GenericProvider(client)
  }
}
```

Each API route then becomes:
```ts
const registry = await getRegistry(params.id)
const provider = createProvider(registry)     // ← single line
```

---

## Files

- `src/lib/providers/index.ts` — add `createProvider()` factory
- `src/app/api/v1/registries/[id]/namespaces/route.ts`
- `src/app/api/v1/registries/[id]/repositories/route.ts`
- `src/app/api/v1/registries/[id]/repositories/[...name]/route.ts`
- `src/app/api/v1/registries/[id]/manifests/[...path]/route.ts`
- `src/app/api/v1/registries/[id]/blobs/[...path]/route.ts`

---

## Dependencies

- None (but do this before T-251 which extends provider capabilities)

---

## Acceptance Criteria

- [ ] `createProvider(registry)` factory exists in `src/lib/providers/index.ts`
- [ ] All 5 BFF routes use `createProvider()` instead of inline instantiation
- [ ] Adding a third registry type requires only editing `createProvider()` — no route changes
- [ ] `bun run typecheck` passes

---

## Notes

The factory can also be a good place to add logging/"what provider was selected" tracing in the future. Aligns with the Open/Closed principle — routes are closed for modification, provider selection is open for extension.
