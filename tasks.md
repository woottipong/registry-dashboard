# Registry Dashboard — Tasks

> Completed milestones are archived in `CHANGELOG.md`.
> This file tracks only pending and in-progress work.

---

## Legend

- `[ ]` — Not started
- `[~]` — In progress
- `[x]` — Done
- `[!]` — Blocked
- **Priority**: P0 (critical path) → P1 (important) → P2 (nice-to-have)

---

## Milestones 1–6: ✅ Complete — see `CHANGELOG.md`

## Milestone 7: Login — Env-based Authentication

> Goal: ป้องกัน UI ด้วย username/password ที่กำหนดผ่าน environment variable  
> ไม่ต้องใช้ database หรือ OAuth — simple credential check บน server side

---

### 7.1 Env Config — P0

- [ ] **T-100** เพิ่ม env variables สำหรับ dashboard login
  - เพิ่ม `APP_USERNAME` และ `APP_PASSWORD` ใน `envSchema` ของ `src/lib/config.ts`
  - เพิ่มใน `.env.example` พร้อม comment
  - `APP_USERNAME` default: `"admin"` | `APP_PASSWORD`: required (ไม่มี default)
  - Files: `src/lib/config.ts`, `.env.example`

---

### 7.2 Session Middleware — P0

- [ ] **T-101** สร้าง server-side session handler ด้วย `iron-session`
  - ติดตั้ง `iron-session` (ใช้ `SESSION_SECRET` ที่มีอยู่แล้ว)
  - สร้าง `src/lib/session.ts` — `getSession()`, `SessionData` type (`{ user?: { username: string } }`)
  - Files: `src/lib/session.ts`, `package.json`

- [ ] **T-102** สร้าง Next.js middleware สำหรับ route protection
  - สร้าง `src/middleware.ts`
  - redirect ไป `/login` ถ้า session ไม่มี user
  - ยกเว้น routes: `/login`, `/api/auth/*`, `/_next/*`, `/favicon.ico`
  - Files: `src/middleware.ts`

---

### 7.3 Auth API Routes — P0

- [ ] **T-103** สร้าง `POST /api/auth/login` route
  - รับ `{ username, password }` — เปรียบเทียบกับ `config.APP_USERNAME` / `config.APP_PASSWORD`
  - ใช้ timing-safe comparison (`crypto.timingSafeEqual`) ป้องกัน timing attack
  - set session และ return `{ ok: true }` หรือ `401`
  - Files: `src/app/api/auth/login/route.ts`

- [ ] **T-104** สร้าง `POST /api/auth/logout` route
  - destroy session และ redirect ไป `/login`
  - Files: `src/app/api/auth/logout/route.ts`

- [ ] **T-105** สร้าง `GET /api/auth/me` route
  - คืน `{ username }` ถ้า login อยู่ หรือ `401`
  - ใช้สำหรับ client-side auth check
  - Files: `src/app/api/auth/me/route.ts`

---

### 7.4 Login Page — P0

- [ ] **T-106** สร้าง `/login` page
  - สร้าง `src/app/login/page.tsx` — Server Component, redirect ไป `/` ถ้า already logged in
  - สร้าง `src/app/login/login-form.tsx` — Client Component
    - form: username + password input + submit button
    - แสดง error message เมื่อ credentials ผิด
    - redirect ไป `/` เมื่อ login สำเร็จ
  - ใช้ shadcn `Card`, `Input`, `Button` components
  - Files: `src/app/login/page.tsx`, `src/app/login/login-form.tsx`

---

### 7.5 Logout UI — P1

- [ ] **T-107** เพิ่มปุ่ม Logout ใน navigation/header
  - เพิ่ม logout button ที่ navbar/header ที่มีอยู่
  - call `POST /api/auth/logout` แล้ว redirect ไป `/login`
  - แสดง username ที่ login อยู่ด้วย
  - Files: `src/components/layout/` (header หรือ navbar component ที่มีอยู่)

---

## Milestone 8: Docker Hub — Browse Images via Personal Credentials

> Goal: ให้ user เพิ่ม Docker Hub account ของตัวเองเข้า registry list  
> แล้ว browse private/personal repositories และ tags ได้

---

