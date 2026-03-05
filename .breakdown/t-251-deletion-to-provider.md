# T-251 — Move Delete Logic into Provider

**Epic**: M9 / 9.6 Architecture  
**Status**: 🟡 Todo  
**Priority**: P2  
**Severity**: 🟡 MEDIUM  
**Effort**: ~1 hr  
**Good First Issue**: No

---

## Problem

Tag/manifest deletion is implemented directly inside API route handlers, bypassing the provider abstraction:

```ts
// src/app/api/v1/registries/[id]/manifests/[...path]/route.ts
export async function DELETE(req, { params }) {
  // Manually fetching the digest and calling the registry client directly
  const manifest = await client.getManifest(repo, reference)
  await client.deleteManifest(repo, manifest.digest)
  // ...
}
```

Consequences:
1. Docker Hub (which does not support tag deletion) requires an `if/else` branch IN the route
2. If a new provider has different deletion semantics, the route must change

The provider already has `capabilities()` — deletion behaviour should live there.

---

## Solution

Add `deleteTag(repo, reference)` to the `RegistryProvider` interface:

```ts
// src/lib/providers/types.ts
export interface RegistryProvider {
  // ... existing methods
  deleteTag(repo: string, reference: string): Promise<void>
  capabilities(): ProviderCapabilities
}
```

Implement in each provider:
```ts
// GenericProvider — standard V2 delete
async deleteTag(repo: string, reference: string): Promise<void> {
  const digest = await this.client.getDigest(repo, reference)
  await this.client.deleteManifest(repo, digest)
}

// DockerHubProvider — not supported
async deleteTag(): Promise<never> {
  throw new ProviderCapabilityError("Tag deletion is not supported on Docker Hub")
}
```

API route becomes:
```ts
const provider = createProvider(registry)
if (!provider.capabilities().deleteTag) {
  return errorResponse("TAG_DELETE_UNSUPPORTED", ...)
}
await provider.deleteTag(repo, reference)
```

---

## Files

- `src/lib/providers/types.ts` — extend `RegistryProvider` interface
- `src/lib/providers/generic-provider.ts` — implement `deleteTag()`
- `src/lib/providers/dockerhub-provider.ts` — implement `deleteTag()` as capability error
- `src/app/api/v1/registries/[id]/manifests/[...path]/route.ts` — use `provider.deleteTag()`

---

## Dependencies

- T-250 (recommended — `createProvider` factory should be in place)

---

## Acceptance Criteria

- [ ] `RegistryProvider` interface includes `deleteTag(repo, reference): Promise<void>`
- [ ] `GenericProvider.deleteTag()` successfully deletes via digest HEAD + DELETE
- [ ] `DockerHubProvider.deleteTag()` throws a descriptive capability error
- [ ] DELETE route checks `capabilities().deleteTag` before calling
- [ ] `bun run typecheck` passes

---

## Notes

The `ProviderCapabilityError` can be a custom error class in `src/lib/error-handling.ts`. The UI already hides the delete button for Docker Hub (`capabilities().deleteTag === false`) — this ensures the API layer is consistent even if the UI check is bypassed.
