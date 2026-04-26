# Registry Dashboard

A modern, self-hosted web dashboard for browsing and managing Docker container images across multiple registries. Currently implements Docker Hub and generic Docker Registry V2 flows, with additional providers planned.

## ✨ Features

- **🎨 Modern UI**: Beautiful, responsive interface with smooth animations and hover effects
- **🔍 Advanced Search**: Real-time search with keyboard shortcuts and search hints
- **📊 Interactive Dashboard**: Live statistics and registry status monitoring
- **🌙 Dark/Light Theme**: Automatic theme support with CSS custom properties
- **📱 Mobile Responsive**: Optimized for desktop and mobile devices
- **⚡ Fast & Lightweight**: Built with Next.js 16 and optimized for performance
- **🔒 Secure**: Encrypted credential storage and secure API design
- **🛡️ Hardened BFF**: Registry access stays behind server-side routes with session auth, CSRF checks, rate limiting, and runtime response validation

## Tech Stack

- **Next.js 16** (App Router) + TypeScript 5
- **Tailwind CSS 4** + shadcn/ui
- **TanStack Query v5** (server state) + **Zustand v5** (client state)
- **Zod v4** (validation) + **Lucide React** (icons)
- **Bun** (package manager & runtime)

## Quick Start

```bash
# Copy environment config, then edit secrets locally
cp .env.example .env.local

# Start the Docker dev stack
docker compose -f docker-compose.dev.yml up -d
```

Open the UI using the `UI_PORT` value from your env. The default Docker dev compose port is `9002`.

## Commands

Run project commands inside the Docker dev container. See [AGENTS.md](./AGENTS.md) for the canonical workflow.

```bash
docker compose -f docker-compose.dev.yml exec ui bun run typecheck
docker compose -f docker-compose.dev.yml exec ui bun run lint
docker compose -f docker-compose.dev.yml exec ui bun run test
docker compose -f docker-compose.dev.yml exec ui bun run test:coverage
docker compose -f docker-compose.dev.yml exec ui bun run test:e2e
```

## Development

### Testing

```bash
# Unit tests
docker compose -f docker-compose.dev.yml exec ui bun run test
docker compose -f docker-compose.dev.yml exec ui bun run test:watch
docker compose -f docker-compose.dev.yml exec ui bun run test:coverage

# E2E tests
docker compose -f docker-compose.dev.yml exec ui bun run test:e2e

# Linting
docker compose -f docker-compose.dev.yml exec ui bun run lint
docker compose -f docker-compose.dev.yml exec ui bun run lint:fix
```

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and ensure tests pass
4. Run linting: `docker compose -f docker-compose.dev.yml exec ui bun run lint:fix`
5. Run type checks: `docker compose -f docker-compose.dev.yml exec ui bun run typecheck`
6. Commit your changes: `git commit -m 'Add some feature'`
7. Push to the branch: `git push origin feature/your-feature`
8. Submit a pull request

### Architecture Notes

- **API Design**: BFF (Backend for Frontend) pattern - browser never calls registry APIs directly
- **State Management**: Server state with TanStack Query, client state with Zustand
- **Security**: Credentials encrypted at rest, secure API routes with validation, internal-target registry URL blocking, and generic client-facing errors
- **Performance**: Optimized with React Server Components, streaming, and caching

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

## Security Notes

- Registry connections are validated before being saved and reject loopback, link-local, and private-network targets by default.
- Registry credentials are stored encrypted at rest in `DATA_DIR`.
- All registry traffic flows through Next.js API routes rather than the browser.
- Destructive operations are protected by session auth, CSRF checks, and delete rate limiting.
- External provider payloads are runtime-validated before being trusted by the app.

## Supported Registries

| Registry | Browse | Search | Delete | Rate Limit | Status |
|---|---|---|---|---|---|
| Docker Registry V2 | ✅ | — | ✅ | — | **Implemented** |
| Docker Hub | ✅ | ✅ | — | ✅ tracked | **Implemented** <br/>*Personal Access Tokens supported* |
| GHCR | planned | — | planned | — | *Planned* |
| ECR | planned | — | planned | — | *Planned* |
| Harbor | planned | — | planned | — | *Planned* |

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

## Repo Guidance

- [AGENTS.md](./AGENTS.md): canonical project guide for architecture, route shapes, implementation conventions, agent workflow, verification, and security guardrails
