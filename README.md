# Registry dashboard

Self-hosted web dashboard for browsing and managing container images across Docker Registry V2 compatible registries and Docker Hub.

## Overview

Registry dashboard connects to private or public Docker registries through a secure Backend-for-Frontend (BFF) proxy. It provides repository navigation, tag inspection, digest verification, and layer size breakdowns while keeping registry credentials server-side.

- **Multi-registry support**: Manage multiple Docker Registry V2 endpoints and Docker Hub in one dashboard.
- **Namespace-first browsing**: Browse repositories grouped by namespace, with support for root-level images.
- **Tag and manifest inspection**: View image tags, digest hashes, layer sizes, architecture details, and pull commands.
- **Global search and command palette**: Keyboard navigation and quick search via `⌘K` or `Ctrl+K`.
- **Activity telemetry**: Track recent manifest inspects, pull commands, and registry distribution statistics.
- **Atomic file persistence**: Registry configurations and activity logs persist safely on disk with atomic writes and automatic backup recovery.
- **Security controls**: Encrypted credentials at rest (AES-256), session authentication, CSRF validation, and rate-limited destructive operations.

## Tech stack

- **Framework**: Next.js 16 (App Router) with React 19 and TypeScript in strict mode
- **Styling**: Tailwind CSS v4 with Carbon Dark color system and Radix UI primitives
- **State management**: TanStack Query v5 for server state and caching, Zustand v5 for client UI state
- **Session management**: iron-session with encrypted HTTP-only session cookies
- **Runtime and package manager**: Bun inside Linux container environments
- **Testing**: Vitest with Testing Library for unit and integration tests, Playwright for end-to-end tests

## Architecture

### Backend-for-Frontend proxy pattern

The browser communicates exclusively with `/api/v1/*` Next.js route handlers. It never queries Docker Registry or Docker Hub APIs directly.

```text
Browser -> Next.js API (/api/v1/*) -> Registry provider -> Docker Registry / Hub APIs
```

Benefits:
- Registry tokens, passwords, and private network URLs remain server-side.
- Eliminates browser Cross-Origin Resource Sharing (CORS) constraints.
- Centralizes rate limiting, CSRF validation, session authentication, and error formatting.

### Provider pattern

Registry adapters live in `src/lib/providers/` and implement the `RegistryProvider` interface:
- `GenericProvider`: Interacts with standard Docker Registry V2 endpoints.
- `DockerHubProvider`: Combines Docker Hub API v2 for search and catalog exploration with Docker Registry V2 for manifest retrieval.
- Both providers share an in-memory catalog cache with automatic 401 token invalidation and refresh logic.

### Atomic file persistence

Data is stored in JSON files under `DATA_DIR` (`/app/data` by default) using `AtomicJsonStore<T>` (`src/lib/atomic-file-store.ts`):
- Writes write to a temporary file with a unique UUID (`.tmp.<uuid>`) and sync to disk before an atomic POSIX rename replaces the target file.
- Automatic `.bak` snapshot backups allow self-healing recovery if the primary JSON file becomes corrupted.

## Supported registries

| Registry | Browse | Search | Delete tags | Rate limit tracking | Status |
|---|---|---|---|---|---|
| Docker Registry V2 | Yes | Not supported | Yes | Not supported | Implemented |
| Docker Hub | Yes | Yes | Not supported | Yes (PAT supported) | Implemented |
| GitHub Container Registry (GHCR) | Planned | Not supported | Planned | Not supported | Planned |
| AWS ECR | Planned | Not supported | Planned | Not supported | Planned |
| Harbor | Planned | Not supported | Planned | Not supported | Planned |

## Quick start for development

Run the development stack with hot reloading and an isolated local Docker registry:

```bash
# 1. Create development environment file
cp .env.example .env.local

# 2. Start containers
docker compose -f docker-compose.dev.yml up -d
```

Access points:
- **Dashboard UI**: `http://localhost:9002` (default credentials: `admin` / `admin123`)
- **Local test registry**: `http://localhost:9001`

Dependencies and build caches live inside Docker volumes (`node_modules_dev`, `next_cache_dev`). Do not run `bun install` or tests on the host machine.

## Development commands

Execute all commands inside the running UI container (`registry-dashboard-ui-dev`):

```bash
# Typecheck
docker compose -f docker-compose.dev.yml exec ui bun run typecheck

# Linting
docker compose -f docker-compose.dev.yml exec ui bun run lint
docker compose -f docker-compose.dev.yml exec ui bun run lint:fix

# Tests
docker compose -f docker-compose.dev.yml exec ui bun run test
docker compose -f docker-compose.dev.yml exec ui bun run test:coverage
docker compose -f docker-compose.dev.yml exec ui bun run test:e2e
```

