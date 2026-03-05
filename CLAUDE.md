# Registry Dashboard — Project Instructions

> **Agent startup rule**: At the start of every new conversation, read this file (`CLAUDE.md`) **once** before writing any code or making any edits. It is the single source of truth for conventions, commands, URL patterns, and design decisions.

---

## Project Overview

Registry Dashboard is a modern, self-hosted web dashboard for browsing and managing Docker container images stored in Docker Registry V2 compatible registries. It supports multiple registries simultaneously, including Docker Hub and vanilla Registry V2.

**Full specification**: See `spec.md` for detailed features, data models, and API design.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router) with TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Data Fetching**: TanStack Query v5
- **State**: Zustand v5 (client-side, persisted)
- **Validation**: Zod v3
- **Icons**: Lucide React
- **Charts**: Recharts
- **Session**: iron-session (encrypted HTTP-only cookie)
- **Package Manager**: bun
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Linting**: ESLint + Prettier

---

## Commands

```bash
# Install dependencies
bun install

# Development
bun dev                     # Start dev server on :3000

# Build & Production
bun run build               # Production build
bun run start               # Start production server

# Testing
bun test                    # Run unit tests (Vitest)
bun run test:watch          # Run tests in watch mode
bun run test:e2e            # Run E2E tests (Playwright)

# Code Quality
bun run lint                # Run ESLint
bun run lint:fix            # Auto-fix lint issues
bun run format              # Run Prettier
bun run typecheck           # Run tsc --noEmit

# Docker (development)
docker compose up -d registry   # Start local registry on :5000
docker compose up -d            # Start both registry + UI
```

---

## Architecture

### BFF Proxy Pattern

The app uses Next.js API Routes as a Backend-for-Frontend proxy. **Never call Docker Registry V2 API directly from the browser** — all registry communication goes through server-side API routes.

```
Browser → Next.js API Routes (/api/v1/*) → Docker Registry V2 API
```

Reasons: CORS avoidance, credential hiding, response shaping, rate limit control.

### Provider Pattern

Different registries have different capabilities. Use the `RegistryProvider` interface to abstract differences:

- `GenericProvider` — vanilla Docker Registry V2 (`src/lib/providers/generic-provider.ts`)
- `DockerHubProvider` — uses Hub API for catalog/search, Registry API for manifests (`src/lib/providers/dockerhub-provider.ts`)

Always check `provider.capabilities()` before calling operations like `deleteManifest()`.

### Namespace-First Loading

Repositories are loaded via a two-step flow for performance:

1. **`/api/v1/registries/[id]/namespaces`** → returns `Namespace[]` (fast: tag counts per namespace)
2. **`/api/v1/registries/[id]/repositories?namespace=X`** → returns `Repository[]` filtered by namespace

The URL uses `_root` as a sentinel value for the empty-string namespace (root-level repos without a `/`).

### Frontend URL Patterns

Use these exact URL shapes when building navigation links:

```
/repos                                    → namespace/registry overview
/repos?registry=<id>                      → repos filtered by registry  ← Browse button target
/repos?registry=<id>&namespace=<ns>       → repos in a namespace
/repos?registry=<id>&namespace=_root      → root-level repos
/repos/<registryId>/<repoFullName>        → tag explorer for a repo
/repos/<registryId>/<repoFullName>?tag=<t> → image inspector for a tag
/registries                               → registry management
/registries/<id>/edit                     → edit a registry
```

**Never** use `/repos/<registryId>` alone as a route — the registry filter is a query param, not a path segment.

### Authentication

