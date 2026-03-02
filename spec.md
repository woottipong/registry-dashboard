# Registry Dashboard — Specification

> A modern, premium web dashboard for browsing and managing Docker container images
> stored in a Docker Registry V2 compatible registry.

---

## 1. Overview

### Problem

Docker Registry V2 provides a powerful HTTP API for storing and distributing container images,
but it ships with **no built-in web UI**. Teams managing private registries must rely on CLI tools
(`docker`, `crane`, `skopeo`) or third-party UIs that are often outdated or feature-limited.

### Solution

**Registry Dashboard** — a self-hosted, modern web application that provides:

- Visual browsing of repositories and tags
- Image manifest and layer inspection
- Tag management (delete, copy)
- Multi-registry support
- Real-time search and filtering
- Size analytics and vulnerability awareness

### Target Users

- DevOps engineers managing private Docker registries
- Platform teams running Harbor, GHCR, or vanilla Docker Registry
- Developers who need quick visibility into available images

---

## 2. Tech Stack

| Layer              | Technology               | Version   | Rationale                                        |
|--------------------|--------------------------|-----------|--------------------------------------------------|
| **Framework**      | Next.js (App Router)     | 15.x      | RSC, streaming, API Routes as BFF proxy          |
| **Language**       | TypeScript               | 5.x       | Type safety across the stack                     |
| **Styling**        | Tailwind CSS             | 4.x       | Utility-first, rapid iteration                   |
| **UI Components**  | shadcn/ui                | latest    | Accessible, composable, dark-mode ready          |
| **Data Fetching**  | TanStack Query           | 5.x       | Cache, background refetch, optimistic updates    |
| **Tables**         | TanStack Table           | 8.x       | Headless, sortable, filterable, paginated        |
| **Icons**          | Lucide React             | latest    | Consistent icon set, tree-shakeable              |
| **Charts**         | Recharts                 | 2.x       | Image size distribution, layer visualization     |
| **State**          | Zustand                  | 5.x       | Lightweight client state (settings, UI prefs)    |
| **Form Validation**| Zod                      | 3.x       | Runtime schema validation                        |
| **Auth (optional)**| NextAuth.js              | 5.x       | Basic auth / token auth for protected registries |
| **Package Manager**| pnpm                     | 9.x       | Fast, strict, disk-efficient                     |
| **Linting**        | ESLint + Prettier        | latest    | Code quality enforcement                         |
| **Testing**        | Vitest + Playwright      | latest    | Unit + E2E testing                               |

### Architecture Pattern

```
┌─────────────────────────────────────────────────────┐
│                    Browser (Client)                  │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Dashboard │  │ Repo     │  │ Image Inspector  │  │
│  │ Page      │  │ Browser  │  │ (Manifest/Layers)│  │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
│       │              │                 │             │
│       └──────────────┼─────────────────┘             │
│                      │                               │
│              TanStack Query                          │
└──────────────────────┼───────────────────────────────┘
                       │ HTTP (fetch)
┌──────────────────────┼───────────────────────────────┐
│              Next.js API Routes (BFF)                │
│                                                      │
│  ┌────────────────┐  ┌─────────────────────────────┐ │
│  │ /api/registries │  │ /api/registries/[id]/repos  │ │
│  │ /api/repos      │  │ /api/repos/[name]/tags      │ │
│  │ /api/manifests  │  │ /api/manifests/[ref]        │ │
│  └───────┬────────┘  └────────────┬────────────────┘ │
│          │                        │                   │
│          └────────────┬───────────┘                   │
│                       │                               │
│              Registry HTTP Client                     │
│         (handles auth, retries, parsing)              │
└───────────────────────┼───────────────────────────────┘
                        │ HTTP (Docker Registry V2 API)
┌───────────────────────┼───────────────────────────────┐
│           Docker Registry V2 (or compatible)          │
│                                                       │
│  • Docker Distribution (vanilla)                      │
│  • Docker Hub (registry-1.docker.io + hub.docker.com) │
│  • Harbor                                             │
│  • GitHub Container Registry (GHCR)                   │
│  • AWS ECR / GCP Artifact Registry / Azure ACR        │
└───────────────────────────────────────────────────────┘
```