## Production deployment

```bash
# 1. Generate a strong encryption secret
SESSION_SECRET=$(openssl rand -base64 32)

# 2. Configure production environment
cp .env.example .env
# Set SESSION_SECRET and a secure APP_PASSWORD (minimum 8 characters) in .env

# 3. Start the production service
docker compose up -d
```

The production interface runs on `http://localhost:3000` (configurable via `UI_PORT`). Persistent configs and encrypted credentials remain in the `ui-data` Docker volume.

### Backup and restore

```bash
# Backup persistent data
docker cp registry-dashboard-ui:/app/data ./backup

# Restore persistent data
docker cp ./backup registry-dashboard-ui:/app/data
```

### Reverse proxy example

```nginx
server {
    listen 80;
    server_name registry.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## API route reference

All application API endpoints return a standardized `ApiResponse<T>` JSON envelope:

```ts
// Success
{ success: true, data: T, error: null }

// Error
{ success: false, data: null, error: { code: string, message: string, details?: unknown } }
```

### Authentication and health

- `POST /api/auth/login`: Authenticate user session
- `POST /api/auth/logout`: Invalidate session cookie
- `GET /api/auth/me`: Get current session details
- `GET /api/health`: Service health check

### Registries

- `GET /api/v1/registries`: List configured registries
- `POST /api/v1/registries`: Add a new registry
- `GET /api/v1/registries/[id]`: Get registry configuration
- `PUT /api/v1/registries/[id]`: Update registry configuration
- `DELETE /api/v1/registries/[id]`: Delete registry configuration
- `POST /api/v1/registries/[id]/ping`: Test connection and credentials

### Catalog and images

- `GET /api/v1/registries/[id]/namespaces`: List available namespaces
- `GET /api/v1/registries/[id]/repositories`: List repositories for a namespace
- `GET /api/v1/registries/[id]/repositories/[...name]`: Get repository metadata or tag list
- `DELETE /api/v1/registries/[id]/repositories/[...name]`: Delete repository
- `GET /api/v1/registries/[id]/tags/[...name]`: List tags for a repository
- `GET /api/v1/registries/[id]/manifests/[...path]`: Retrieve image manifest
- `DELETE /api/v1/registries/[id]/manifests/[...path]`: Delete tag or manifest
- `GET /api/v1/registries/[id]/blobs/[...path]`: Proxy image layer blob

### Telemetry

- `GET /api/v1/activities`: List recent dashboard activities

## Environment variables

| Variable | Description | Required | Default |
|---|---|---|---|
| `SESSION_SECRET` | Secret key (minimum 32 characters) for cookies and AES-256 credential encryption | Yes | None |
| `APP_USERNAME` | Login username | No | `admin` |
| `APP_PASSWORD` | Login password (minimum 8 characters in production) | Yes (Production) | `admin123` (Development) |
| `UI_PORT` | Host port for the dashboard | No | `9002` (Dev) / `3000` (Prod) |
| `REGISTRY_PORT` | Host port for local test registry | No | `9001` (Dev only) |
| `DATA_DIR` | Directory storing JSON database files | No | `/app/data` |
| `DEFAULT_REGISTRY_URL` | Pre-configured registry URL on initial boot | No | None |
| `DEFAULT_REGISTRY_NAME` | Display name for default registry | No | None |
| `DEFAULT_REGISTRY_AUTH_TYPE` | Default registry auth type (`none`, `basic`, `bearer`) | No | `none` |
| `DEFAULT_REGISTRY_USERNAME` | Username for default registry basic auth | No | None |
| `DEFAULT_REGISTRY_PASSWORD` | Password for default registry basic auth | No | None |
| `NEXT_PUBLIC_APP_NAME` | Application display name in UI header | No | `Registry Dashboard` |
| `NEXT_PUBLIC_APP_URL` | Public application URL | No | `http://localhost:3000` |

## Project documentation

- [`AGENTS.md`](./AGENTS.md): Architecture contracts, coding standards, and verification guidelines
- [`PRODUCT.md`](./PRODUCT.md): UI styling, brand commitments, and UX principles
- [`GLOSSARY.md`](./GLOSSARY.md): Domain vocabulary and terminology rules
- [`doc/DESIGN.md`](./doc/DESIGN.md): Design tokens, Carbon Dark layout dimensions, and component rules
- [`docs/adr/`](./docs/adr/): Architecture Decision Records
- [`docs/agents/`](./docs/agents/): Local issue tracking and contributor workflows
