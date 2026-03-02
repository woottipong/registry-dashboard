# Registry Dashboard — Tasks

> Broken down from `spec.md`. Tasks are ordered by dependency.
> Each task is atomic and independently testable.

---

## Legend

- `[ ]` — Not started
- `[~]` — In progress
- `[x]` — Done
- `[!]` — Blocked
- **Priority**: P0 (critical path) → P1 (important) → P2 (nice-to-have)
- **Spec ref**: Links to the relevant section in `spec.md`

---

## Milestone 1: Foundation

> Goal: Project boots, layout shell renders, registry client can talk to a real registry.

### 1.1 Project Scaffolding — P0

- [x] **T-001**: Initialize Next.js 15 project with App Router and TypeScript
  - Run `npx -y create-next-app@latest ./` with TypeScript, App Router, Tailwind CSS, ESLint
  - Verify `pnpm dev` starts on `:3000`
  - Files: `package.json`, `tsconfig.json`, `next.config.ts`

- [x] **T-002**: Install and configure core dependencies
  - Install: `@tanstack/react-query`, `@tanstack/react-table`, `zustand`, `zod`, `lucide-react`, `recharts`
  - Configure TanStack Query provider in root layout
  - Files: `package.json`, `src/app/layout.tsx`, `src/lib/query-client.ts`

- [x] **T-003**: Set up shadcn/ui
  - Run `npx shadcn@latest init` with dark theme defaults
  - Install base components: `button`, `input`, `card`, `dialog`, `toast`, `dropdown-menu`, `table`, `badge`, `skeleton`, `separator`, `sheet`, `command`, `tooltip`, `tabs`
  - Files: `components.json`, `src/components/ui/*`

- [x] **T-004**: Configure ESLint + Prettier
  - Add Prettier config (`.prettierrc`)
  - Add lint/format scripts to `package.json`
  - Files: `.eslintrc.json`, `.prettierrc`, `package.json`

- [x] **T-005**: Create `.env.example` and environment config
  - Define all env vars from spec §11
  - Create `src/lib/config.ts` — typed env reader with Zod validation
  - Files: `.env.example`, `.env.local`, `src/lib/config.ts`

### 1.2 Design System — P0