### Why BFF (Backend-for-Frontend)?

1. **CORS** — Docker Registry V2 does not set CORS headers; browsers block direct requests.
2. **Auth Proxy** — Registry credentials stay server-side; never exposed to the browser.
3. **Response Shaping** — Aggregate multiple registry calls (catalog + tags + manifest) into a single response.
4. **Rate Limiting** — Control outbound requests to avoid registry throttling.

---

## 3. Docker Registry V2 API Reference

Base specification: [OCI Distribution Spec](https://github.com/opencontainers/distribution-spec)

### Key Endpoints Used

| Method   | Endpoint                                          | Purpose                        |
|----------|---------------------------------------------------|--------------------------------|
| `GET`    | `/v2/`                                            | API version check / ping       |
| `GET`    | `/v2/_catalog`                                    | List repositories              |
| `GET`    | `/v2/{name}/tags/list`                            | List tags for a repository     |
| `GET`    | `/v2/{name}/manifests/{reference}`                | Get image manifest             |
| `HEAD`   | `/v2/{name}/manifests/{reference}`                | Get manifest digest (no body)  |
| `DELETE` | `/v2/{name}/manifests/{reference}`                | Delete manifest by digest      |
| `GET`    | `/v2/{name}/blobs/{digest}`                       | Download layer blob            |
| `HEAD`   | `/v2/{name}/blobs/{digest}`                       | Check blob existence / size    |
| `DELETE` | `/v2/{name}/blobs/{digest}`                       | Delete blob                    |

### Authentication Patterns

| Pattern          | Header                              | When Used                    |
|------------------|-------------------------------------|------------------------------|
| **None**         | —                                   | Local/dev registries         |
| **Basic Auth**   | `Authorization: Basic base64(u:p)`  | Private registries           |
| **Bearer Token** | `Authorization: Bearer <token>`     | Docker Hub, GHCR, cloud CRs |

Token flow: `GET /v2/` → 401 with `Www-Authenticate` → fetch token → retry with Bearer.

### Docker Hub Specifics

Docker Hub is **not a vanilla Registry V2**. It requires a hybrid approach:

| Capability              | Vanilla Registry V2          | Docker Hub                                           |
|-------------------------|------------------------------|------------------------------------------------------|
| **Base URL (registry)** | `https://your-registry.com`  | `https://registry-1.docker.io`                       |
| **Catalog / Search**    | `GET /v2/_catalog`           | ❌ Disabled → use Hub API: `https://hub.docker.com/v2/` |
| **Tags list**           | `GET /v2/{name}/tags/list`   | ✅ Works (official images use `library/` prefix)      |
| **Manifests**           | `GET /v2/{name}/manifests/*` | ✅ Works                                              |
| **Delete tags**         | `DELETE /v2/{name}/manifests/*` | ❌ Not supported via API                            |
| **Auth**                | Basic / None                 | Bearer token exchange (mandatory)                    |
| **Rate Limit**          | Usually none                 | 100 pulls/6hr (anon), 200 (auth), 5000 (paid)       |

#### Docker Hub API (hub.docker.com)

For listing repositories and searching, we use a **separate REST API**:

```
# List repos for a user/org
GET https://hub.docker.com/v2/repositories/{namespace}/
    ?page=1&page_size=25&ordering=last_updated

# Search repos
GET https://hub.docker.com/v2/search/repositories/
    ?query=nginx&page=1&page_size=25

# Get repo details
GET https://hub.docker.com/v2/repositories/{namespace}/{repository}/

# List tags (Hub API version, includes extra metadata)
GET https://hub.docker.com/v2/repositories/{namespace}/{repository}/tags/
    ?page=1&page_size=25&ordering=-last_updated

# Auth
POST https://hub.docker.com/v2/users/login/
    {"username": "...", "password": "..."}
    → returns JWT token
```

#### Bearer Token Exchange Flow

```
1. GET https://registry-1.docker.io/v2/
   → 401 Unauthorized
   → Www-Authenticate: Bearer realm="https://auth.docker.io/token",
                               service="registry.docker.io",
                               scope="repository:library/nginx:pull"

2. GET https://auth.docker.io/token
       ?service=registry.docker.io
       &scope=repository:library/nginx:pull
       (&account=username)  ← optional, for authenticated pulls
   → {"token": "eyJ...", "expires_in": 300}

3. GET https://registry-1.docker.io/v2/library/nginx/tags/list
   Authorization: Bearer eyJ...
   → {"name": "library/nginx", "tags": ["latest", "1.25", ...]}
```

#### Rate Limiting Strategy

- Track remaining pulls via `RateLimit-Remaining` response header
- Show rate limit status in UI (badge on Docker Hub registries)
- Cache manifests aggressively to minimize pull count
- Warn user when approaching limit (< 20 remaining)

### Provider Abstraction

To support both vanilla registries and Docker Hub cleanly, we use a **provider pattern**:

```typescript
interface RegistryProvider {
  type: "generic" | "dockerhub" | "ghcr" | "ecr" | "gcr" | "acr";

  // Core operations
  ping(): Promise<boolean>;
  listRepositories(options?: ListOptions): Promise<PaginatedResult<Repository>>;
  listTags(repo: string, options?: ListOptions): Promise<PaginatedResult<Tag>>;
  getManifest(repo: string, ref: string): Promise<ImageManifest>;
  getConfig(repo: string, digest: string): Promise<ImageConfig>;

  // Management (may throw UnsupportedError)
  deleteManifest(repo: string, digest: string): Promise<void>;

  // Search
  searchRepositories(query: string): Promise<PaginatedResult<Repository>>;

  // Auth
  authenticate(): Promise<void>;

  // Capabilities
  capabilities(): ProviderCapabilities;
}

interface ProviderCapabilities {
  canListCatalog: boolean;      // false for Docker Hub
  canDelete: boolean;           // false for Docker Hub
  canSearch: boolean;           // true for Docker Hub (Hub API)
  hasRateLimit: boolean;        // true for Docker Hub
  supportsMultiArch: boolean;   // true for most
}
```

This pattern lets the UI **adapt per provider** — e.g., hide the delete button for Docker Hub,
show a search bar when the provider supports it, display rate limit warnings, etc.

---

## 4. Features

### 4.1 Core Features (MVP)

#### F1: Multi-Registry Connection Manager

- Add/edit/remove registry connections (URL, name, auth type)
- Store connections in browser `localStorage` (no database needed for MVP)
- Connection health check (ping `/v2/`)
- Support: no auth, basic auth, bearer token
- **Docker Hub preset**: One-click add Docker Hub with pre-filled URL and token flow
- Auto-detect provider type from URL (e.g., `registry-1.docker.io` → Docker Hub)
- Show provider-specific capabilities (can delete? has rate limit?)

#### F2: Repository Browser

- List all repositories from connected registry (`/v2/_catalog` with pagination)
- **Docker Hub**: Use Hub API to list repos by namespace (user/org)
- Search/filter repositories by name (client-side + server-side for generic, Hub API search for Docker Hub)
- Show repository metadata: tag count, last updated, description (Docker Hub)
- Grid view and list view toggle
- **Docker Hub**: Show star count, pull count, official badge

#### F3: Tag Explorer

- List all tags for a repository
- Show per-tag info: digest, size, created date, architecture
- Sort by name, date, size
- Multi-select tags for batch operations

#### F4: Image Inspector

- Detailed manifest view (JSON + formatted)
- Layer list with individual sizes
- Config blob inspection (environment vars, entrypoint, cmd, labels)
- Architecture/OS information
- Total compressed/uncompressed size
- Support both Docker manifest v2 and OCI manifest

#### F5: Tag Management

- Delete tag (via manifest digest)
- Copy tag reference (digest) to clipboard
- Pull command generator (`docker pull registry.example.com/repo:tag`)

#### F6: Dashboard

- Overview of connected registries
- Total repositories and tags count
- Top repositories by tag count
- Storage size breakdown (if available)
- Recent activity / recently pushed images

#### F7: Search

- Global search across all repositories and tags
- Real-time autocomplete
- Search history
- Keyboard shortcut (⌘K / Ctrl+K) to open search

### 4.2 Enhanced Features (Post-MVP)

#### F8: Image Comparison

- Side-by-side comparison of two tags (layers, config, size)
- Diff view showing added/removed/changed layers

#### F9: Garbage Collection Helper

- Identify untagged manifests
- Show reclaimable storage
- Trigger GC recommendations

#### F10: Vulnerability Integration

- Link to vulnerability scan results (Trivy, Clair, Grype)
- Show CVE count badges on tags
- Severity breakdown per image

#### F11: Webhooks & Notifications

- Watch repositories for new pushes
- Browser notifications for watched repos

#### F12: RBAC & Audit Log

- Role-based access (admin, viewer)
- Action audit trail

---

## 5. Pages & Routes

```
/                           → Dashboard (overview)
/registries                 → Registry connection manager
/registries/new             → Add new registry
/registries/[id]/edit       → Edit registry connection
/repos                      → Repository browser (all registries)
/repos/[registry]/[name]    → Tag explorer for a specific repo
/repos/[registry]/[name]/[tag]  → Image inspector (manifest, layers, config)
/repos/[registry]/[name]/compare → Image comparison (post-MVP)
/settings                   → App settings (theme, preferences)
```

---

## 6. Data Models

### Registry Connection

```typescript
interface RegistryConnection {
  id: string;                     // UUID
  name: string;                   // Display name (e.g., "Production Registry")
  url: string;                    // Registry URL (e.g., "https://registry.example.com")
  provider: "generic" | "dockerhub" | "ghcr" | "ecr" | "gcr" | "acr";
  authType: "none" | "basic" | "bearer";
  credentials?: {
    username?: string;
    password?: string;            // Stored encrypted in localStorage
    token?: string;
  };
  // Docker Hub specific
  namespace?: string;             // Docker Hub user or org (e.g., "library", "nginx")
  isDefault: boolean;
  createdAt: string;              // ISO 8601
  lastCheckedAt: string | null;
  status: "connected" | "disconnected" | "error";
  rateLimitRemaining?: number;    // Docker Hub rate limit tracking
  rateLimitTotal?: number;
}
```

### Repository

```typescript
interface Repository {
  name: string;                   // e.g., "library/nginx"
  registryId: string;             // Reference to RegistryConnection
  tagCount: number;
  lastUpdated: string | null;
  // Docker Hub specific (from Hub API)
  description?: string;
  pullCount?: number;
  starCount?: number;
  isOfficial?: boolean;
  isAutomated?: boolean;
}
```

### Tag

```typescript
interface Tag {
  name: string;                   // e.g., "latest", "1.25-alpine"
  digest: string;                 // e.g., "sha256:abc123..."
  mediaType: string;              // e.g., "application/vnd.docker.distribution.manifest.v2+json"
  size: number;                   // Total size in bytes
  createdAt: string | null;
  architecture: string;           // e.g., "amd64"
  os: string;                     // e.g., "linux"
}
```

### Manifest

```typescript
interface ImageManifest {
  schemaVersion: number;
  mediaType: string;
  digest: string;
  config: {
    mediaType: string;
    size: number;
    digest: string;
  };
  layers: Array<{
    mediaType: string;
    size: number;
    digest: string;
  }>;
  totalSize: number;              // Computed: config.size + sum(layers[].size)
}
```

### Image Config

```typescript
interface ImageConfig {
  architecture: string;
  os: string;
  created: string;
  author?: string;
  config: {
    Hostname: string;
    Env: string[];
    Cmd: string[];
    Entrypoint: string[];
    Labels: Record<string, string>;
    ExposedPorts?: Record<string, object>;
    Volumes?: Record<string, object>;
    WorkingDir?: string;
    User?: string;
  };
  history: Array<{
    created: string;
    created_by: string;
    empty_layer?: boolean;
    comment?: string;
  }>;
  rootfs: {
    type: string;
    diff_ids: string[];
  };
}
```

---

## 7. API Routes (BFF)

### Internal API Design

All API routes are under `/api/v1/` and act as a proxy to the Docker Registry V2 API.

```
GET    /api/v1/registries                         → List saved registries
POST   /api/v1/registries                         → Add a registry
PUT    /api/v1/registries/:id                     → Update a registry
DELETE /api/v1/registries/:id                     → Remove a registry
GET    /api/v1/registries/:id/ping                → Health check (GET /v2/)

GET    /api/v1/registries/:id/repositories        → List repos (GET /v2/_catalog)
GET    /api/v1/registries/:id/repositories/:name/tags
                                                   → List tags (GET /v2/{name}/tags/list)

GET    /api/v1/registries/:id/manifests/:name/:ref → Get manifest
HEAD   /api/v1/registries/:id/manifests/:name/:ref → Get digest
DELETE /api/v1/registries/:id/manifests/:name/:ref → Delete manifest

GET    /api/v1/registries/:id/blobs/:name/:digest  → Get blob (config)
```

### Response Format

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    total?: number;
    page?: number;
    perPage?: number;
    hasMore?: boolean;
  };
}
```

---

## 8. UI/UX Design Principles

### Visual Identity

- **Theme**: Dark-first with light mode toggle
- **Primary Color**: Electric blue (#3B82F6) with cyan accents (#06B6D4)
- **Background**: Deep navy (#0F172A) for dark mode
- **Typography**: Inter (UI) + JetBrains Mono (code/digests)
- **Border Radius**: 8px (cards), 6px (inputs), 12px (modals)
- **Shadows**: Subtle layered shadows for depth
- **Glassmorphism**: Frosted glass effect on sidebar and modals

### Key Design Patterns

1. **Command Palette (⌘K)**: Global search + quick actions
2. **Breadcrumb Navigation**: Registry → Repository → Tag → Manifest
3. **Skeleton Loading**: Content-aware loading states
4. **Toast Notifications**: Non-blocking success/error messages
5. **Responsive Sidebar**: Collapsible with registry tree navigation
6. **Keyboard First**: Full keyboard navigation support
7. **Copy-on-Click**: Digests, pull commands auto-copy with animation

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  ┌─── Topbar ────────────────────────────────────────┐  │
│  │ Logo   Breadcrumbs        Search (⌘K)  Theme  ☰  │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌─── Sidebar ───┐  ┌─── Main Content ──────────────┐  │
│  │                │  │                                │  │
│  │  Registry 1    │  │   ┌─── Page Header ─────────┐ │  │
│  │   ├─ repo-a    │  │   │ Title    Actions  Filter │ │  │
│  │   ├─ repo-b    │  │   └─────────────────────────┘ │  │
│  │   └─ repo-c    │  │                                │  │
│  │                │  │   ┌─── Content Area ────────┐  │  │
│  │  Registry 2    │  │   │                          │  │  │
│  │   ├─ repo-d    │  │   │  Cards / Table / Detail  │  │  │
│  │   └─ repo-e    │  │   │                          │  │  │
│  │                │  │   └──────────────────────────┘  │  │
│  │  + Add Registry│  │                                │  │
│  └────────────────┘  └────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Project Structure

```
registry_ui/
├── public/
│   └── favicon.ico
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (providers, sidebar)
│   │   ├── page.tsx                  # Dashboard
│   │   ├── registries/
│   │   │   ├── page.tsx              # Registry list
│   │   │   ├── new/page.tsx          # Add registry
│   │   │   └── [id]/edit/page.tsx    # Edit registry
│   │   ├── repos/
│   │   │   ├── page.tsx              # Repository browser
│   │   │   └── [registry]/
│   │   │       └── [...name]/
│   │   │           ├── page.tsx      # Tag explorer
│   │   │           └── [tag]/
│   │   │               └── page.tsx  # Image inspector
│   │   ├── settings/
│   │   │   └── page.tsx              # App settings
│   │   └── api/
│   │       └── v1/                   # BFF API routes
│   │           ├── registries/
│   │           │   ├── route.ts
│   │           │   └── [id]/
│   │           │       ├── route.ts
│   │           │       ├── ping/route.ts
│   │           │       ├── repositories/route.ts
│   │           │       └── manifests/[...path]/route.ts
│   │           └── blobs/[...path]/route.ts
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── topbar.tsx
│   │   │   ├── breadcrumbs.tsx
│   │   │   └── command-palette.tsx
│   │   ├── registry/
│   │   │   ├── registry-card.tsx
│   │   │   ├── registry-form.tsx
│   │   │   └── connection-status.tsx
│   │   ├── repository/
│   │   │   ├── repo-card.tsx
│   │   │   ├── repo-grid.tsx
│   │   │   └── repo-table.tsx
│   │   ├── tag/
│   │   │   ├── tag-table.tsx
│   │   │   ├── tag-row.tsx
│   │   │   └── tag-actions.tsx
│   │   ├── manifest/
│   │   │   ├── manifest-viewer.tsx
│   │   │   ├── layer-list.tsx
│   │   │   ├── config-inspector.tsx
│   │   │   └── history-timeline.tsx
│   │   └── dashboard/
│   │       ├── stats-cards.tsx
│   │       ├── top-repos-chart.tsx
│   │       └── recent-activity.tsx
│   ├── lib/
│   │   ├── registry-client.ts        # Docker Registry V2 HTTP client
│   │   ├── auth.ts                   # Auth handler (basic, bearer token flow)
│   │   ├── utils.ts                  # Shared utilities
│   │   ├── format.ts                 # Size formatting, date formatting
│   │   └── constants.ts              # API paths, defaults
│   ├── hooks/
│   │   ├── use-registries.ts         # TanStack Query hooks for registries
│   │   ├── use-repositories.ts       # TanStack Query hooks for repos
│   │   ├── use-tags.ts               # TanStack Query hooks for tags
│   │   ├── use-manifest.ts           # TanStack Query hooks for manifests
│   │   └── use-command-palette.ts    # ⌘K command palette hook
│   ├── stores/
│   │   ├── registry-store.ts         # Zustand: registry connections (persisted)
│   │   └── ui-store.ts               # Zustand: sidebar, theme, view preferences
│   └── types/
│       ├── registry.ts               # RegistryConnection, Repository, Tag, etc.
│       ├── manifest.ts               # ImageManifest, ImageConfig
│       └── api.ts                    # ApiResponse, pagination types
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
├── package.json
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── Dockerfile                        # Self-hosted deployment
├── docker-compose.yml                # Dev: registry + UI
├── CLAUDE.md
├── spec.md
└── tasks.md
```

---

## 10. Non-Functional Requirements

### Performance

- **First Contentful Paint**: < 1.5s
- **API Response Time**: < 500ms (proxy overhead < 100ms)
- **Repository list**: Handle 10,000+ repos with virtual scrolling
- **Client-side caching**: TanStack Query with 5-minute stale time

### Security

- Registry credentials never sent to browser; stored in server-side session or encrypted cookie
- CSP headers configured
- Input sanitization on all user inputs
- Rate limiting on API proxy routes

### Accessibility

- WCAG 2.1 AA compliance
- Full keyboard navigation
- Screen reader compatible (ARIA labels on all interactive elements)
- High contrast mode support

### Deployment

- **Docker image**: Multi-stage build, < 100MB final image
- **docker-compose**: Bundled with a test registry for quick start
- **Environment variables** for all configuration (no hardcoded values)
- **Health check endpoint**: `/api/health`

---

## 11. Environment Variables

```bash
# Registry Dashboard Configuration
NEXT_PUBLIC_APP_NAME="Registry Dashboard"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Default Registry (optional, pre-configured on first load)
DEFAULT_REGISTRY_URL="http://localhost:5000"
DEFAULT_REGISTRY_NAME="Local Registry"
DEFAULT_REGISTRY_AUTH_TYPE="none"

