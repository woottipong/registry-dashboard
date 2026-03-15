# Registry Dashboard — Copilot Instructions

Self-hosted Docker Registry V2 dashboard. Next.js 15 App Router, TypeScript 5, Tailwind CSS 4, shadcn/ui, TanStack Query v5, Zustand v5, Zod v3, iron-session, bun, Vitest + Playwright.

## Commands

```bash
bun dev            # Dev server :3000
bun test           # Unit tests (Vitest)
bun run test:e2e   # E2E tests (Playwright)
bun run typecheck  # tsc --noEmit
bun run lint:fix   # ESLint auto-fix
bun run build      # Production build
```

## Architecture

### BFF Proxy — Never Call Registry from Browser

All Docker Registry V2 calls go through `src/app/api/v1/` server-side routes. Never fetch `registry-1.docker.io` or any registry URL from client code. Reasons: CORS, credential hiding, response shaping, rate limits.

```
Browser → Next.js API Routes (/api/v1/*) → Docker Registry V2 API
```

### Provider Pattern

`RegistryProvider` interface abstracts registry differences:
- `GenericProvider` — vanilla Docker Registry V2
- `DockerHubProvider` — Hub API for catalog/search, Registry API for manifests

Always check `provider.capabilities()` before calling `deleteManifest()`, search, or catalog.

### Namespace-First Loading

1. `/api/v1/registries/[id]/namespaces` → `Namespace[]` (fast)
2. `/api/v1/registries/[id]/repositories?namespace=X` → `Repository[]`

`useRepositories` requires `namespace !== undefined` to fire. `_root` is the sentinel for root-level repos.

### Frontend URL Patterns

```
/repos                                     → namespace/registry overview
/repos?registry=<id>                       → repos filtered by registry
/repos?registry=<id>&namespace=<ns>        → repos in a namespace
/repos/<registryId>/<repoFullName>         → tag explorer
/repos/<registryId>/<repoFullName>?tag=<t> → image inspector
/registries                                → registry management
```

Never use `/repos/<registryId>` alone — the registry filter is a query param, not a path segment.

### Auth

- Single-user via `APP_USERNAME`/`APP_PASSWORD` env vars
- `iron-session` encrypted HTTP-only cookie
- Middleware guards all routes except `/login`, `/api/auth/*`, `/api/health`
- Login rate-limited: 5 attempts / 15 min / IP
- Timing-safe comparison via `crypto.timingSafeEqual`

## API Response Envelope

Every API route returns `ApiResponse<T>` from `@/types/api`:

```ts
{ success: true,  data: T,    error: null }
{ success: false, data: null,  error: { code, message, details? } }
```

Never return raw Docker Registry error format (`{ errors: [{code, message}] }`).

## Project Structure

```
src/app/api/v1/registries/[id]/   # BFF proxy routes (namespaces, repositories, manifests, blobs, ping)
src/app/api/auth/                  # login, logout, me
src/components/{domain}/           # one component per file, shadcn/ui primitives
src/hooks/                         # TanStack Query hooks (use-namespaces, use-repositories, use-tags, use-manifest)
src/lib/providers/                 # GenericProvider, DockerHubProvider
src/lib/constants/query-keys.ts    # Query key factory — always use this
src/stores/                        # Zustand (ui-store: sidebar, theme)
src/types/                         # registry.ts, manifest.ts, api.ts
```

## Critical Conventions

### Query Keys — Use the Factory

Use `queryKeys` from `@/lib/constants/query-keys.ts` for all TanStack Query hooks. Never use raw string arrays.

### CSRF Header on Mutations

All POST/PUT/DELETE requests must include `X-Requested-With: XMLHttpRequest`. Middleware enforces this.

### Repository Path Encoding

Use `encodeRepoPath()` from `@/lib/utils.ts` when building fetch URLs — repo names contain `/`.

### Docker Hub Specifics

- `/v2/_catalog` disabled → use Hub API instead
- Tag deletion not supported via API → hide delete button
- Bearer token exchange mandatory via `auth.docker.io/token`
- Rate limits: 100/6hr anon, 200/6hr auth
- Official images use `library/` prefix

## Code Style

| Rule | Convention |
|------|-----------|
| TypeScript | Strict, no `any` — use `unknown` + Zod/type guards |
| Naming | `camelCase` vars, `PascalCase` components/types, `kebab-case` files |
| Exports | Named only; default only for Next.js pages/layouts |
| Imports | `@/` alias; external → internal → relative |
| Components | One per file, props interface `{Name}Props`, shadcn/ui primitives |
| Data fetching | TanStack Query hooks in `src/hooks/`, never `useEffect` for registry data |
| Styling | Tailwind utilities, CSS variable colors (`bg-primary`), `cn()` for conditionals, dark-first |
| State | Server → TanStack Query, Client UI → Zustand `ui-store`, Registry config → file-based `registry-store.ts` |
| Errors | `assertApiSuccess<T>()` in hooks, `createAppError()` in API routes, fail fast with Zod at boundaries |
| Tests | Vitest + `mockFetch()` pattern (sequential response array), Playwright for E2E |

## Common Pitfalls

- **Hardcoded Tailwind colors** → use CSS variable classes (`bg-primary`, `text-card-foreground`)
- **Persisting all Zustand state** → use `partialize` to select specific fields
- **Forgetting `await` on route params** → `const { id } = await context.params`
- **Retrying 4xx errors** → query client skips retry on 4xx automatically
- **Not encoding repo paths** → use `encodeRepoPath()` for names with `/`
- **Calling registry from browser** → all calls go through BFF routes
- **Not checking provider capabilities** → always verify before `deleteManifest()`, search, catalog
