# Registry Dashboard — Project Instructions

## Project Overview

Registry Dashboard is a modern, self-hosted web dashboard for browsing and managing Docker container images stored in Docker Registry V2 compatible registries. It supports multiple registries simultaneously, including Docker Hub, GHCR, Harbor, ECR, and vanilla Registry V2.

**Full specification**: See `spec.md` for detailed features, data models, and API design.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router) with TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Data Fetching**: TanStack Query v5
- **Tables**: TanStack Table v8
- **State**: Zustand v5 (client-side, persisted)
- **Validation**: Zod v3
- **Icons**: Lucide React
- **Charts**: Recharts
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

- `GenericProvider` — vanilla Docker Registry V2
- `DockerHubProvider` — uses Hub API for catalog/search, Registry API for manifests
- Future: `GhcrProvider`, `EcrProvider`, etc.

Always check `provider.capabilities()` before calling operations like `deleteManifest()`.

---

## Project Structure

```
src/
├── app/                    # Next.js App Router (pages + API routes)
│   ├── api/v1/             # BFF API proxy routes
│   ├── registries/         # Registry management pages
│   ├── repos/              # Repository browser + tag explorer + image inspector
│   └── settings/           # App settings
├── components/
│   ├── ui/                 # shadcn/ui base components
│   ├── layout/             # Sidebar, topbar, breadcrumbs, command palette
│   ├── registry/           # Registry-specific components
│   ├── repository/         # Repository cards, grids, tables
│   ├── tag/                # Tag table, actions
│   ├── manifest/           # Manifest viewer, layer list, config inspector
│   └── dashboard/          # Stats cards, charts
├── lib/                    # Core logic (registry client, auth, utils)
├── hooks/                  # TanStack Query hooks
├── stores/                 # Zustand stores (persisted)
└── types/                  # TypeScript type definitions
```

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

```tsx
// ✅ Good
interface RegistryCardProps {
  registry: RegistryConnection;
  onSelect: (id: string) => void;
}

export function RegistryCard({ registry, onSelect }: RegistryCardProps) {
  // ...
}
```

### Data Fetching

- Use TanStack Query for all server state. Define query hooks in `hooks/`.
- Query key convention: `[entity, ...params]` — e.g., `["repositories", registryId]`, `["tags", registryId, repoName]`.
- Set `staleTime: 5 * 60 * 1000` (5 minutes) for registry data.
- Never fetch registry data in `useEffect`. Always use query hooks.

```tsx
// ✅ Good — hooks/use-repositories.ts
export function useRepositories(registryId: string) {
  return useQuery({
    queryKey: ["repositories", registryId],
    queryFn: () => fetchRepositories(registryId),
    staleTime: 5 * 60 * 1000,
  });
}
```

### API Routes

- All API routes go under `app/api/v1/`.
- Use Zod to validate request params and body.
- Return consistent response shape: `{ success, data?, error?, meta? }`.
- Handle registry auth server-side. Never leak credentials to the client.
- Add proper error handling with meaningful error codes.

```tsx
// ✅ Good — consistent error handling
export async function GET(req: NextRequest) {
  try {
    const data = await registryClient.listRepositories(registryId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: "REGISTRY_ERROR", message: error.message } },
      { status: 502 }
    );
  }
}
```

### State Management

- **Server state**: TanStack Query (registries, repos, tags, manifests).
- **Client state**: Zustand with `persist` middleware (registry connections, UI preferences, theme).
- Keep stores minimal. Avoid duplicating server state in Zustand.

### Styling

- Use Tailwind CSS utility classes directly.
- Dark mode first. Use `dark:` variant for light mode overrides only when needed.
- Design tokens (colors, spacing) defined in `tailwind.config.ts`.
- No inline styles. No CSS modules. No styled-components.
- Use `cn()` utility (from `lib/utils.ts`) for conditional class names.

### Error Handling

- Fail fast at API boundary. Validate all inputs with Zod.
- Use error boundaries for React component errors.
- Show user-friendly error messages. Log technical details to console.
- Handle registry-specific errors: 401 (auth failed), 404 (not found), 429 (rate limited).

---

## Docker Hub Specifics

Docker Hub uses **two separate APIs**:

1. **Registry API** (`registry-1.docker.io`) — manifests, tags, blobs
2. **Hub API** (`hub.docker.com/v2/`) — catalog, search, repo metadata

Key differences:
- `/v2/_catalog` is **disabled** on Docker Hub → use Hub API instead
- Tag deletion is **not supported** via API
- Bearer token exchange is **mandatory** (via `auth.docker.io/token`)
- Rate limits apply: 100/6hr anonymous, 200 authenticated
- Official images use the `library/` namespace prefix

Always check `provider === "dockerhub"` before assuming standard Registry V2 behavior.

---

## Testing

### Unit Tests (Vitest)

- Place test files next to source: `lib/format.test.ts` or `lib/__tests__/format.test.ts`.
- Test registry client with mocked HTTP responses.
- Test Zustand stores independently.
- Test utility functions (formatters, parsers) with edge cases.

### E2E Tests (Playwright)

- Place in `e2e/` directory.
- Use the local Docker registry from `docker-compose.yml` as test target.
- Test critical flows: add registry → browse repos → inspect image → delete tag.

---

## Environment Variables

Required variables are documented in `.env.example`. Key ones:

```bash
DEFAULT_REGISTRY_URL        # Pre-configured registry URL (optional)
DEFAULT_REGISTRY_NAME       # Display name for default registry
DEFAULT_REGISTRY_AUTH_TYPE   # "none" | "basic" | "bearer"
SESSION_SECRET              # Encryption key for server-side credential storage
```

Never hardcode registry URLs or credentials. Always read from environment or user input.

---

## Key Design Decisions

1. **No database for MVP** — Registry connections stored in localStorage + encrypted server-side session. Add DB layer (SQLite/Postgres) only if multi-user support is needed.

2. **BFF over direct API calls** — Docker Registry V2 lacks CORS and we must protect credentials. Every registry call goes through Next.js API Routes.

3. **Provider abstraction** — Different registries have different capabilities. The UI adapts based on `ProviderCapabilities` (e.g., hide delete button for Docker Hub).

4. **Dark-first design** — Primary audience is DevOps/developers who prefer dark themes. Light mode is secondary.

5. **Aggressive caching** — Registry data changes infrequently. TanStack Query with 5-minute stale time reduces unnecessary API calls and Docker Hub rate limit consumption.