# Auth (if using basic auth for a default registry)
DEFAULT_REGISTRY_USERNAME=""
DEFAULT_REGISTRY_PASSWORD=""

# Session encryption key (for storing registry credentials server-side)
SESSION_SECRET="change-me-in-production"

# Telemetry
NEXT_TELEMETRY_DISABLED=1
```

---

## 12. Development Setup

```bash
# Clone and install
git clone <repo-url>
cd registry_ui
pnpm install

# Start dev environment (registry + UI)
docker compose up -d registry   # Starts a local Docker registry on :5000
pnpm dev                        # Starts Next.js on :3000

# Push test images to local registry
docker pull nginx:alpine
docker tag nginx:alpine localhost:5000/nginx:alpine
docker push localhost:5000/nginx:alpine

docker pull redis:7
docker tag redis:7 localhost:5000/redis:7
docker push localhost:5000/redis:7
```

### docker-compose.yml (Development)

```yaml
services:
  registry:
    image: registry:2
    ports:
      - "5000:5000"
    environment:
      REGISTRY_STORAGE_DELETE_ENABLED: "true"
    volumes:
      - registry-data:/var/lib/registry

  ui:
    build: .
    ports:
      - "3000:3000"
    environment:
      DEFAULT_REGISTRY_URL: "http://registry:5000"
      DEFAULT_REGISTRY_NAME: "Local Registry"
    depends_on:
      - registry

