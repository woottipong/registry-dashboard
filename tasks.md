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

## Milestones 1–5: ✅ Complete — see `CHANGELOG.md`

---

## Milestone 6: Performance & Quality

> Goal: ลด latency จริงของ UI, ลด waterfall requests, ปรับ UX ให้ responsive ทันที
> วิเคราะห์จาก codebase จริง — เรียงตาม impact สูงสุดก่อน

---

### 6.1 Critical: ลด N+1 API Waterfall — P0

**ปัญหา (root cause)**

`listRepositories()` ทำ waterfall requests แบบนี้ต่อทุก repo:
```
GET /v2/_catalog               → ได้ 5 repo names
GET /v2/apps/frontend/tags/list  → N request
GET /v2/apps/frontend/manifests/tag0  → N×M request
GET /v2/apps/frontend/blobs/{digest} → N×M request (config)
```
10 repos × 1 tag = **31 HTTP requests** ก่อนหน้าจะ render

`listTags()` เช่นกัน — 3 tags = 7 requests waterfall

- [x] **T-086** แยก `lastUpdated` ออกจาก `listRepositories` — ไม่ fetch manifest ใน catalog loop
  - คืนแค่ `{ name, fullName, namespace, tagCount }` — ไม่ fetch manifest/config
  - `lastUpdated` เป็น optional — แสดง "—" ถ้าไม่มี
  - ลด requests จาก 1+(N×3) → 1+N
  - Files: `src/lib/providers/generic-provider.ts`

- [x] **T-087** Parallel batch fetch ใน `listTags`
  - manifest fetch และ config fetch เป็น 2 batch parallel rounds แทน sequential per tag
  - Files: `src/lib/providers/generic-provider.ts`

- [x] **T-088** Cache digest resolution — `resolveDigest()` in-memory TTL cache
  - Map `repo:ref → digest` TTL 5 นาที
  - ลด HEAD requests ซ้ำจาก `listRepositories` + `listTags`
  - Files: `src/lib/providers/generic-provider.ts`

---

### 6.2 High: React Query Stale Time — P0

**ปัญหา**: `staleTime: 0` + `refetchOnWindowFocus: true` → refetch ทุก tab switch

- [x] **T-089** ปรับ staleTime ต่อ query type
  - Registries: `30s` | Repositories: `60s` | Tags: `30s` | Manifests/blobs: `10m`
  - `refetchOnWindowFocus: false` สำหรับ manifests/blobs
  - Files: `src/lib/query-client.ts`, `src/hooks/use-repositories.ts`, `src/hooks/use-tags.ts`

---

### 6.3 High: Dashboard N+1 — P1

**ปัญหา**: Dashboard รอ `listRepositories` (N+1 requests) ก่อน render stats

- [x] **T-090** Dashboard render registries count ทันที — repos load async แยก
  - Files: `src/app/page.tsx`, `src/components/dashboard/stats-cards.tsx`

- [x] **T-091** Top Repos chart share data กับ repos query แทน fetch ใหม่
  - Files: `src/app/page.tsx`

---

### 6.4 Medium: API Route Caching — P1

- [x] **T-092** HTTP response cache headers บน read-only endpoints
  - `GET /repositories` → `Cache-Control: s-maxage=30, stale-while-revalidate=60`
  - `GET /manifests/:ref` → `Cache-Control: s-maxage=600`
  - Files: repositories route, manifests route

- [x] **T-093** Fix `total` count ใน repositories API response
  - ปัจจุบัน `total = items.length` หลัง filter — pagination ผิด
  - Files: `src/app/api/v1/registries/[id]/repositories/route.ts`

---

### 6.5 Medium: UX Perceived Performance — P1

- [ ] **T-094** Streaming repositories — แสดง repo names ก่อน metadata load ทีหลัง
  - Effort สูง — ทำหลัง T-086/T-087
  - Files: `src/lib/providers/generic-provider.ts`, `src/app/repos/page.tsx`

- [x] **T-095** Prefetch tags on hover repo card/row
  - `onMouseEnter` → `queryClient.prefetchQuery(["tags", registryId, repo.fullName])`
  - Files: `src/components/repository/repo-card.tsx`, `src/components/repository/repo-table.tsx`

---

### 6.6 Low: Bundle & Cleanup — P2

- [x] **T-096** Bundle analyzer — ตรวจ Recharts lazy load ถูกต้อง
  - Recharts อยู่ใน `top-repos-chart.tsx` เท่านั้น และ lazy load ผ่าน `dynamic()` แล้วใน `page.tsx`
  - Files: `src/components/dashboard/*`

- [x] **T-097** ลบ unused shadcn components (`Separator` ฯลฯ)
  - `separator.tsx` ถูกใช้โดย shadcn primitives (command, dropdown-menu, select) — ไม่มีที่ลบได้
  - Files: various

---

### สรุป Impact vs Effort

| Task | Impact | Effort | ทำก่อน? |
|------|--------|--------|---------|
| T-086 ลด catalog waterfall | 🔴 สูงมาก | 🟡 กลาง | ✅ |
| T-087 parallel tag fetch | 🔴 สูงมาก | 🟢 ต่ำ | ✅ |
| T-088 cache digest | 🟠 สูง | 🟢 ต่ำ | ✅ |
| T-089 staleTime | 🟠 สูง | 🟢 ต่ำ | ✅ |
| T-092 HTTP cache headers | 🟡 กลาง | 🟢 ต่ำ | ✅ |
| T-095 prefetch on hover | 🟡 กลาง | 🟢 ต่ำ | ✅ |
| T-090 dashboard async | 🟡 กลาง | 🟡 กลาง | 🔜 |
| T-094 streaming repos | 🟠 สูง | 🔴 สูง | 🔜 |
| T-096 bundle size | 🟢 ต่ำ | 🟡 กลาง | ⏳ |

---

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
