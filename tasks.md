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

## Milestones 1–8: ✅ Complete — see `CHANGELOG.md`

---

## Milestone 9: Open-Source Hardening — Performance, Security & DX

> **Goal**: ปรับ codebase ให้พร้อมเปิด open-source — แก้ security issues, ปรับ performance,  
> ลด code duplication, เพิ่ม accessibility, และทำให้ contributor experience ดี  
> จัดเรียงตาม severity — CRITICAL → HIGH → MEDIUM → LOW  
> แต่ละ task เป็นอิสระ สามารถทำขนานกันได้โดย contributor หลายคน

---

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
| T-213 | Remove modern-* duplicates | DRY | 🟡 MEDIUM | 🟡 1hr | |
| T-220 | Fix N+1 in listNamespaces | Perf | 🟠 HIGH | 🟡 1hr | |
| T-221 | Debounce tag prefetch | Perf | 🟡 MEDIUM | 🟢 20min | ✅ Yes |
| T-222 | Disable unused parallel query | Perf | 🟡 MEDIUM | 🟢 15min | ✅ Yes |
| T-223 | Lazy-load dashboard stats | Perf | 🟡 MEDIUM | 🟡 1hr | |
| T-224 | Memoize layer maxSize | Perf | 🟢 LOW | 🟢 5min | ✅ Yes |
| T-230 | Semantic table markup | a11y | 🟠 HIGH | 🟡 1hr | ✅ Yes |
| T-231 | Aria-labels for dashboard | a11y | 🟡 MEDIUM | 🟡 45min | ✅ Yes |
| T-232 | prefers-reduced-motion | a11y | 🟡 MEDIUM | 🟢 30min | ✅ Yes |
| T-233 | Form label associations | a11y | 🟡 MEDIUM | 🟢 20min | ✅ Yes |
| T-250 | ProviderRegistry DI | Arch | 🟡 MEDIUM | 🟡 2hr | |
| T-251 | Move deletion to provider | Arch | 🟡 MEDIUM | 🟡 1hr | |
| T-252 | API route middleware | Arch | 🟡 MEDIUM | 🟡 1.5hr | |
| T-260 | JSDoc for providers | DX | 🟡 MEDIUM | 🟡 2hr | ✅ Yes |
| T-261 | JSDoc for components | DX | 🟡 MEDIUM | 🟡 1.5hr | ✅ Yes |
| T-262 | Components README | DX | 🟡 MEDIUM | 🟢 30min | ✅ Yes |
| T-263 | API contract doc | DX | 🟡 MEDIUM | 🟡 1hr | ✅ Yes |
| T-264 | SECURITY.md | DX | 🟠 HIGH | 🟢 45min | ✅ Yes |
| T-266 | Fix hardcoded values | DX | 🟡 MEDIUM | 🟢 30min | ✅ Yes |
| T-270 | Provider factory tests | Test | 🟡 MEDIUM | 🟢 45min | ✅ Yes |
| T-271 | File I/O edge case tests | Test | 🟡 MEDIUM | 🟡 1hr | |
| T-272 | Security function tests | Test | 🟡 MEDIUM | 🟡 1hr | |
