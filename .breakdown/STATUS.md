# Registry Dashboard — Project Kanban

> **Source of truth** for all phases, epics, and tasks.  
> Individual task details → `[task-id]-[name].md` in this directory.  
> Last updated: 2026-03-06

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Done |
| 🔵 | In Progress |
| 🟡 | Todo — ready to start |
| 📋 | Backlog |
| 🔴 | Critical severity |
| 🟠 | High severity |
| 🟡 | Medium severity |
| 🟢 | Low severity |
| 🟢✓ | Good First Issue |

---

## Milestone Status

| Milestone | Title | Status | Tasks |
|-----------|-------|--------|-------|
| M1–M6 | Core Architecture | ✅ Archived | — |
| M7 | Login — Env-based Auth | ✅ Done | T-100→107 |
| M8 | Docker Hub Integration | ✅ Done | T-110→115 |
| M9 | Open-Source Hardening | 🔵 Active | T-200→272 |

---

## M9 — Task Matrix

### 9.1 Security Hardening — P0 CRITICAL

| ID | Task | Status | Effort | Severity | GFI | File |
|----|------|--------|--------|----------|-----|------|
| [T-200](./t-200-api-response-format.md) | API response format fix | 🟡 Todo | 30 min | 🔴 CRITICAL | ✅ | `repositories/[...name]/route.ts` |
| [T-201](./t-201-zod-query-validation.md) | Zod validation on query params | 🟡 Todo | 2 hr | 🔴 CRITICAL | ✅ | All API routes |
| [T-202](./t-202-atomic-file-io.md) | Atomic file I/O + corruption recovery | 🟡 Todo | 1 hr | 🔴 CRITICAL | | `registry-store.ts`, `activity-store.ts` |
| [T-203](./t-203-csrf-protection.md) | CSRF protection | 🟡 Todo | 1.5 hr | 🔴 CRITICAL | | `middleware.ts`, all POST/DELETE routes |
| [T-204](./t-204-credential-encryption.md) | AES-256-GCM credential encryption | 🟡 Todo | 2 hr | 🔴 CRITICAL | | `registry-store.ts`, `stores/registry-store.ts` |
| [T-205](./t-205-jwt-expiration.md) | DockerHub JWT expiration check | 🟡 Todo | 30 min | 🟠 HIGH | ✅ | `dockerhub-provider.ts` |

### 9.2 Code Quality & DRY — P0

| ID | Task | Status | Effort | Severity | GFI | File |
|----|------|--------|--------|----------|-----|------|
| [T-210](./t-210-encode-repo-path.md) | Extract `encodeRepoPath()` | ✅ Done | 15 min | 🟡 MEDIUM | ✅ | `utils.ts` |
| [T-211](./t-211-query-key-factory.md) | Centralized query key factory | ✅ Done | 45 min | 🟡 MEDIUM | ✅ | `constants/query-keys.ts` |
| [T-212](./t-212-assert-api-success.md) | `assertApiSuccess<T>()` helper | ✅ Done | 30 min | 🟡 MEDIUM | ✅ | `error-handling.ts` |
| [T-213](./t-213-modern-components-cleanup.md) | Remove `modern-*` duplicates | 🟡 Todo | 1 hr | 🟡 MEDIUM | | `app/`, `components/dashboard/` |
| [T-214](./t-214-debounce-hook.md) | Shared `useDebounce` hook | 🔵 In Progress | 30 min | 🟡 MEDIUM | ✅ | `hooks/use-debounce.ts` (new) |

### 9.3 Performance Optimization — P1

| ID | Task | Status | Effort | Severity | GFI | File |
|----|------|--------|--------|----------|-----|------|
| [T-220](./t-220-n-plus-one-namespaces.md) | Fix N+1 in `listNamespaces()` | 🟡 Todo | 1 hr | 🟠 HIGH | | `generic-provider.ts` |
| [T-221](./t-221-debounce-hover-prefetch.md) | Debounce tag prefetch on hover | 🟡 Todo | 20 min | 🟡 MEDIUM | ✅ | `repo-table.tsx` |
| [T-222](./t-222-parallel-query-toggle.md) | Disable unused parallel queries | 🟡 Todo | 15 min | 🟡 MEDIUM | ✅ | `use-repositories-state.ts` |
| [T-223](./t-223-lazy-dashboard-stats.md) | Lazy-load dashboard stats | 🟡 Todo | 1 hr | 🟡 MEDIUM | | `use-dashboard-data.ts` |
| [T-224](./t-224-memoize-layer-size.md) | Memoize layer `maxSize` calc | 🟡 Todo | 5 min | 🟢 LOW | ✅ | `layer-list.tsx` |

### 9.4 Accessibility — P1

| ID | Task | Status | Effort | Severity | GFI | File |
|----|------|--------|--------|----------|-----|------|
| [T-230](./t-230-semantic-table.md) | Semantic table markup in `repo-table` | 🟡 Todo | 1 hr | 🟠 HIGH | ✅ | `repo-table.tsx` |
| [T-231](./t-231-aria-labels.md) | Aria-labels for dashboard elements | 🟡 Todo | 45 min | 🟡 MEDIUM | ✅ | `stats-cards.tsx`, `activity-feed.tsx` |
| [T-232](./t-232-reduced-motion.md) | `prefers-reduced-motion` support | 🟡 Todo | 30 min | 🟡 MEDIUM | ✅ | All `modern-*.tsx` |
| [T-233](./t-233-form-labels.md) | Form `<label>` associations | 🟡 Todo | 20 min | 🟡 MEDIUM | ✅ | `repos-client.tsx`, registry forms |

