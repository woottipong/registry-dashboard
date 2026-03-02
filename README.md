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

## Docker (Development)

```bash
# Start local registry on :5000
docker compose up -d registry

# Start both registry + UI
docker compose up -d
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

| Variable | Description | Required |
|---|---|---|
| `SESSION_SECRET` | Encryption key for credentials (min 16 chars) | Yes |
| `DEFAULT_REGISTRY_URL` | Pre-configured registry URL | No |
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