- [x] **T-006**: Configure Tailwind design tokens
  - Colors: primary (#3B82F6), accent (#06B6D4), background dark (#0F172A)
  - Typography: Inter (UI) + JetBrains Mono (monospace/code)
  - Border radius: 8px cards, 6px inputs, 12px modals
  - Dark mode as default class strategy
  - Spec ref: §8 Visual Identity
  - Files: `tailwind.config.ts`, `src/app/globals.css`

- [x] **T-007**: Create `cn()` utility and shared helpers
  - `cn()` — class merge utility (clsx + tailwind-merge)
  - `formatBytes()` — human-readable file sizes (B, KB, MB, GB)
  - `formatDate()` — relative time ("2 hours ago") + absolute
  - `truncateDigest()` — `sha256:abc123...` → `sha256:abc1...`
  - `generatePullCommand()` — `docker pull registry/repo:tag`
  - Files: `src/lib/utils.ts`, `src/lib/format.ts`

### 1.3 Layout Shell — P0

- [x] **T-008**: Create root layout with providers
  - TanStack QueryClientProvider
  - ThemeProvider (dark/light toggle)
  - Toast provider (sonner or shadcn toast)
  - Files: `src/app/layout.tsx`, `src/components/providers.tsx`

- [x] **T-009**: Build sidebar component
  - Collapsible sidebar (desktop: expanded, mobile: sheet overlay)
  - Registry tree: list registries → repos under each
  - "+ Add Registry" button at bottom
  - Active route highlighting
  - Connection status indicator (green/red dot)
  - Spec ref: §8 Layout Structure
  - Files: `src/components/layout/sidebar.tsx`

- [x] **T-010**: Build topbar component
  - Logo / app name (left)
  - Breadcrumb navigation (center)
  - Search trigger button with ⌘K hint (right)
  - Theme toggle (dark/light)
  - Mobile hamburger menu
  - Files: `src/components/layout/topbar.tsx`

- [x] **T-011**: Build breadcrumb component
  - Dynamic breadcrumbs from route segments
  - Pattern: Home → Registry Name → Repo Name → Tag
  - Clickable segments for navigation
  - Files: `src/components/layout/breadcrumbs.tsx`

### 1.4 Type Definitions — P0

- [x] **T-012**: Define TypeScript types
  - `RegistryConnection` — with provider, auth, namespace, rate limit fields
  - `Repository` — with Docker Hub-specific fields (pullCount, starCount, etc.)
  - `Tag` — name, digest, size, architecture, os
  - `ImageManifest` — schema, config, layers
  - `ImageConfig` — architecture, env, cmd, entrypoint, labels, history
  - `ApiResponse<T>` — success, data, error, meta (pagination)
  - `ProviderCapabilities` — canListCatalog, canDelete, canSearch, hasRateLimit
  - Spec ref: §6 Data Models
  - Files: `src/types/registry.ts`, `src/types/manifest.ts`, `src/types/api.ts`

### 1.5 Registry Client Library — P0

- [x] **T-013**: Build base registry HTTP client
  - Generic fetch wrapper with retry, timeout, error handling
  - Auto-attach auth headers (none / basic / bearer)
  - Parse `Www-Authenticate` header for bearer token exchange
  - Track `RateLimit-Remaining` / `RateLimit-Limit` from response headers
  - Spec ref: §3 API Reference
  - Files: `src/lib/registry-client.ts`

- [x] **T-014**: Implement `GenericProvider`
  - `ping()` → `GET /v2/`
  - `listRepositories()` → `GET /v2/_catalog` with `?n=&last=` pagination
  - `listTags()` → `GET /v2/{name}/tags/list`
  - `getManifest()` → `GET /v2/{name}/manifests/{ref}` (Accept headers for v2 + OCI)
  - `getConfig()` → `GET /v2/{name}/blobs/{digest}`
  - `deleteManifest()` → `DELETE /v2/{name}/manifests/{digest}`
  - `capabilities()` → `{ canListCatalog: true, canDelete: true, canSearch: false, ... }`
  - Spec ref: §3, Provider Abstraction
  - Files: `src/lib/providers/generic-provider.ts`

- [x] **T-015**: Implement `DockerHubProvider`
  - `ping()` → `GET https://registry-1.docker.io/v2/` (with token exchange)
  - `listRepositories()` → Hub API: `GET https://hub.docker.com/v2/repositories/{namespace}/`
  - `searchRepositories()` → Hub API: `GET https://hub.docker.com/v2/search/repositories/`
  - `listTags()` → Hub API for metadata + Registry API for digests
  - `getManifest()` → Registry API with bearer token
  - `getConfig()` → Registry API with bearer token
  - `deleteManifest()` → throw `UnsupportedError`
  - `capabilities()` → `{ canListCatalog: false, canDelete: false, canSearch: true, hasRateLimit: true }`
  - Bearer token exchange via `auth.docker.io/token`
  - Hub API auth via `POST hub.docker.com/v2/users/login/`
  - Spec ref: §3 Docker Hub Specifics
  - Files: `src/lib/providers/dockerhub-provider.ts`

- [x] **T-016**: Create provider factory
  - `createProvider(connection: RegistryConnection): RegistryProvider`
  - Auto-detect provider from URL (e.g., `registry-1.docker.io` → DockerHub)
  - Spec ref: Provider Abstraction
  - Files: `src/lib/providers/index.ts`

### 1.6 BFF API Routes — P0

- [x] **T-017**: Registry CRUD API routes
  - `GET /api/v1/registries` → list all saved registries (from encrypted cookie/session)
  - `POST /api/v1/registries` → add a registry (validate with Zod)
  - `PUT /api/v1/registries/:id` → update registry
  - `DELETE /api/v1/registries/:id` → remove registry
  - Consistent `ApiResponse<T>` format
  - Spec ref: §7 API Routes
  - Files: `src/app/api/v1/registries/route.ts`, `src/app/api/v1/registries/[id]/route.ts`

- [x] **T-018**: Registry ping API route
  - `GET /api/v1/registries/:id/ping` → call provider.ping(), return status + latency
  - Files: `src/app/api/v1/registries/[id]/ping/route.ts`

- [x] **T-019**: Repositories API route
  - `GET /api/v1/registries/:id/repositories` → call provider.listRepositories()
  - Support `?page=&perPage=&search=` query params
  - Files: `src/app/api/v1/registries/[id]/repositories/route.ts`

- [x] **T-020**: Tags API route
  - `GET /api/v1/registries/:id/repositories/:name/tags`
  - Handle nested repo names (e.g., `library/nginx` → catch-all route)
  - Files: `src/app/api/v1/registries/[id]/repositories/[...name]/tags/route.ts`

- [x] **T-021**: Manifest + Blob API routes
  - `GET /api/v1/registries/:id/manifests/:name/:ref` → get manifest
  - `HEAD /api/v1/registries/:id/manifests/:name/:ref` → get digest only
  - `DELETE /api/v1/registries/:id/manifests/:name/:ref` → delete (check capabilities first)
  - `GET /api/v1/registries/:id/blobs/:name/:digest` → get config blob
  - Files: `src/app/api/v1/registries/[id]/manifests/[...path]/route.ts`, `.../blobs/[...path]/route.ts`

### 1.7 State Management — P0

- [x] **T-022**: Create Zustand registry store
  - `registries: RegistryConnection[]` — persisted to localStorage
  - Actions: `addRegistry`, `updateRegistry`, `removeRegistry`, `setDefault`
  - `persist` middleware with encrypted storage for credentials
  - Files: `src/stores/registry-store.ts`

- [x] **T-023**: Create Zustand UI store
  - `sidebarOpen: boolean`, `sidebarCollapsed: boolean`
  - `theme: "dark" | "light" | "system"`
  - `repoViewMode: "grid" | "table"`
  - `persist` middleware
  - Files: `src/stores/ui-store.ts`

### 1.8 Development Environment — P1

- [x] **T-024**: Create `docker-compose.yml`
  - `registry` service: `registry:2` on `:5000` with `REGISTRY_STORAGE_DELETE_ENABLED=true`
  - `ui` service: build from Dockerfile on `:3000`
  - Shared volume for registry data
  - Spec ref: §12 Development Setup
  - Files: `docker-compose.yml`

- [x] **T-025**: Create seed script for test images
  - Script to push sample images to local registry (nginx, redis, alpine, etc.)
  - At least 5 repos with multiple tags each
  - Files: `scripts/seed-registry.sh`

---

## Milestone 2: Core Browsing

> Goal: User can add a registry, browse repositories, explore tags, inspect images.

### 2.1 Registry Connection Manager (F1) — P0

- [x] **T-026**: Build registry form component
  - Fields: name, URL, provider (auto-detect or manual), auth type, credentials
  - Docker Hub preset button (pre-fills URL, sets provider + auth type)
  - Zod validation (URL format, required fields)
  - Connection test button (calls ping API)
  - Files: `src/components/registry/registry-form.tsx`

- [x] **T-027**: Build registry card component
  - Display: name, URL, provider icon, status dot (green/red/yellow)
  - Show capabilities badges (can delete, has search, rate limited)
  - Actions: edit, delete, set as default, test connection
  - Rate limit indicator for Docker Hub (progress bar)
  - Files: `src/components/registry/registry-card.tsx`

- [x] **T-028**: Build connection status component
  - Animated status dot: green (connected), red (error), yellow (checking)
  - Latency display (e.g., "45ms")
  - Last checked timestamp
  - Files: `src/components/registry/connection-status.tsx`

- [x] **T-029**: Build registries list page
  - Route: `/registries`
  - List all registries as cards
  - "+ Add Registry" button → navigates to `/registries/new`
  - Empty state with CTA
  - Files: `src/app/registries/page.tsx`

- [x] **T-030**: Build add/edit registry pages
  - Route: `/registries/new` and `/registries/[id]/edit`
  - Uses registry form component
  - On success: redirect to `/registries` with success toast
  - Files: `src/app/registries/new/page.tsx`, `src/app/registries/[id]/edit/page.tsx`

### 2.2 TanStack Query Hooks — P0

- [x] **T-031**: Create registry query hooks
  - `useRegistries()` — list all registries
  - `useRegistry(id)` — single registry
  - `usePingRegistry(id)` — health check (manual trigger)
  - `useAddRegistry()` — mutation
  - `useUpdateRegistry()` — mutation
  - `useDeleteRegistry()` — mutation with confirmation
  - Files: `src/hooks/use-registries.ts`

- [x] **T-032**: Create repository query hooks
  - `useRepositories(registryId, options?)` — list repos with pagination
  - `useSearchRepositories(registryId, query)` — search (Docker Hub)
  - Stale time: 5 minutes
  - Files: `src/hooks/use-repositories.ts`

- [x] **T-033**: Create tag query hooks
  - `useTags(registryId, repoName)` — list tags
  - `useDeleteTag()` — mutation with optimistic update
  - Files: `src/hooks/use-tags.ts`

- [x] **T-034**: Create manifest query hooks
  - `useManifest(registryId, repoName, ref)` — get manifest + config
  - Stale time: 10 minutes (manifests are immutable)
  - Files: `src/hooks/use-manifest.ts`

### 2.3 Repository Browser (F2) — P0

- [x] **T-035**: Build repo card component
  - Display: repo name, tag count, last updated, size estimate
  - Docker Hub extras: pull count, star count, official badge
  - Click → navigate to tag explorer
  - Files: `src/components/repository/repo-card.tsx`

- [x] **T-036**: Build repo grid view
  - Responsive grid: 1 col (mobile), 2 col (tablet), 3-4 col (desktop)
  - Skeleton loading (card-shaped placeholders)
  - Files: `src/components/repository/repo-grid.tsx`

- [x] **T-037**: Build repo table view
  - TanStack Table: columns = name, tags, last updated, size, actions
  - Sortable columns
  - Row click → navigate to tag explorer
  - Files: `src/components/repository/repo-table.tsx`

- [x] **T-038**: Build repository browser page
  - Route: `/repos`
  - Registry filter dropdown (all registries or specific one)
  - Search/filter input
  - Grid/Table view toggle (persisted in UI store)
  - Pagination (load more or page numbers)
  - Empty state
  - Spec ref: F2
  - Files: `src/app/repos/page.tsx`

### 2.4 Tag Explorer (F3) — P0

- [x] **T-039**: Build tag table component
  - TanStack Table with columns: tag name, digest (truncated), size, created, arch/os, actions
  - Sortable by name, size, date
  - Multi-select checkboxes (for batch operations)
  - Digest click → copy to clipboard with toast
  - Files: `src/components/tag/tag-table.tsx`

- [x] **T-040**: Build tag actions component
  - Copy digest button
  - Copy pull command button
  - Delete button (hidden if provider `canDelete: false`)
  - Inspect button → navigate to image inspector
  - Files: `src/components/tag/tag-actions.tsx`

- [x] **T-041**: Build tag explorer page
  - Route: `/repos/[registry]/[...name]`
  - Page header: repo name, registry badge, tag count
  - Search/filter tags
  - Tag table with sorting
  - Batch actions toolbar (appears when tags selected): delete selected
  - Files: `src/app/repos/[registry]/[...name]/page.tsx`

### 2.5 Image Inspector (F4) — P0

- [x] **T-042**: Build manifest viewer component
  - Formatted JSON view with syntax highlighting
  - Toggle: formatted / raw JSON
  - Copy manifest button
  - Show media type, schema version, digest
  - Files: `src/components/manifest/manifest-viewer.tsx`

- [x] **T-043**: Build layer list component
  - Table: layer index, digest (truncated), size (formatted), media type
  - Visual size bar (relative width proportional to layer size)
  - Total size summary at bottom
  - Files: `src/components/manifest/layer-list.tsx`

- [x] **T-044**: Build config inspector component
  - Sections: Environment Variables, Entrypoint/CMD, Labels, Exposed Ports, Volumes, Working Dir, User
  - Each section collapsible
  - Values displayed in monospace font, copy-on-click
  - Files: `src/components/manifest/config-inspector.tsx`

- [x] **T-045**: Build history timeline component
  - Visual timeline of Dockerfile commands (from `history[]`)
  - Show: command, created date, layer size (if not empty_layer)
  - Highlight RUN, COPY, ADD commands differently
  - Files: `src/components/manifest/history-timeline.tsx`

- [x] **T-046**: Build image inspector page
  - Route: `/repos/[registry]/[...name]/[tag]`
  - Tabbed layout: Overview | Layers | Config | History | Raw Manifest
  - Overview tab: architecture, OS, created date, total size, digest, pull command
  - Multi-arch: platform selector if manifest list detected
  - Spec ref: F4
  - Files: `src/app/repos/[registry]/[...name]/[tag]/page.tsx`

---

## Milestone 3: Management & Polish

> Goal: Tag management, global search, dashboard, loading states, error handling.

### 3.1 Tag Management (F5) — P1

- [x] **T-047**: Build delete confirmation dialog
  - Show tag name + digest
  - Warn: "This action cannot be undone"
  - Type tag name to confirm (for destructive safety)
  - Disable for providers where `canDelete: false`
  - Files: `src/components/tag/delete-dialog.tsx`

- [x] **T-048**: Implement tag deletion flow
  - Call `DELETE /api/v1/registries/:id/manifests/:name/:digest`
  - Optimistic update: remove tag from list immediately
  - Rollback on failure
  - Success/error toast
  - Files: update `src/hooks/use-tags.ts`, `src/components/tag/tag-actions.tsx`

- [x] **T-049**: Build pull command generator
  - Auto-generate: `docker pull {registryUrl}/{repoName}:{tag}`
  - Handle Docker Hub special case: `docker pull {repoName}:{tag}` (no registry prefix for Hub)
  - Copy button with animation
  - Also show `docker pull {repoName}@{digest}` variant
  - Files: `src/components/tag/pull-command.tsx`

### 3.2 Command Palette / Search (F7) — P1

- [x] **T-050**: Build command palette component
  - Trigger: ⌘K (Mac) / Ctrl+K (Windows/Linux)
  - Uses shadcn `command` component (cmdk)
  - Sections: Recent, Repositories, Tags, Actions
  - Real-time filtering as user types
  - Keyboard navigation: arrow keys + enter
  - Files: `src/components/layout/command-palette.tsx`

- [x] **T-051**: Create command palette hook
  - `useCommandPalette()` — open/close state, search query, results
  - Aggregate search across all registries
  - Debounced search (300ms)
  - Search history (last 10 searches, persisted)
  - Files: `src/hooks/use-command-palette.ts`

- [x] **T-052**: Create health check API route
  - `GET /api/health` → `{ status: "ok", version: "...", uptime: ... }`
  - Files: `src/app/api/health/route.ts`

### 3.3 Dashboard (F6) — P1

- [x] **T-053**: Build stats cards component
  - Cards: Total Registries, Total Repositories, Total Tags, Total Size
  - Each card: icon, value, label, trend indicator (optional)
  - Skeleton loading state
  - Files: `src/components/dashboard/stats-cards.tsx`

- [x] **T-054**: Build top repos chart
  - Bar chart (Recharts): top 10 repos by tag count
  - Hover tooltip with details
  - Clickable bars → navigate to repo
  - Files: `src/components/dashboard/top-repos-chart.tsx`

- [x] **T-055**: Build registry overview cards
  - Per-registry summary: name, status, repo count, tag count
  - Docker Hub: show rate limit usage bar
  - Quick actions: browse, test connection
  - Files: `src/components/dashboard/registry-overview.tsx`

- [x] **T-056**: Build dashboard page
  - Route: `/` (homepage)
  - Layout: stats cards (top) → registry overviews → top repos chart
  - Aggregated data from all connected registries
  - Empty state: "No registries connected. Add one to get started."
  - Spec ref: F6
  - Files: `src/app/page.tsx`

### 3.4 Loading & Error States — P1

- [x] **T-057**: Create skeleton components
  - `RegistryCardSkeleton` — card shape with pulsing lines
  - `RepoCardSkeleton` — repo card placeholder
  - `TagTableSkeleton` — table rows with pulsing cells
  - `ManifestSkeleton` — content blocks placeholder
  - `StatsCardSkeleton` — for dashboard
  - Files: `src/components/skeletons/*`

- [x] **T-058**: Create error boundary components
  - Global error boundary with retry button
  - Page-level error boundary with contextual message
  - Registry-specific errors: auth failed, not found, rate limited, unreachable
  - Files: `src/components/error-boundary.tsx`, `src/app/error.tsx`, `src/app/repos/error.tsx`

- [x] **T-059**: Create empty state components
  - Reusable empty state: icon, title, description, CTA button
  - Variants: no registries, no repos, no tags, no search results
  - Files: `src/components/empty-state.tsx`

### 3.5 Settings Page — P2

- [x] **T-060**: Build settings page
  - Route: `/settings`
  - Sections: Appearance (theme, sidebar), Data (cache, stale time), About (version)
  - Theme selector: dark / light / system
  - Clear cache button
  - Files: `src/app/settings/page.tsx`

---

## Milestone 4: Production Ready

> Goal: Dockerized, tested, documented, ready to deploy.

### 4.1 Docker & Deployment — P1

- [x] **T-061**: Create production Dockerfile
  - Multi-stage build: deps → build → runner
  - Use `node:20-alpine` as base
  - Target: < 100MB final image
  - Non-root user
  - Health check: `CMD curl -f http://localhost:3000/api/health`
  - Files: `Dockerfile`

- [x] **T-062**: Finalize docker-compose.yml
  - Production-ready compose with both services
  - Environment variable passthrough
  - Volume for registry data persistence
  - Network isolation
  - Spec ref: §12
  - Files: `docker-compose.yml`

- [x] **T-063**: Configure Next.js for production
  - `output: "standalone"` for Docker
  - CSP headers in `next.config.ts`
  - Image optimization settings
  - Files: `next.config.ts`

### 4.2 Testing — P1

- [x] **T-064**: Set up Vitest
  - Configure `vitest.config.ts`
  - Add test scripts to `package.json`
  - Files: `vitest.config.ts`, `package.json`

- [x] **T-065**: Unit tests — utilities
  - Test `formatBytes()`, `formatDate()`, `truncateDigest()`, `generatePullCommand()`
  - Test `cn()` utility
  - Files: `src/lib/__tests__/format.test.ts`, `src/lib/__tests__/utils.test.ts`

- [x] **T-066**: Unit tests — registry client
  - Mock HTTP responses for Registry V2 API
  - Test: ping, catalog, tags, manifest, delete
  - Test auth flows: none, basic, bearer token exchange
  - Test error handling: 401, 404, 429, network error
  - Files: `src/lib/__tests__/registry-client.test.ts`

- [x] **T-067**: Unit tests — providers
  - Test GenericProvider with mocked registry
  - Test DockerHubProvider with mocked Hub API + Registry API
  - Test provider factory auto-detection
  - Files: `src/lib/providers/__tests__/generic-provider.test.ts`, `...dockerhub-provider.test.ts`

- [x] **T-068**: Unit tests — Zustand stores
  - Test registry store: add, update, remove, persist
  - Test UI store: theme toggle, view mode, sidebar
  - Files: `src/stores/__tests__/registry-store.test.ts`, `...ui-store.test.ts`

- [x] **T-069**: Set up Playwright
  - Configure `playwright.config.ts`
  - Add E2E test scripts
  - Files: `playwright.config.ts`, `package.json`

- [x] **T-070**: E2E tests — critical flows
  - Test: Add local registry → browse repos → view tags → inspect image → delete tag
  - Test: Add Docker Hub → search repos → view tags → inspect image
  - Test: Command palette search
  - Test: Theme toggle
  - Files: `e2e/registry-flow.spec.ts`, `e2e/dockerhub-flow.spec.ts`

### 4.3 Documentation — P2

- [x] **T-071**: Write README.md
  - Project description + screenshots
  - Quick start (docker-compose one-liner)
  - Manual setup instructions
  - Supported registries list
  - Environment variables reference
  - Files: `README.md`

- [x] **T-072**: Write CONTRIBUTING.md
  - Dev environment setup
  - Code style guide
  - PR process
  - Testing expectations
  - Files: `CONTRIBUTING.md`

### 4.4 Final Polish — P2

- [x] **T-073**: Add favicon and meta tags
  - Custom favicon (Docker/container themed)
  - SEO meta tags: title, description, og:image
  - Files: `public/favicon.ico`, `src/app/layout.tsx`

- [x] **T-074**: Add keyboard shortcuts
  - `⌘K` → Command palette
  - `Escape` → Close dialogs/modals
  - `G then R` → Go to registries
  - `G then D` → Go to dashboard
  - Files: `src/hooks/use-keyboard-shortcuts.ts`

- [x] **T-075**: Performance optimization
  - Dynamic imports for heavy components (Recharts, manifest viewer)
  - Virtual scrolling for large repo/tag lists
  - Image/icon lazy loading
  - Files: various components

---

## Task Summary

| Milestone | Tasks | P0 | P1 | P2 |
|---|---|---|---|---|
| **M1: Foundation** | T-001 → T-025 | 23 | 2 | 0 |
| **M2: Core Browsing** | T-026 → T-046 | 21 | 0 | 0 |
| **M3: Management & Polish** | T-047 → T-060 | 0 | 12 | 2 |
| **M4: Production Ready** | T-061 → T-075 | 0 | 10 | 5 |
| **Total** | **75 tasks** | **44** | **24** | **7** |

## Dependency Graph (Critical Path)

```
T-001 (scaffolding)
  → T-002 (deps) → T-003 (shadcn)
  → T-004 (lint) → T-005 (env)
  → T-006 (design tokens) → T-007 (utilities)
  → T-012 (types)
      → T-013 (registry client)
          → T-014 (GenericProvider)
          → T-015 (DockerHubProvider)
          → T-016 (provider factory)
              → T-017..T-021 (API routes)
                  → T-031..T-034 (query hooks)
                      → T-026..T-030 (registry manager UI)
                      → T-035..T-038 (repo browser UI)
                      → T-039..T-041 (tag explorer UI)
                      → T-042..T-046 (image inspector UI)
  → T-008 (root layout)
      → T-009 (sidebar)
      → T-010 (topbar)
      → T-011 (breadcrumbs)
  → T-022..T-023 (stores)
```
