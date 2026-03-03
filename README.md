# Registry Dashboard

A modern, self-hosted web dashboard for browsing and managing Docker container images across multiple registries. Supports Docker Hub, GHCR, Harbor, ECR, and vanilla Docker Registry V2.

## Tech Stack

- **Next.js 16** (App Router) + TypeScript 5
- **Tailwind CSS 4** + shadcn/ui
- **TanStack Query v5** (server state) + **Zustand v5** (client state)
- **Zod v4** (validation) + **Lucide React** (icons)
- **Bun** (package manager & runtime)

## Quick Start

```bash
# Install dependencies
bun install

# Copy environment config
cp .env.example .env.local

# Start dev server
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
bun dev              # Dev server on :3000 (Turbopack)
bun run build        # Production build
bun run start        # Start production server
bun run lint         # ESLint
bun run lint:fix     # Auto-fix lint issues
bun run format       # Prettier
bun run typecheck    # tsc --noEmit
bun test             # Unit tests (Vitest)
bun run test:watch   # Unit tests in watch mode
bun run test:e2e     # E2E tests (Playwright)
```

## Docker

### Development (hot-reload, no build step)

```bash
# Copy env and start — source code is mounted, edits reload instantly
cp .env.example .env.local
docker compose -f docker-compose.dev.yml up
```

- UI at `http://localhost:3000`, local registry at `http://localhost:5001`
- Source code is bind-mounted → Next.js hot-reload works inside the container
- Data is persisted to a named Docker volume (`ui-data-dev`)

### Production

```bash
# 1. Generate a strong secret
openssl rand -base64 32

# 2. Create your env file
cp .env.example .env
# Edit .env — set SESSION_SECRET to the value above

# 3. Start the stack (builds the UI image on first run)
docker compose up -d

# View logs
docker compose logs -f ui
```

- UI at `http://localhost:3000` (override with `UI_PORT=8080`)
- Local registry at `http://localhost:5001` (override with `REGISTRY_PORT=5001`)
- Registry configs are persisted in the `ui-data` Docker named volume

#### Data Persistence

Registry connection configs (including credentials) are stored in:

| Context | Path |
|---|---|
| Local dev (`bun dev`) | `./data/registries.json` |
| Docker (any) | `/app/data/registries.json` (inside `ui-data` volume) |

To **back up** your config: `docker cp registry-dashboard-ui:/app/data ./backup`

To **restore**: `docker cp ./backup/data registry-dashboard-ui:/app/data`

#### Reverse Proxy (Nginx example)

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

## Environment Variables

Copy `.env.example` to `.env.local` (dev) or `.env` (Docker) and configure:

| Variable | Description | Required |
|---|---|---|
| `SESSION_SECRET` | Encryption key for credentials — generate with `openssl rand -base64 32` | **Yes** |
| `DATA_DIR` | Path where `registries.json` is stored. Default: `./data` (dev) / `/app/data` (Docker) | No |
| `UI_PORT` | Host port for the UI (Docker only). Default: `3000` | No |
| `REGISTRY_PORT` | Host port for the local registry (Docker only). Default: `5001` | No |
| `DEFAULT_REGISTRY_URL` | Pre-configured registry URL on first run | No |
| `DEFAULT_REGISTRY_NAME` | Display name for default registry | No |
| `DEFAULT_REGISTRY_AUTH_TYPE` | `none` \| `basic` \| `bearer` | No |

## Supported Registries

| Registry | Browse | Search | Delete | Rate Limit |
|---|---|---|---|---|
| Docker Registry V2 | ✅ | — | ✅ | — |
| Docker Hub | ✅ | ✅ | — | ✅ tracked |
| GHCR | planned | — | planned | — |
| ECR | planned | — | planned | — |

## Project Structure

```
src/
├── app/              # Next.js App Router (pages + API routes)
│   └── api/v1/       # BFF proxy — never call registry from browser
├── components/       # UI components (layout, registry, repository, tag, manifest)
├── lib/              # Registry client + providers (GenericProvider, DockerHubProvider)
├── hooks/            # TanStack Query hooks
├── stores/           # Zustand stores (persisted)
└── types/            # TypeScript type definitions
```
