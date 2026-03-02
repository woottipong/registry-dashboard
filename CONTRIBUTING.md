# Contributing to Registry Dashboard

## Development Setup

```bash
# Install dependencies
bun install

# Copy environment config
cp .env.example .env.local

# Start local registry for testing
docker compose up -d registry

# Start dev server
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Code Style

- **Language**: TypeScript strict mode. No `any` — use `unknown` and narrow with Zod or type guards.
- **Naming**: `camelCase` for variables/functions, `PascalCase` for components/types, `kebab-case` for files.
- **Exports**: Named exports only. Default exports only for Next.js pages/layouts.
- **Imports**: Use `@/` alias for `src/`. Group: external → internal → relative.
- **Styling**: Tailwind CSS utility classes only. Use `cn()` for conditionals. No inline styles.

Run formatting before committing:

```bash
bun run lint:fix
bun run format
bun run typecheck
```

## Architecture

All registry API calls go through Next.js BFF routes (`/api/v1/`). **Never call Docker Registry V2 directly from the browser** — CORS will block it and credentials would be exposed.

```
Browser → /api/v1/* (Next.js) → Docker Registry V2 API
```

## Testing

### Unit Tests (Vitest)

```bash
bun test             # Run all unit tests
bun run test:watch   # Watch mode
bun run test:coverage
```

Place test files next to source: `src/lib/__tests__/format.test.ts`

Guidelines:
- Test utility functions with edge cases (empty input, boundary values, error cases)
- Mock `global.fetch` for registry client tests
- Use `renderHook` from `@testing-library/react` for store tests

### E2E Tests (Playwright)

```bash
bun run test:e2e
```

Requires the dev server running (handled automatically). Uses the local registry from `docker compose`.

E2E tests live in `e2e/`. Cover critical flows: add registry → browse repos → inspect image → delete tag.

## Pull Request Process

1. Branch from `main`: `git checkout -b feat/my-feature`
2. Make changes following the code style guide above
3. Add/update tests for any new logic
4. Run `bun run typecheck && bun test` — ensure both pass
5. Open PR with a clear description of what changed and why

## Adding a New Registry Provider

1. Create `src/lib/providers/my-provider.ts` implementing `RegistryProvider`
2. Add auto-detection logic in `src/lib/providers/index.ts`
3. Update `RegistryProviderType` in `src/types/registry.ts`
4. Add a preset button in the registry form
5. Write tests in `src/lib/providers/__tests__/my-provider.test.ts`
