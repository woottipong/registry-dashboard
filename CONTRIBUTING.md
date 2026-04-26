# Contributing to Registry Dashboard

Read [AGENTS.md](./AGENTS.md) first. It is the canonical guide for architecture, route shapes, commands, verification, and security guardrails.

## Development Setup

```bash
# Copy environment config, then edit secrets locally
cp .env.example .env.local

# Start the Docker dev stack
docker compose -f docker-compose.dev.yml up -d
```

Open the UI using the `UI_PORT` value from your env. The default Docker dev compose port is `9002`.

## Code Style

- **Language**: TypeScript strict mode. No `any` — use `unknown` and narrow with Zod or type guards.
- **Naming**: `camelCase` for variables/functions, `PascalCase` for components/types, `kebab-case` for files.
- **Exports**: Named exports only. Default exports only for Next.js pages/layouts.
- **Imports**: Use `@/` alias for `src/`. Group: external → internal → relative.
- **Styling**: Tailwind CSS utility classes only. Use `cn()` for conditionals. No inline styles.

Run formatting before committing:

```bash
docker compose -f docker-compose.dev.yml exec ui bun run lint:fix
docker compose -f docker-compose.dev.yml exec ui bun run typecheck
```

## Architecture

All registry API calls go through Next.js BFF routes (`/api/v1/`). **Never call Docker Registry V2 directly from the browser** — CORS will block it and credentials would be exposed.

```
Browser → /api/v1/* (Next.js) → Docker Registry V2 API
```

## Testing

### Unit Tests (Vitest)

```bash
docker compose -f docker-compose.dev.yml exec ui bun run test
docker compose -f docker-compose.dev.yml exec ui bun run test:watch
docker compose -f docker-compose.dev.yml exec ui bun run test:coverage
```

Place test files next to source: `src/lib/__tests__/format.test.ts`

Guidelines:
- Test utility functions with edge cases (empty input, boundary values, error cases)
- Mock `global.fetch` for registry client tests
- Use `renderHook` from `@testing-library/react` for store tests

### E2E Tests (Playwright)

```bash
docker compose -f docker-compose.dev.yml exec ui bun run test:e2e
```

Requires the dev server running (handled automatically). Uses the local registry from `docker compose`.

E2E tests live in `e2e/`. Cover critical flows: add registry → browse repos → inspect image → delete tag.

## Pull Request Process

1. Branch from `main`: `git checkout -b feat/my-feature`
2. Make changes following the code style guide above
3. Add/update tests for any new logic
4. Run the required Docker verification from `AGENTS.md` — ensure typecheck, lint, and tests pass
5. Open PR with a clear description of what changed and why

## Adding a New Registry Provider

1. Create `src/lib/providers/my-provider.ts` implementing `RegistryProvider`
2. Add auto-detection logic in `src/lib/providers/index.ts`
3. Update `RegistryProviderType` in `src/types/registry.ts`
4. Add a preset button in the registry form
5. Write tests in `src/lib/providers/__tests__/my-provider.test.ts`