- **App login**: Single-user auth via `APP_USERNAME` / `APP_PASSWORD` env vars
- **Session**: `iron-session` with encrypted HTTP-only cookie (`registry-dashboard-session`)
- **Middleware** (`src/middleware.ts`): Guards all routes except `/login`, `/api/auth/*`, `/api/health`
- **Rate limiting**: Login endpoint is rate-limited to 5 attempts / 15 min / IP (in-memory)
- **Timing-safe**: Uses Node `crypto.timingSafeEqual` with length padding to prevent timing attacks

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/           # login, logout, me (session auth)
│   │   ├── health/         # health check (public)
│   │   └── v1/             # BFF API proxy
│   │       ├── registries/
│   │       │   └── [id]/
│   │       │       ├── namespaces/     # GET → Namespace[]
│   │       │       ├── repositories/   # GET → Repository[] (supports ?namespace=)
│   │       │       ├── repositories/[...name]/  # GET tags, DELETE repo
│   │       │       ├── manifests/[...path]/     # GET/HEAD/DELETE manifest
│   │       │       ├── blobs/[...path]/         # GET config blob
│   │       │       └── ping/                    # GET registry health
│   │       └── activities/ # activity log
│   ├── login/              # login page + form
│   ├── registries/         # registry management pages
│   └── repos/              # namespace browser + repo list + tag explorer + image inspector
├── components/
│   ├── ui/                 # shadcn/ui base components
│   ├── layout/             # Sidebar, topbar, breadcrumbs, app-shell
│   ├── registry/           # Registry-specific components
│   ├── repository/         # repo-table.tsx (row layout), repo-card.tsx
│   ├── tag/                # tag-table.tsx, delete-dialog.tsx
│   ├── manifest/           # image-inspector, layer-list, config-inspector, history-timeline
│   └── dashboard/          # stats cards, charts
├── hooks/
│   ├── use-namespaces.ts   # fetches Namespace[] for a registry
│   ├── use-repositories.ts # fetches Repository[] (supports namespace filter)
│   ├── use-tags.ts         # fetches Tag[] for a repo
│   └── use-manifest.ts     # fetches ImageManifest + ImageConfig
├── lib/
│   ├── providers/          # GenericProvider, DockerHubProvider
│   ├── registry-client.ts  # RegistryHttpClient (handles auth headers)
│   ├── registry-store.ts   # file-based registry config persistence (DATA_DIR)
│   ├── session.ts          # iron-session setup
│   └── config.ts           # Zod-validated env vars
├── stores/                 # Zustand (ui-store: theme, sidebar)
└── types/
    ├── registry.ts         # RegistryConnection, Repository, Tag, Namespace
    ├── manifest.ts         # ImageManifest, ImageConfig, etc.
    └── api.ts              # ApiResponse<T>
```

---

## API Response Standard

**Every API route** must return `ApiResponse<T>` from `@/types/api`:

```ts
// Success
{ success: true,  data: T,    error: null }

