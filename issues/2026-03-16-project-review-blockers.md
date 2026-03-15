## Summary
Project review found merge blockers in API authentication behavior and local quality gates.

## Environment
- **Product/Service**: Registry Dashboard
- **Region/Version**: local branch review on `main`
- **Browser/OS**: N/A

## Reproduction Steps
1. Open the app and authenticate normally.
2. Let the session expire or clear the session cookie.
3. Trigger any authenticated API call such as `GET /api/v1/registries`.
4. Run `bun run typecheck`.
5. Run `bun run lint`.

## Expected Behavior
- Unauthenticated API requests return structured `401` JSON so the client can handle sign-out cleanly.
- `bun run typecheck` passes.
- `bun run lint` passes.

## Actual Behavior
- Unauthenticated API requests are redirected to `/login`, which returns HTML instead of JSON.
- `bun run typecheck` fails because `DockerHubProvider.deleteManifest()` no longer matches expected call sites.
- `bun run lint` fails with multiple unused symbol and test annotation errors.

## Error Details
```text
Typecheck:
src/lib/providers/__tests__/dockerhub-provider.test.ts(89,42): error TS2554: Expected 0 arguments, but got 2.
src/lib/providers/__tests__/dockerhub-provider.test.ts(94,42): error TS2554: Expected 0 arguments, but got 2.

Lint:
12 errors, including unused imports/variables and bare @ts-expect-error directives.
```

## Impact
**Medium** - The repo is not merge-ready under its own checks, and expired sessions can surface as JSON parse failures in the client instead of clean authentication errors.

## Additional Context
- Middleware currently redirects all unauthenticated requests, including `/api/*`, to `/login`.
- React Query hooks expect JSON API responses and will fail noisily when they receive redirected HTML.
- Suggested first fixes:
  1. Return `401` JSON for unauthenticated `/api/*` requests.
  2. Restore the `deleteManifest(repo, digest)` signature in the Docker Hub provider while keeping the unsupported behavior.
  3. Clear current lint failures so the quality gate is reliable again.
