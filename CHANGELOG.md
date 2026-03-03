# Changelog

> Completed milestones archive. Active tasks are tracked in `tasks.md`.

---

## Milestone 5: Production Deployment ✅

### 5.1 Persistent Storage
- **T-076** Migrate registry store from in-memory Map to file-based JSON (`DATA_DIR/registries.json`)
- **T-077** Add `DATA_DIR` environment variable with Zod validation
- **T-078** Add `/data` to `.gitignore`

### 5.2 Docker
- **T-079** Update production Dockerfile — `/app/data` volume, `nextjs` user ownership
- **T-080** Update `docker-compose.yml` — named volume, `DATA_DIR`, `SESSION_SECRET` required
- **T-081** Create `docker-compose.dev.yml` — bun hot-reload, source mount, separate network

### 5.3 Configuration
- **T-082** Update `.env.example` with complete variable reference

---

## Milestone 4: Production Ready ✅

### 4.1 Docker & Deployment
- **T-061** Production Dockerfile — multi-stage, node:20-alpine, non-root user, health check
- **T-062** Finalize `docker-compose.yml` — volumes, network isolation, env passthrough
- **T-063** Configure Next.js for production — `output: standalone`, CSP headers

### 4.2 Testing
- **T-064** Set up Vitest
- **T-065** Unit tests — utilities (`formatBytes`, `formatDate`, `truncateDigest`)
- **T-066** Unit tests — registry client (ping, catalog, tags, manifest, delete, auth flows)
- **T-067** Unit tests — GenericProvider, DockerHubProvider, provider factory
- **T-068** Unit tests — Zustand stores (registry store, UI store)
- **T-069** Set up Playwright
- **T-070** E2E tests — add registry → browse repos → view tags → inspect image → delete tag

### 4.3 Documentation
- **T-071** Write `README.md`
- **T-072** Write `CONTRIBUTING.md`

### 4.4 Final Polish
- **T-073** Favicon and meta tags
- **T-074** Keyboard shortcuts (`⌘K`, `G→R`, `G→D`)
- **T-075** Dynamic imports for Recharts, virtual scrolling

---

## Milestone 3: Management & Polish ✅

### 3.1 Tag Management
- **T-047** Delete confirmation dialog (type-to-confirm)
- **T-048** Tag deletion flow — optimistic update, rollback on failure
- **T-049** Pull command generator (`docker pull registry/repo:tag`)

### 3.2 Command Palette / Search
- **T-050** Command palette component (⌘K, cmdk)
- **T-051** `useCommandPalette` hook — debounced search, history
- **T-052** Health check API route `GET /api/health`

### 3.3 Dashboard
- **T-053** Stats cards (Total Registries, Repos, Tags, Size)
- **T-054** Top repos chart (Recharts bar chart)
- **T-055** Registry overview cards
- **T-056** Dashboard page `/`

### 3.4 Loading & Error States
- **T-057** Skeleton components (registry, repo, tag, manifest, stats)
- **T-058** Error boundary components
- **T-059** Empty state components

### 3.5 Settings Page
- **T-060** Settings page (removed — theme toggle moved to topbar)

---

## Milestone 2: Core Browsing ✅

### 2.1 Registry Connection Manager
- **T-026** Registry form component (Zod validation, auth types, provider presets)
- **T-027** Registry card component (status dot, capabilities badges)
- **T-028** Connection status component (animated dot, latency)
- **T-029** Registries list page `/registries`
- **T-030** Add/edit registry pages `/registries/new`, `/registries/[id]/edit`

### 2.2 TanStack Query Hooks
- **T-031** `useRegistries`, `useRegistry`, `usePingRegistry`, `useAddRegistry`, `useUpdateRegistry`, `useDeleteRegistry`
- **T-032** `useRepositories`, `useSearchRepositories`
- **T-033** `useTags`, `useDeleteTag`, `useDeleteTags` (bulk)
- **T-034** `useManifest`

### 2.3 Repository Browser
- **T-035** Repo card component
- **T-036** Repo grid view (responsive, skeleton loading)
- **T-037** Repo table view (TanStack Table, sortable)
- **T-038** Repository browser page `/repos`

### 2.4 Tag Explorer
- **T-039** Tag table (TanStack Table, multi-select checkboxes, bulk delete toolbar)
- **T-040** Tag actions (copy digest, copy pull command, delete, inspect)
- **T-041** Tag explorer page `/repos/[registry]/[...name]`

### 2.5 Image Inspector
- **T-042** Manifest viewer (syntax highlight, raw/formatted toggle)
- **T-043** Layer list (size bar, total size)
- **T-044** Config inspector (env, entrypoint, labels, ports — collapsible)
- **T-045** History timeline (Dockerfile commands)
- **T-046** Image inspector (tabs: Overview, Layers, Config, History, Raw)

---

## Milestone 1: Foundation ✅

### 1.1 Project Scaffolding
- **T-001** Next.js 15 + TypeScript + App Router
- **T-002** Core dependencies (TanStack Query, Table, Zustand, Zod, Recharts)
- **T-003** shadcn/ui setup
- **T-004** ESLint + Prettier
- **T-005** `.env.example` + Zod env config

### 1.2 Design System
- **T-006** Tailwind design tokens (colors, typography, border radius, dark mode)
- **T-007** `cn()`, `formatBytes()`, `formatDate()`, `truncateDigest()`, `generatePullCommand()`

### 1.3 Layout Shell
- **T-008** Root layout with providers (Query, Theme, Toast)
- **T-009** Sidebar (nav links, connections list, mobile sheet)
- **T-010** Topbar (breadcrumbs, search trigger, theme toggle, hamburger)
- **T-011** Breadcrumb component

### 1.4 Type Definitions
- **T-012** `RegistryConnection`, `Repository`, `Tag`, `ImageManifest`, `ImageConfig`, `ApiResponse`, `ProviderCapabilities`

### 1.5 Registry Client Library
- **T-013** `RegistryHttpClient` (retry, timeout, auth, bearer token exchange, rate limit)
- **T-014** `GenericProvider` (ping, listRepositories, listTags, getManifest, getConfig, deleteManifest)
- **T-015** `DockerHubProvider`
- **T-016** Provider factory (`createProvider`)

### 1.6 BFF API Routes
- **T-017** Registry CRUD (`/api/v1/registries`)
- **T-018** Registry ping
- **T-019** Repositories list
- **T-020** Tags list
- **T-021** Manifest + Blob routes

### 1.7 State Management
- **T-022** Zustand registry store (persisted, encrypted credentials)
- **T-023** Zustand UI store (theme, viewMode, sidebar)

### 1.8 Development Environment
- **T-024** `docker-compose.yml`
- **T-025** Seed script for test images

---

## Bug Fixes & Improvements (Post-Milestone)

- Fix `canDelete` always false — inject `capabilities` from provider into API responses
- Fix manifest delete 502 — extract `Docker-Content-Digest` from response header via HEAD
- Fix `tagCount=0` on repositories page — `listRepositories` now fetches tags per repo
- Add bulk delete (`useDeleteTags`) with shared-digest deduplication and warning dialog
- Filter out empty repos (tags: null) from repository list — registry:2 ghost entries
- Remove delete from Repositories page — replace "Open" with "Browse Tags" + icon
- Redesign Add/Edit Registry form — centered layout, card radio auth buttons
- Clean Settings page — remove all non-essential sections, keep theme only → then removed entirely