// Error
{ success: false, data: null, error: { code: string, message: string, details?: unknown } }
```

**Never** use raw Docker Registry format (`{ errors: [{code, message}] }`) — that is the upstream format from the registry, not our API format.

---

## Coding Conventions

### General

- **Language**: TypeScript strict mode. No `any` — use `unknown` and narrow with Zod or type guards.
- **Naming**: `camelCase` for variables/functions, `PascalCase` for components/types/interfaces, `kebab-case` for files and directories.
- **Exports**: Named exports only. No default exports except for Next.js pages/layouts (required by framework).
- **Imports**: Use `@/` path alias for imports from `src/`. Group imports: external libs → internal modules → relative paths.

### Components

- One component per file. File name matches component name in kebab-case (e.g., `registry-card.tsx` exports `RegistryCard`).
- Use `interface` for component props, named `{ComponentName}Props`.
- Colocate component-specific types in the component file. Shared types go in `types/`.
- Use shadcn/ui primitives as the foundation. Do not install additional UI libraries.

### Data Fetching

- Use TanStack Query for all server state. Define query hooks in `hooks/`.
- Query key convention: `[entity, ...params]` — e.g., `["namespaces", registryId]`, `["repositories", registryId, page, perPage, search, namespace]`, `["tags", registryId, repoName]`.
- Stale times: `STALE_TIME_REPOSITORIES` (30s), `STALE_TIME_TAGS` (60s), `STALE_TIME_MANIFEST` (10min) — defined in `lib/query-client.ts`.
- Never fetch registry data in `useEffect`. Always use query hooks.
- `useRepositories` requires `namespace !== undefined` to fire (prevents loading all repos on initial page load).

### API Routes

- All registry proxy routes go under `app/api/v1/`.
- Auth routes under `app/api/auth/` (login, logout, me).
- Use Zod to validate request body (activities route uses Zod schema).
- Return `ApiResponse<T>` — see standard above.
- Handle registry auth server-side. Never leak credentials to the client.

### State Management

- **Server state**: TanStack Query (registries, namespaces, repos, tags, manifests).
- **Client state**: Zustand (`ui-store`: sidebar open, theme preference).
- Registry connections are persisted as JSON files in `DATA_DIR` (server-side), not in the browser.

### Styling

- Use Tailwind CSS utility classes directly.
- Dark mode first. Use `dark:` variant for light mode overrides.
- Theme tokens defined in `src/app/globals.css` as CSS variables (`--background`, `--primary`, etc.) with `@theme inline`.
- `tailwind.config.ts` must **not** hardcode color values — map to CSS vars instead.
- Use `cn()` utility (from `lib/utils.ts`) for conditional class names.

### Error Handling

- Fail fast at API boundary. Validate all inputs with Zod.
- Use error boundaries for React component errors.
- Show user-friendly error messages. Log technical details to console (errors only, no debug `console.log` in production).
- Handle registry-specific errors: 401 (auth failed), 404 (not found), 429 (rate limited), 502 (registry unreachable).

---

## Docker Hub Specifics

Docker Hub uses **two separate APIs**:

1. **Registry API** (`registry-1.docker.io`) — manifests, tags, blobs
2. **Hub API** (`hub.docker.com/v2/`) — catalog, search, repo metadata

Key differences:
- `/v2/_catalog` is **disabled** on Docker Hub → use Hub API instead
- Tag deletion is **not supported** via API
- Bearer token exchange is **mandatory** (via `auth.docker.io/token`)
- Rate limits apply: 100/6hr anonymous, 200/6hr authenticated
- Official images use the `library/` namespace prefix
- `DockerHubProvider.listNamespaces()` returns a single namespace (the authenticated user/org)

Always check `provider.capabilities()` before assuming standard Registry V2 behavior.

---

## Testing

### Unit Tests (Vitest)

- Place test files in `lib/__tests__/` or `hooks/__tests__/`.
- Test registry providers with mocked `global.fetch`.
- Test utility functions (formatters, parsers) with edge cases.

### E2E Tests (Playwright)

- Place in `e2e/` directory.
- Use the local Docker registry from `docker-compose.yml` as test target.
- Test critical flows: add registry → browse namespaces → browse repos → inspect image → delete tag.

---

## Environment Variables

All variables validated by Zod at startup (`src/lib/config.ts`). Missing required vars throw on boot.

```bash
# Required
SESSION_SECRET              # Encryption key — min 32 chars, generate: openssl rand -base64 32
APP_PASSWORD                # Dashboard login password — min 8 chars

# Optional
APP_USERNAME                # Dashboard login username (default: "admin")
DATA_DIR                    # Registry config storage path (default: "./data")
DEFAULT_REGISTRY_URL        # Pre-configured registry URL
DEFAULT_REGISTRY_NAME       # Display name for default registry
DEFAULT_REGISTRY_AUTH_TYPE  # "none" | "basic" | "bearer" (default: "none")
DEFAULT_REGISTRY_USERNAME   # Credentials for default registry
DEFAULT_REGISTRY_PASSWORD
```

Never hardcode registry URLs or credentials. Never use a hardcoded `SESSION_SECRET` fallback.

---

## Key Design Decisions

1. **File-based registry storage** — Registry connections stored as JSON in `DATA_DIR` (server-side). No database needed for single-user MVP. Add DB (SQLite/Postgres) only for multi-user.

2. **BFF over direct API calls** — Docker Registry V2 lacks CORS and credentials must be protected. Every registry call goes through Next.js API Routes.

3. **Namespace-first loading** — Loading all repos at once is slow for large registries. The UI first loads namespaces (fast), then loads repos only when a namespace is selected.

4. **Provider abstraction** — Different registries have different capabilities. The UI adapts based on `provider.capabilities()` (e.g., hide delete button for Docker Hub, hide search for generic registries).

5. **Dark-first design** — Primary audience is DevOps/developers who prefer dark themes. Light mode is supported via CSS variable theming.

6. **Selective caching** — Registry data changes infrequently. Short stale times (30s repos, 60s tags) balance freshness with Docker Hub rate limit conservation.

7. **Single-user auth** — Simple username/password from env vars, secured with timing-safe comparison, rate limiting, and iron-session encrypted cookies. No OAuth/SSO needed for self-hosted single-user use.