### 8.1 Docker Hub Auth Token Exchange — P0

- [ ] **T-110** ปรับ `DockerHubProvider` รองรับ token exchange จาก username/password
  - Docker Hub ใช้ JWT จาก `POST https://hub.docker.com/v2/users/login`
  - เพิ่ม `exchangeToken(username, password): Promise<string>` ใน provider
  - store JWT ใน provider instance เพื่อใช้กับ Hub API requests
  - Files: `src/lib/providers/dockerhub-provider.ts`

- [ ] **T-111** ปรับ `authenticate()` ใน `DockerHubProvider` ให้ exchange token จริง
  - ปัจจุบัน `authenticate()` แค่ call `ping()` — ไม่ได้ใช้ credentials
  - ถ้า `connection.credentials` มี username/password → exchange token ก่อน
  - Bearer token ที่ได้ใช้กับ `hub.docker.com/v2/` requests
  - Files: `src/lib/providers/dockerhub-provider.ts`

---

### 8.2 Docker Hub Namespace Resolution — P0

- [ ] **T-112** รองรับ personal namespace (username เป็น namespace)
  - ปัจจุบัน `defaultNamespace` fallback เป็น `"library"` (official images เท่านั้น)
  - ถ้า `connection.namespace` ไม่ได้ระบุ และมี credentials → ใช้ `username` เป็น namespace
  - `listRepositories()` list repos ของ user จาก `hub.docker.com/v2/repositories/{username}/`
  - Files: `src/lib/providers/dockerhub-provider.ts`

---

### 8.3 Registry Form — Docker Hub Option — P0

- [ ] **T-113** เพิ่ม Docker Hub เป็น provider option ใน Add Registry form
  - เพิ่ม option `"dockerhub"` ใน provider select
  - เมื่อเลือก dockerhub:
    - URL field: pre-fill ด้วย `https://hub.docker.com` (read-only)
    - แสดง username + password fields (required)
    - Namespace field: auto-fill จาก username ที่กรอก
  - Files: `src/components/registries/` (registry form component)

---

### 8.4 Docker Hub Rate Limit Display — P1

- [ ] **T-114** แสดง Docker Hub rate limit ใน UI
  - Docker Hub pull rate limit: 100 pulls/6h (anonymous), 200/6h (free account)
  - `RegistryHttpClient` มี `getRateLimit()` อยู่แล้ว — ดึงจาก response headers
  - แสดง rate limit badge บน repository list page เมื่อ registry เป็น dockerhub type
  - Files: `src/components/repository/`, `src/lib/providers/dockerhub-provider.ts`

---

### 8.5 Private Repository Support — P1

- [ ] **T-115** รองรับ pull manifest/blob จาก private Docker Hub repos
  - `registry-1.docker.io/v2/{repo}/manifests/{ref}` ต้องการ Bearer token
  - Token สำหรับ `registry-1.docker.io` แตกต่างจาก Hub API token — ต้องขอจาก `auth.docker.io`
  - เพิ่ม `getRegistryBearerToken(repo, username, password)` method
  - Files: `src/lib/providers/dockerhub-provider.ts`, `src/lib/registry-client.ts`

---

### สรุป Milestone 7 & 8 — Impact vs Effort

| Task | Feature | Impact | Effort | Priority |
|------|---------|--------|--------|----------|
| T-100 env config | Login | 🔴 สูงมาก | 🟢 ต่ำ | P0 |
| T-101 iron-session | Login | 🔴 สูงมาก | 🟢 ต่ำ | P0 |
| T-102 middleware | Login | 🔴 สูงมาก | 🟢 ต่ำ | P0 |
| T-103 login API | Login | 🔴 สูงมาก | 🟢 ต่ำ | P0 |
| T-104 logout API | Login | 🟠 สูง | 🟢 ต่ำ | P0 |
| T-105 me API | Login | 🟡 กลาง | 🟢 ต่ำ | P1 |
| T-106 login page | Login | 🔴 สูงมาก | 🟡 กลาง | P0 |
| T-107 logout UI | Login | 🟡 กลาง | 🟢 ต่ำ | P1 |
| T-110 hub token exchange | DockerHub | 🔴 สูงมาก | 🟡 กลาง | P0 |
| T-111 authenticate() fix | DockerHub | 🔴 สูงมาก | 🟢 ต่ำ | P0 |
| T-112 namespace resolution | DockerHub | 🔴 สูงมาก | 🟢 ต่ำ | P0 |
| T-113 registry form | DockerHub | 🔴 สูงมาก | 🟡 กลาง | P0 |
| T-114 rate limit display | DockerHub | 🟢 ต่ำ | 🟡 กลาง | P1 |
| T-115 private repo manifests | DockerHub | 🟠 สูง | 🔴 สูง | P1 |

