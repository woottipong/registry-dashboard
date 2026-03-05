# T-202 — Atomic File I/O + Corruption Recovery

**Epic**: M9 / 9.1 Security Hardening  
**Status**: 🟡 Todo  
**Priority**: P0  
**Severity**: 🔴 CRITICAL  
**Effort**: ~1 hr  
**Good First Issue**: No

---

## Problem

### `registry-store.ts` — Silent data loss on corruption

```ts
// ❌ Current: silently returns empty array on any parse error
try {
  return JSON.parse(fs.readFileSync(storePath, "utf8"))
} catch {
  return []   // ← Registry configs silently wiped on corruption
}
```

### `activity-store.ts` — Race condition on concurrent write

```ts
// ❌ Current: two concurrent writes can corrupt the file
const data = JSON.parse(fs.readFileSync(path))
data.push(newItem)
fs.writeFileSync(path, JSON.stringify(data))  // ← non-atomic
```

---

## Solution

### Atomic write pattern (write-to-temp → rename)

```ts
import { writeFileSync, renameSync, cpSync, existsSync } from "fs"
import { join } from "path"

function atomicWrite(filePath: string, data: unknown): void {
  const tmp = filePath + ".tmp"
  const bak = filePath + ".bak"
  writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8")
  if (existsSync(filePath)) cpSync(filePath, bak)  // backup before overwrite
  renameSync(tmp, filePath)                          // atomic rename
}
```

### Corruption recovery pattern

```ts
function safeRead<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as T
  } catch {
    const bak = filePath + ".bak"
    if (existsSync(bak)) {
      try { return JSON.parse(readFileSync(bak, "utf8")) as T } catch {}
    }
    return fallback  // only if both main and backup corrupt
  }
}
```

---

## Files

- `src/lib/registry-store.ts` — apply `atomicWrite` + `safeRead`
- `src/lib/activity-store.ts` — apply `atomicWrite` + `safeRead`

---

## Dependencies

- None

---

## Acceptance Criteria

- [ ] Write uses temp → rename pattern (never overwrites directly)
- [ ] Backup file (`.bak`) created before every overwrite
- [ ] Corruption recovery attempts `.bak` before returning empty fallback
- [ ] `bun run typecheck` passes
- [ ] Unit tests in `src/lib/__tests__/registry-store.test.ts` cover corrupt + concurrent scenarios (see T-271)

---

## Notes

`rename()` is atomic on POSIX filesystems when source and destination are on the same volume (`DATA_DIR`). Windows filesystem does not guarantee atomic rename — document this limitation in `SECURITY.md` (T-264). The `.bak` file approach trades disk space for data safety.