### 9.5 Lint & Type Safety — P1

| ID | Task | Status | Effort | Severity | GFI | File |
|----|------|--------|--------|----------|-----|------|
| [T-240](./t-240-eslint-errors.md) | Fix 26 ESLint errors | ✅ Done | 1 hr | 🟠 HIGH | ✅ | Multiple |
| [T-241](./t-241-eslint-warnings.md) | Fix 14 ESLint warnings | ✅ Done | 30 min | 🟡 MEDIUM | ✅ | Multiple |

### 9.6 Architecture & Provider Refactoring — P2

| ID | Task | Status | Effort | Severity | GFI | File |
|----|------|--------|--------|----------|-----|------|
| [T-250](./t-250-provider-registry.md) | `ProviderRegistry` DI class | 📋 Backlog | 2 hr | 🟡 MEDIUM | | `lib/providers/` |
| [T-251](./t-251-deletion-to-provider.md) | Move deletion logic to provider | 📋 Backlog | 1 hr | 🟡 MEDIUM | | `generic-provider.ts`, route |
| [T-252](./t-252-api-route-middleware.md) | `withRegistry()` route wrapper | 📋 Backlog | 1.5 hr | 🟡 MEDIUM | | `lib/api-middleware.ts` (new) |

### 9.7 Open-Source DX — P2

| ID | Task | Status | Effort | Severity | GFI | File |
|----|------|--------|--------|----------|-----|------|
| [T-260](./t-260-jsdoc-providers.md) | JSDoc for providers | 📋 Backlog | 2 hr | 🟡 MEDIUM | ✅ | Providers + `registry-client.ts` |
| [T-261](./t-261-jsdoc-components.md) | JSDoc for components | 📋 Backlog | 1.5 hr | 🟡 MEDIUM | ✅ | `components/repository/`, `tag/`, `manifest/` |
| [T-262](./t-262-components-readme.md) | `components/README.md` | 📋 Backlog | 30 min | 🟡 MEDIUM | ✅ | `src/components/README.md` (new) |
| [T-263](./t-263-api-contract-doc.md) | `doc/API.md` contract doc | 📋 Backlog | 1 hr | 🟡 MEDIUM | ✅ | `doc/API.md` (new) |
| [T-264](./t-264-security-md.md) | `SECURITY.md` | 📋 Backlog | 45 min | 🟠 HIGH | ✅ | `SECURITY.md` (new) |
| [T-265](./t-265-dead-code.md) | Remove dead code | ✅ Done | 15 min | 🟢 LOW | ✅ | Multiple |
| [T-266](./t-266-hardcoded-values.md) | Fix hardcoded values | 📋 Backlog | 30 min | 🟡 MEDIUM | ✅ | `topbar.tsx`, `modern-dashboard-client.tsx` |

### 9.8 Testing Coverage — P2

| ID | Task | Status | Effort | Severity | GFI | File |
|----|------|--------|--------|----------|-----|------|
| [T-270](./t-270-provider-factory-tests.md) | Provider factory selection tests | 📋 Backlog | 45 min | 🟡 MEDIUM | ✅ | `lib/__tests__/provider-factory.test.ts` (new) |
| [T-271](./t-271-file-io-tests.md) | File I/O edge case tests | 📋 Backlog | 1 hr | 🟡 MEDIUM | | `lib/__tests__/registry-store.test.ts` |
| [T-272](./t-272-security-tests.md) | Security function tests | 📋 Backlog | 1 hr | 🟡 MEDIUM | | `lib/__tests__/security.test.ts` (new) |

---

## Dependency Graph

```
T-202 (atomic I/O) ──────────────────────► T-271 (I/O tests)
T-203 (CSRF) ─────┐
T-204 (encryption) ┤──────────────────────► T-264 (SECURITY.md)
                   └──────────────────────► T-272 (security tests)
T-200 (API format) ─┐
T-201 (Zod params)  ┤──────────────────────► T-252 (route middleware)
                    └──────────────────────► T-263 (API doc)
T-250 (ProviderRegistry) ─────────────────► T-251 (deletion to provider)
T-250 (ProviderRegistry) ─────────────────► T-270 (provider factory tests)
```

---

## Sprint Recommendation

### Sprint 1 — Security First (Week 1)
Pick any of: **T-200, T-201, T-202, T-203, T-204, T-205**  
These are independent — multiple contributors can work in parallel.

### Sprint 2 — Quality & UX (Week 2)
**T-213, T-220, T-221, T-222, T-223** — Performance & DRY cleanup  
**T-230, T-231, T-232, T-233** — Accessibility pass

### Sprint 3 — Architecture & Polish (Week 3)
**T-250 → T-251 → T-252** — Provider refactoring (in order)  
**T-260, T-261, T-262, T-263, T-264** — Documentation  
**T-270, T-271, T-272** — Testing coverage

---

## Quick Stats

| Category | Total | Done | In Progress | Todo | Backlog |
|----------|-------|------|-------------|------|---------|
| Security | 6 | 0 | 0 | 6 | 0 |
| Code Quality | 5 | 3 | 1 | 1 | 0 |
| Performance | 5 | 0 | 0 | 5 | 0 |
| Accessibility | 4 | 0 | 0 | 4 | 0 |
| Lint/Types | 2 | 2 | 0 | 0 | 0 |
| Architecture | 3 | 0 | 0 | 0 | 3 |
| DX/Docs | 7 | 1 | 0 | 0 | 6 |
| Testing | 3 | 0 | 0 | 0 | 3 |
| **Total** | **35** | **6** | **1** | **16** | **12** |