---

## Milestone 9: Open-Source Hardening — Performance, Security & DX

> **Goal**: ปรับ codebase ให้พร้อมเปิด open-source — แก้ security issues, ปรับ performance,  
> ลด code duplication, เพิ่ม accessibility, และทำให้ contributor experience ดี  
> จัดเรียงตาม severity — CRITICAL → HIGH → MEDIUM → LOW  
> แต่ละ task เป็นอิสระ สามารถทำขนานกันได้โดย contributor หลายคน

---

### 9.1 Security Hardening — P0 (CRITICAL)

- [ ] **T-200** แก้ API response format inconsistency — ใช้ `ApiResponse<T>` เท่านั้น
  - `src/app/api/v1/registries/[id]/repositories/[...name]/route.ts` lines 19-22, 39-42, 88-92
    ใช้ `{ errors: [...] }` format (Docker Registry raw format) แทนที่จะเป็น `ApiResponse<T>`
  - Scan ทุก API route ให้แน่ใจว่า return `{ success, data, error }` เสมอ
  - Files: `src/app/api/v1/registries/[id]/repositories/[...name]/route.ts`

- [ ] **T-201** เพิ่ม Zod validation บน query params ทุก API route
  - 11 จาก 13 API routes ไม่มี validation เลย — `page`, `perPage`, `search`, `namespace`
    สามารถเป็น NaN, ค่าลบ, ค่ามหาศาล ได้
  - สร้าง shared schema: `lib/validators/query-schemas.ts`
    ```
    listQuerySchema = z.object({
      page: z.coerce.number().int().min(1).default(1),
      perPage: z.coerce.number().int().min(1).max(100).default(20),
      search: z.string().max(200).optional(),
      namespace: z.string().max(200).optional(),
    })
    ```
  - Apply ให้ทุก GET route ที่รับ query params
  - Files: `src/lib/validators/query-schemas.ts` (new), ทุก route ใน `src/app/api/v1/`

- [ ] **T-202** แก้ unsafe file I/O — atomic write + corruption recovery
  - `registry-store.ts` lines 20-27: `readStore()` silently ทิ้ง data เมื่อ corruption — ไม่ backup
  - `activity-store.ts` lines 29-45: race condition เมื่อ concurrent read/write — ไม่มี file lock
  - Fix: เขียน temp file → rename (atomic), สร้าง `.bak` ก่อน write, validate JSON on read
  - Files: `src/lib/registry-store.ts`, `src/lib/activity-store.ts`

- [ ] **T-203** เพิ่ม CSRF protection บน state-changing endpoints
  - POST/PUT/DELETE routes (`/api/auth/login`, `/api/auth/logout`, `/api/v1/registries`,
    `/api/v1/.../manifests/...` DELETE) ไม่มี CSRF token
  - Options: Double-submit cookie pattern หรือ custom header check (`X-Requested-With`)
  - Files: `src/middleware.ts`, all POST/PUT/DELETE API routes

- [ ] **T-204** เข้ารหัส registry credentials ด้วย AES-256-GCM แทน plain text/XOR
  - `registry-store.ts` เก็บ credentials เป็น plain text ใน JSON file
  - `stores/registry-store.ts` line 18-26 ใช้ XOR cipher ที่ไม่ปลอดภัย (frequency analysis)
  - ใช้ Node.js `crypto.createCipheriv('aes-256-gcm', ...)` กับ `SESSION_SECRET` derived key
  - Files: `src/lib/registry-store.ts`, `src/stores/registry-store.ts`

