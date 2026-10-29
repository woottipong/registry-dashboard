# Registry Dashboard

Self-hosted web dashboard for browsing and managing container images across Docker Registry V2 compatible registries and Docker Hub.

## Capabilities

- **Multi-Registry**: Manage multiple Docker Registry V2 endpoints and Docker Hub in one place.
- **Repository & Tag Explorer**: Browse namespaces, repositories, tags, manifest details, digest hashes, and layer sizes.
- **Command Palette & Global Search**: Fast repository search and keyboard-driven navigation (`⌘K` / `Ctrl+K`).
- **Activity Telemetry**: Recent pull commands, event logging, and distribution statistics across registries.
- **Secure BFF Architecture**: All registry API traffic flows through a server-side proxy (`/api/v1/*`), keeping credentials, tokens, and upstream URLs off the browser.
- **At-Rest Encryption**: Credentials encrypted at rest using AES-256 via `SESSION_SECRET`.
- **Destructive Operation Safeguards**: Tag deletion protected by session authentication, CSRF checks, and rate limiting.

## Supported Registries

| Registry | Browse | Search | Delete | Rate Limit Tracking | Status |
|---|---|---|---|---|---|
| Docker Registry V2 | Yes | — | Yes | — | Implemented |
| Docker Hub | Yes | Yes | — | Yes (PAT supported) | Implemented |
| GitHub Container Registry (GHCR) | Planned | — | Planned | — | Planned |
| AWS ECR | Planned | — | Planned | — | Planned |
| Harbor | Planned | — | Planned | — | Planned |

## Quick Start (Development)

Run the local dev stack with hot-reload and a local test registry:

```bash
# 1. Setup local environment
cp .env.example .env.local

# 2. Start dev containers
docker compose -f docker-compose.dev.yml up -d
```

- **Dashboard UI**: `http://localhost:9002` (default credentials: `admin` / `admin123`)
- **Local Test Registry**: `http://localhost:9001`
- Source code is bind-mounted; edits reload instantly. Dependencies live inside the `node_modules_dev` Docker volume.

## Development Commands

All commands run inside the dev container (`registry-dashboard-ui-dev`):

```bash
# Typecheck
docker compose -f docker-compose.dev.yml exec ui bun run typecheck

# Lint & Fix
docker compose -f docker-compose.dev.yml exec ui bun run lint
docker compose -f docker-compose.dev.yml exec ui bun run lint:fix

# Unit & E2E Tests
docker compose -f docker-compose.dev.yml exec ui bun run test
docker compose -f docker-compose.dev.yml exec ui bun run test:coverage
docker compose -f docker-compose.dev.yml exec ui bun run test:e2e
```

## Production Deployment

```bash
# 1. Generate a strong encryption secret
SESSION_SECRET=$(openssl rand -base64 32)

# 2. Create production environment
cp .env.example .env
# Set SESSION_SECRET and a strong APP_PASSWORD (min 8 characters) in .env

# 3. Start production container
docker compose up -d
```

- Production UI runs on `http://localhost:3000` (configurable via `UI_PORT`).
- Connection configs and encrypted credentials persist in the `ui-data` Docker volume.

### Backup & Restore

```bash
# Backup configuration data
docker cp registry-dashboard-ui:/app/data ./backup

# Restore configuration data
docker cp ./backup registry-dashboard-ui:/app/data
```

### Reverse Proxy (Nginx)

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

| Variable | Description | Required | Default |
|---|---|---|---|
| `SESSION_SECRET` | 32+ character key for session cookies and credential encryption | **Yes** | — |
| `APP_USERNAME` | Login username | No | `admin` |
| `APP_PASSWORD` | Login password (min 8 chars in production) | **Yes** (Prod) | `admin123` (Dev) |
| `UI_PORT` | Host port for the web dashboard | No | `9002` (Dev) / `3000` (Prod) |
| `REGISTRY_PORT` | Host port for the dev test registry | No | `9001` (Dev only) |
| `DATA_DIR` | Directory storing `registries.json` | No | `/app/data` |
| `DEFAULT_REGISTRY_URL` | Pre-configured registry URL on initial boot | No | — |
| `DEFAULT_REGISTRY_NAME` | Display name for default registry | No | — |
| `DEFAULT_REGISTRY_AUTH_TYPE` | `none` \| `basic` \| `bearer` | No | `none` |
| `DEFAULT_REGISTRY_USERNAME` | Username for default registry basic auth | No | — |
| `DEFAULT_REGISTRY_PASSWORD` | Password for default registry basic auth | No | — |
| `NEXT_PUBLIC_APP_NAME` | Application display name | No | `Registry Dashboard` |
| `NEXT_PUBLIC_APP_URL` | Public application URL | No | `http://localhost:3000` |

## Documentation

- [`AGENTS.md`](./AGENTS.md) — Architecture, BFF route contracts, provider specifications, coding standards, and verification guidelines.
- [`PRODUCT.md`](./PRODUCT.md) — Brand commitments, dark-only palette, and UX principles.
- [`GLOSSARY.md`](./GLOSSARY.md) — Canonical domain vocabulary and terminology rules.
- [`doc/DESIGN.md`](./doc/DESIGN.md) — Design system specifications, Carbon Dark tokens, and component guidelines.
- [`docs/adr/`](./docs/adr/) — Architecture Decision Records, including [ADR-0001: Carbon Dark Operations Redesign](./docs/adr/0001-carbon-dark-operations-redesign.md).
- [`docs/agents/`](./docs/agents/) — Contributor workflows for issue tracking, domain modeling, and triage labels.
