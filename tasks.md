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