- [ ] **T-205** ตรวจสอบ DockerHub JWT token expiration ก่อนใช้
  - `authenticateHubApi()` lines 279-310 ไม่เคย check ว่า JWT expire แล้วหรือยัง
  - Decode JWT payload, check `exp` claim, auto-refresh เมื่อใกล้หมดอายุ
  - Files: `src/lib/providers/dockerhub-provider.ts`

---

### 9.2 Code Quality & DRY — P0

- [ ] **T-210** Extract `encodeRepoPath()` เป็น shared utility
  - Duplicate ใน `use-tags.ts` lines 7-11 และ `use-manifest.ts` lines 7-11
  - ย้ายไป `src/lib/utils.ts` export เป็น `encodeRepoPath(namespace: string, name: string)`
  - Files: `src/lib/utils.ts`, `src/hooks/use-tags.ts`, `src/hooks/use-manifest.ts`

- [ ] **T-211** สร้าง centralized query key factory
  - Query keys สร้าง inline ไม่สม่ำเสมอ — ยากต่อ invalidation
  - สร้าง `src/lib/constants/query-keys.ts`:
    ```
    export const QUERY_KEYS = {
      registries: () => ["registries"],
      repositories: (registryId, params?) => ["repositories", registryId, params],
      tags: (registryId, repo) => ["tags", registryId, repo],
      manifest: (registryId, repo, ref) => ["manifest", registryId, repo, ref],
      namespaces: (registryId) => ["namespaces", registryId],
    }
    ```
  - Update ทุก hook ให้ใช้ QUERY_KEYS
  - Files: `src/lib/constants/query-keys.ts` (new), ทุกไฟล์ใน `src/hooks/`

- [ ] **T-212** สร้าง `assertApiSuccess<T>()` helper แทน manual check
  - การ check `response.success` ไม่สม่ำเสมอ — บางที่ check, บางที่ไม่
  - สร้าง helper ใน `src/lib/error-handling.ts`:
    ```
    export function assertApiSuccess<T>(response: ApiResponse<T>): T {
      if (!response.success) throw new Error(response.error?.message ?? "API request failed")
      return response.data
    }
    ```
  - ใช้ใน hooks และ components ที่ fetch data
  - Files: `src/lib/error-handling.ts`, hooks + components ที่ relevant

- [ ] **T-213** ตัดสินใจ modern-* vs original components — ลบ duplicate
  - มี 6 "modern-*" files ที่ duplicate logic จาก originals (dashboard, stats, activity, chart, registry-list)
  - Decision: migrate สู่ modern version + ลบ originals OR ลบ modern + เพิ่ม animation ใน originals
  - ลด maintenance burden จาก 12 files เหลือ 6
  - Files: `src/app/modern-dashboard-client.tsx`, `src/app/dashboard-client.tsx`,
    `src/components/dashboard/modern-*.tsx`, `src/components/dashboard/*.tsx`

- [ ] **T-214** สร้าง shared `useDebounceFilter` hook
  - Debounce + filter pattern ซ้ำกัน 3 ที่:
    `use-repositories-state.ts` line 26-33, `use-registries-state.ts` line 43-50, `repos-client.tsx` line 26-32
  - Extract เป็น: `useDebounceFilter<T>(items, searchFn, term, delay)`
  - Files: `src/hooks/use-debounce-filter.ts` (new), files ข้างต้น

---

### 9.3 Performance Optimization — P1

- [ ] **T-220** แก้ N+1 query ใน `listNamespaces()` — Generic Provider
  - `generic-provider.ts` lines 46-71: fetch catalog → 1 request ต่อ repo สำหรับ tag count
  - Fix: Group repos by namespace จาก catalog data โดยไม่ต้อง fetch tag count ทีละ repo
  - ใช้ namespace prefix จาก repo name แทน (e.g., `myapp/frontend` → namespace `myapp`)
  - Files: `src/lib/providers/generic-provider.ts`

- [ ] **T-221** Debounce tag prefetch on repo table hover
  - `repo-table.tsx` line 15-27: `onMouseEnter` fire prefetch ทุก hover event
  - Fast mouse movement ข้าม 10 repos = 10 API calls
  - Fix: เพิ่ม 200ms debounce ก่อน prefetch + cleanup on unmount
  - Files: `src/components/repository/repo-table.tsx`