volumes:
  registry-data:
```

---

## 13. Milestones

### Milestone 1: Foundation (Week 1)

- [ ] Project scaffolding (Next.js + shadcn/ui + Tailwind)
- [ ] Design system setup (colors, typography, dark mode)
- [ ] Layout shell (sidebar, topbar, breadcrumbs)
- [ ] Registry client library (`lib/registry-client.ts`)
- [ ] API routes: ping, catalog, tags

### Milestone 2: Core Browsing (Week 2)

- [ ] Registry connection manager (add/edit/remove)
- [ ] Repository browser (grid + table views)
- [ ] Tag explorer with sorting and filtering
- [ ] Image inspector (manifest, layers, config)

### Milestone 3: Management & Polish (Week 3)

- [ ] Tag deletion with confirmation
- [ ] Pull command generator
- [ ] Command palette (⌘K search)
- [ ] Dashboard with stats and charts
- [ ] Skeleton loading states

### Milestone 4: Production Ready (Week 4)

- [ ] Docker image build
- [ ] docker-compose for self-hosting
- [ ] Error handling & edge cases
- [ ] Basic E2E tests
- [ ] Documentation (README, CONTRIBUTING)

---

## 14. Open Questions

1. **Database**: Should we add SQLite/Postgres for persisting registry connections,
   or keep it simple with localStorage + server-side session for MVP?
   → **Decision**: Start with localStorage for MVP. Add DB layer in v2 if multi-user is needed.

2. **Multi-arch support**: How to display manifest lists (fat manifests) with multiple
   platform entries?
   → **Decision**: Show platform selector in Image Inspector. Default to `linux/amd64`.

3. **Cloud registry specifics**: GHCR, ECR, etc. use token exchange flows.
   Should MVP support these?
   → **Decision**: MVP supports basic auth + bearer token. Cloud-specific flows in v2.

4. **Garbage collection**: Registry GC requires restart of the registry process.
   Should the UI trigger this?
   → **Decision**: No. UI only identifies candidates. GC is out-of-scope for MVP.
