# AGENTS.md

Agent guide for `registry_ui`.

This is the canonical workspace instructions file for the repository. Keep it concise, and link to the source documents instead of duplicating long guidance.

## Read First

1. Read `CLAUDE.md` once at the start of a new task.
2. Use `CONTRIBUTING.md` for contributor workflow and commands.
3. Use `README.md` for runtime, Docker, and environment setup.
4. Follow existing project structure and naming before introducing anything new.

`CLAUDE.md` remains the main source of truth for architecture, routes, and UI/data conventions. This file adds repo-specific execution rules for coding agents.

## Documentation Map

- `CLAUDE.md` — architecture, route shapes, provider model, URL patterns, and coding conventions.
- `CONTRIBUTING.md` — local setup, test commands, and contributor workflow.
- `README.md` — product overview, Docker usage, and deployment/runtime notes.
- `.breakdown/STATUS.md` — current milestone and backlog status when task scope touches ongoing project planning.

## Core Rules

- Implement, do not just suggest, unless the user asks for planning only.
- Read files before editing them.
- Keep changes tightly scoped to the request.
- Do not revert unrelated user changes.
- Prefer updating existing files over creating new ones.
- Never call registry APIs directly from the browser. All registry traffic must stay behind `/api/v1/*`.

## When To Open An Issue

Open an issue when the work should be tracked outside the current chat.

Open one for:
- Bugs or risks you are not fixing in this turn.
- Features that need requirements, acceptance criteria, or follow-up discussion.
- Review findings that should become backlog items.
- Security hardening tasks that may span multiple PRs.

Do not open one for:
- Small fixes you are implementing immediately.
- Temporary exploration or brainstorming.
- Tiny refactors that will be fully handled in the current PR.

Simple rule:
- `fix now` -> usually no issue required
- `fix later` or `must not forget` -> open an issue

Create issue markdown in `issues/` first, then open the GitHub issue from that file when asked.

## Branch And PR Workflow

- Branch from `main`.
- Use focused branch names:
  - `fix/...`
  - `feat/...`
  - `chore/...`
- Keep one logical change per PR.
- If a PR addresses an issue, include `Fixes #<number>` in the PR body.
- Before pushing, make sure unrelated untracked files are not accidentally included.

## Review Workflow

When asked to review code:
- Prioritize bugs, regressions, security risks, and missing tests.
- Give findings first, ordered by severity.
- Include file references and concrete reasoning.
- Do not pad the response with performative agreement.

When acting on review feedback:
- Verify the feedback against the codebase before changing anything.
- Push back when the feedback is incorrect for this repo.
- Test each fix before claiming it is done.

## Verification Before Done

All verification must run **inside the Docker dev container**, not on the host machine.
The `ui` service container name is `registry-dashboard-ui-dev`.

Default verification for code changes:

```bash
docker compose -f docker-compose.dev.yml exec ui bun run typecheck
docker compose -f docker-compose.dev.yml exec ui bun run lint
docker compose -f docker-compose.dev.yml exec ui bun run test
```

If the container is not running, start it first:

```bash
docker compose -f docker-compose.dev.yml up -d
```

If only one focused area changed, you may also run a narrower test first, but do not claim completion without appropriate verification.

Report clearly if:
- only warnings remain
- some checks could not be run
- a failure is pre-existing

## Security Guardrails

This repo has several sensitive areas. Be conservative when touching them.

### Authentication and Sessions

- Session auth is enforced in `src/middleware.ts`.
- API routes must return JSON errors for API auth failures, not HTML redirects.
- State-changing API routes must preserve CSRF protections.

### Registry URL Safety

- Treat registry URLs as untrusted input.
- Do not allow loopback, link-local, or private-network targets unless the user explicitly changes that policy.
- If changing host allow/block behavior, leave a comment explaining the decision.

### Rate Limiting

- Login and destructive endpoints must remain rate-limited.
- Scope rate-limit keys to the real operation. Do not accidentally merge unrelated actions into one bucket.

### Error Disclosure

- Client-facing API errors should be generic.
- Log sensitive/internal details server-side only.
- Do not expose internal hostnames, IPs, or upstream topology in API responses.

### Provider Integrations

- Validate external API payloads at runtime with Zod where practical.
- Preserve provider capability checks before delete/search operations.
- For Docker Hub, remember Hub API and Registry API are different systems.

## Persistence Rules

- Registry and activity storage are file-backed.
- Be careful with read-modify-write flows.
- Avoid changes that make concurrent write behavior worse.
- Prefer atomic write patterns and safe fallback behavior.

## Frontend Rules

- Use TanStack Query for server state, not ad hoc `useEffect` fetching.
- Keep URL patterns consistent with `CLAUDE.md`.
- Preserve namespace-first loading behavior.
- Do not change route shapes casually.

## Creating Features

For small features:
- implement directly on a feature branch
- add tests if logic changes

For larger features:
1. open or confirm an issue
2. define the smallest shippable scope
3. implement in one focused PR

## Commands

All commands run inside the Docker dev container via `docker compose exec`.

```bash
# Start the dev stack
docker compose -f docker-compose.dev.yml up -d

# Run commands inside the ui container
docker compose -f docker-compose.dev.yml exec ui bun run typecheck
docker compose -f docker-compose.dev.yml exec ui bun run lint
docker compose -f docker-compose.dev.yml exec ui bun run lint:fix
docker compose -f docker-compose.dev.yml exec ui bun run test
docker compose -f docker-compose.dev.yml exec ui bun run test:watch

# Install a new package (writes to node_modules volume inside Docker)
docker compose -f docker-compose.dev.yml exec ui bun add <package>
docker compose -f docker-compose.dev.yml exec ui bun add -d <package>
```

Do **not** run `bun install`, `bun run lint`, or `bun run test` directly on the host.
The `node_modules` volume lives inside Docker — the host has no `node_modules` directory.

## Final Check

Before handing work back:
- confirm what changed
- confirm what was verified
- mention any remaining warnings, risks, or follow-ups