- [ ] **T-222** ปิด parallel query ที่ไม่ใช้ — search vs list
  - `use-repositories-state.ts` lines 49-61: ทั้ง `repositoriesQuery` กับ `searchQuery`
    active พร้อมกัน แต่ใช้แค่อันเดียว
  - Fix: ใช้ `enabled` option — disable list query เมื่อ search active (และกลับกัน)
  - Files: `src/hooks/use-repositories-state.ts`

- [ ] **T-223** Lazy-load dashboard registry stats
  - `use-dashboard-data.ts` lines 39-48: `useQueries` fetch ทุก registry พร้อมกัน
  - 10 registries = 10 concurrent API calls on page load
  - Fix: Fetch stats สำหรับ 3-5 registries แรก, lazy-load ที่เหลือ
  - Files: `src/hooks/use-dashboard-data.ts`

- [ ] **T-224** Memoize layer-list `maxSize` calculation
  - `layer-list.tsx` line 20: `Math.max(...layers.map(...))` recalculate ทุก render
  - Fix: wrap ใน `useMemo` depend on `[layers]`
  - Files: `src/components/manifest/layer-list.tsx`

---

### 9.4 Accessibility (a11y) — P1

- [ ] **T-230** แก้ repo-table ให้ใช้ semantic table markup
  - ปัจจุบันใช้ `<button>` rows แทน `<table>` — WCAG 4.1.3 fail
  - ต้องใช้ `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<td>` + `<caption>`
  - Files: `src/components/repository/repo-table.tsx`

- [ ] **T-231** เพิ่ม aria-labels ให้ interactive elements ทั่ว dashboard
  - Stats cards: trend % visual only ไม่มี aria-label
  - Activity badges: ไม่มี label บอก activity type
  - Copy buttons: ไม่มี aria-pressed / live region feedback
  - Files: `src/components/dashboard/stats-cards.tsx`, `src/components/dashboard/activity-feed.tsx`,
    `src/components/manifest/image-inspector.tsx`

- [ ] **T-232** รองรับ `prefers-reduced-motion`
  - Framer Motion animations ทุกตัว ignore prefers-reduced-motion
  - Fix: check `window.matchMedia("(prefers-reduced-motion: reduce)")` → disable/reduce animations
  - Files: ทุก `modern-*.tsx` components

- [ ] **T-233** เพิ่ม `<label>` ให้ form inputs ที่หายไป
  - Search inputs ใน `repos-client.tsx` ไม่มี associated label (ใช้ `sr-only` class)
  - Registry form inputs need explicit `htmlFor` association
  - Files: `src/app/repos/repos-client.tsx`, `src/components/registry/`

---

### 9.5 Lint & Type Safety — P1

- [ ] **T-240** แก้ 26 ESLint errors ที่ค้างอยู่
  - `activity-context.tsx`: 2 × `no-explicit-any` → ใช้ proper types
  - `use-registries-state.test.ts`: 9 × `no-explicit-any` → ใช้ test-specific types
  - `use-repositories-state.test.ts`: 10 × `no-explicit-any` → ใช้ test-specific types
  - `registry-ui-components.tsx`: 1 × unescaped `'` → use `&apos;`
  - `use-mounted.ts`: 1 × `set-state-in-effect` → refactor to `useSyncExternalStore`
  - Files: ดูรายละเอียดจาก `bun run lint`

- [ ] **T-241** แก้ 14 ESLint warnings ที่ค้างอยู่
  - Unused imports: `useState`/`useEffect` ใน `sidebar.tsx`, `useCallback` ใน `tag-table.tsx`,
    `RegistryConnection` ใน `use-dashboard-data.ts`, `waitFor` ใน test file
  - Unused types: `DockerHubError`, `DockerRegistryTokenResponse` ใน `dockerhub-provider.ts`
  - Files: ดูรายละเอียดจาก `bun run lint`

---

### 9.6 Architecture & Provider Refactoring — P2

- [ ] **T-250** Extract provider factory เป็น `ProviderRegistry` class กับ DI pattern
  - ปัจจุบัน provider selection กระจายตาม API routes
  - Centralize เป็น: `ProviderRegistry.get(connection) → RegistryProvider`
  - Cache provider instances per registry id, invalidate on config change
  - Files: `src/lib/providers/` (new file), ทุก API route ที่สร้าง provider

- [ ] **T-251** ย้าย repository deletion logic จาก API route เข้า provider
  - `repositories/[...name]/route.ts` lines 88-105 มี partial delete ไม่มี rollback
  - ย้าย logic ไป `provider.deleteRepository(name)` — encapsulate retry + rollback
  - Files: `src/app/api/v1/registries/[id]/repositories/[...name]/route.ts`,
    `src/lib/providers/generic-provider.ts`

- [ ] **T-252** สร้าง API route middleware สำหรับ common tasks
  - ทุก route ทำซ้ำ: get registry from store → null check → create provider → error format
  - Extract เป็น `withRegistry(handler)` wrapper ที่ inject `registry` + `provider`
  - Files: `src/lib/api-middleware.ts` (new), ทุก route ใน `src/app/api/v1/`

---

### 9.7 Open-Source DX — P2

- [ ] **T-260** เพิ่ม JSDoc ให้ public functions ของ providers
  - `GenericProvider` (312 LOC), `DockerHubProvider` (220 LOC), `RegistryHttpClient` (280 LOC)
    ไม่มี JSDoc เลย
  - เพิ่ม `@param`, `@returns`, `@throws`, `@example` ให้ทุก public method
  - Files: `src/lib/providers/generic-provider.ts`, `src/lib/providers/dockerhub-provider.ts`,
    `src/lib/registry-client.ts`

- [ ] **T-261** เพิ่ม JSDoc ให้ exported components
  - Components ที่ไม่มี documentation: `RepoCard`, `RepoTable`, `ImageInspector`, `TagTable`
  - เพิ่ม props description + `@example` usage
  - Files: `src/components/repository/`, `src/components/tag/`, `src/components/manifest/`

- [ ] **T-262** สร้าง `components/README.md` — component library guide
  - อธิบาย folder structure + purpose ของแต่ละ category
  - ขั้นตอนการเพิ่ม component ใหม่
  - Naming conventions + pattern guide
  - Files: `src/components/README.md` (new)

- [ ] **T-263** สร้าง `doc/API.md` — API contract documentation
  - Document ทุก endpoint: method, path, params, response shape, error codes
  - Common error codes: 401, 403, 422, 429 + retry strategy
  - Rate limit documentation for Docker Hub
  - Files: `doc/API.md` (new)

- [ ] **T-264** สร้าง `SECURITY.md`
  - Document credential storage model + encryption
  - Responsible disclosure policy
  - Known limitations + security considerations
  - Session management + CSRF protection details
  - Files: `SECURITY.md` (new)

- [ ] **T-265** ลบ dead code — stub functions + unused exports
  - `use-registries-state.ts` line 91-96: `handlePing` stub ไม่เคย implement
  - `stores/registry-store.ts` line 60-64: `clearAll()` ไม่เคยถูกเรียกใช้
  - Unused type exports ใน `dockerhub-provider.ts`
  - Files: files ข้างต้น

- [ ] **T-266** แก้ hardcoded values ใน production code
  - `topbar.tsx` line 77: `username = "Admin User"` → ดึงจาก auth context/session
  - `modern-dashboard-client.tsx` lines 18-21: hardcoded trend data → calculate จาก actual data
  - Files: `src/components/layout/topbar.tsx`, `src/app/modern-dashboard-client.tsx`

---

### 9.8 Testing Coverage — P2

- [ ] **T-270** เพิ่ม unit tests สำหรับ provider factory selection
  - ทดสอบว่า generic vs dockerhub provider ถูกเลือกตาม connection type
  - Files: `src/lib/__tests__/provider-factory.test.ts` (new)

- [ ] **T-271** เพิ่ม tests สำหรับ file I/O edge cases
  - Corrupt JSON recovery, concurrent write race, backup file creation
  - Files: `src/lib/__tests__/registry-store.test.ts`, `src/lib/__tests__/activity-store.test.ts`

- [ ] **T-272** เพิ่ม tests สำหรับ security functions
  - Timing-safe comparison, rate limiter edge cases, bearer token parsing
  - Files: `src/lib/__tests__/security.test.ts` (new)

---

### สรุป Milestone 9 — Overview Table

| ID | Task | Category | Severity | Effort | Good First Issue? |
|----|------|----------|----------|--------|-------------------|
| T-200 | API response format fix | Security | 🔴 CRITICAL | 🟢 30min | ✅ Yes |
| T-201 | Zod validation on query params | Security | 🔴 CRITICAL | 🟡 2hr | ✅ Yes |
| T-202 | Atomic file I/O + recovery | Security | 🔴 CRITICAL | 🟡 1hr | |
| T-203 | CSRF protection | Security | 🔴 CRITICAL | 🟡 1.5hr | |
| T-204 | AES-256-GCM credential encryption | Security | 🔴 CRITICAL | 🟡 2hr | |
| T-205 | DockerHub JWT expiration check | Security | 🟠 HIGH | 🟢 30min | ✅ Yes |
| T-210 | Extract encodeRepoPath | DRY | 🟡 MEDIUM | 🟢 15min | ✅ Yes |
| T-211 | Centralized query key factory | DRY | 🟡 MEDIUM | 🟢 45min | ✅ Yes |
| T-212 | assertApiSuccess helper | DRY | 🟡 MEDIUM | 🟢 30min | ✅ Yes |
| T-213 | Remove modern-* duplicates | DRY | 🟡 MEDIUM | 🟡 1hr | |
| T-214 | Shared useDebounceFilter hook | DRY | 🟡 MEDIUM | 🟢 30min | ✅ Yes |
| T-220 | Fix N+1 in listNamespaces | Perf | 🟠 HIGH | 🟡 1hr | |
| T-221 | Debounce tag prefetch | Perf | 🟡 MEDIUM | 🟢 20min | ✅ Yes |
| T-222 | Disable unused parallel query | Perf | 🟡 MEDIUM | 🟢 15min | ✅ Yes |
| T-223 | Lazy-load dashboard stats | Perf | 🟡 MEDIUM | 🟡 1hr | |
| T-224 | Memoize layer maxSize | Perf | 🟢 LOW | 🟢 5min | ✅ Yes |
| T-230 | Semantic table markup | a11y | 🟠 HIGH | 🟡 1hr | ✅ Yes |
| T-231 | Aria-labels for dashboard | a11y | 🟡 MEDIUM | 🟡 45min | ✅ Yes |
| T-232 | prefers-reduced-motion | a11y | 🟡 MEDIUM | 🟢 30min | ✅ Yes |
| T-233 | Form label associations | a11y | 🟡 MEDIUM | 🟢 20min | ✅ Yes |
| T-240 | Fix 26 ESLint errors | Types | 🟠 HIGH | 🟡 1hr | ✅ Yes |
| T-241 | Fix 14 ESLint warnings | Types | 🟡 MEDIUM | 🟢 30min | ✅ Yes |
| T-250 | ProviderRegistry DI | Arch | 🟡 MEDIUM | 🟡 2hr | |
| T-251 | Move deletion to provider | Arch | 🟡 MEDIUM | 🟡 1hr | |
| T-252 | API route middleware | Arch | 🟡 MEDIUM | 🟡 1.5hr | |
| T-260 | JSDoc for providers | DX | 🟡 MEDIUM | 🟡 2hr | ✅ Yes |
| T-261 | JSDoc for components | DX | 🟡 MEDIUM | 🟡 1.5hr | ✅ Yes |
| T-262 | Components README | DX | 🟡 MEDIUM | 🟢 30min | ✅ Yes |
| T-263 | API contract doc | DX | 🟡 MEDIUM | 🟡 1hr | ✅ Yes |
| T-264 | SECURITY.md | DX | 🟠 HIGH | 🟢 45min | ✅ Yes |
| T-265 | Remove dead code | DX | 🟢 LOW | 🟢 15min | ✅ Yes |
| T-266 | Fix hardcoded values | DX | 🟡 MEDIUM | 🟢 30min | ✅ Yes |
| T-270 | Provider factory tests | Test | 🟡 MEDIUM | 🟢 45min | ✅ Yes |
| T-271 | File I/O edge case tests | Test | 🟡 MEDIUM | 🟡 1hr | |
| T-272 | Security function tests | Test | 🟡 MEDIUM | 🟡 1hr | |
