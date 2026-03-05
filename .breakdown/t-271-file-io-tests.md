# T-271 — Unit Tests: File I/O (Registry Store + Activity Store)

**Epic**: M9 / 9.8 Testing  
**Status**: 🟡 Todo  
**Priority**: P1  
**Severity**: 🟠 HIGH  
**Effort**: ~2 hr  
**Good First Issue**: No

---

## Problem

`src/lib/registry-store.ts` and `src/lib/activity-store.ts` contain file I/O operations (read/write JSON) with no test coverage. These are critical paths — a bug here means lost registry configurations with no warning. After T-202 introduces atomic writes, tests become essential safety net.

---

## Solution

Use Vitest with `tmp` directories to test file operations without touching the real `DATA_DIR`:

```ts
// src/lib/__tests__/registry-store.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtempSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

let tmpDir: string

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "registry-store-test-"))
  process.env.DATA_DIR = tmpDir
})

afterEach(() => {
  rmSync(tmpDir, { recursive: true })
})

describe("saveRegistry()", () => {
  it("writes registry to disk", async () => {
    const registry = { id: "test", url: "https://r.example.com", ... }
    await saveRegistry(registry)
    const loaded = await getRegistry("test")
    expect(loaded).toEqual(registry)
  })

  it("is atomic — partial write does not corrupt existing data", async () => {
    // Write valid registry first
    await saveRegistry(existingRegistry)
    
    // Simulate crash during write by mocking fs.rename to throw
    vi.spyOn(fs, "rename").mockRejectedValueOnce(new Error("ENOSPC"))
    
    // Attempt write of new registry
    await expect(saveRegistry(newRegistry)).rejects.toThrow()
    
    // Old registry should still be readable
    expect(await getRegistry(existingRegistry.id)).toEqual(existingRegistry)
  })
})

describe("getRegistry()", () => {
  it("returns null for non-existent registry", async () => { ... })
  it("recovers from backup on corrupt main file", async () => { ... })
})
```

---

## Files

- `src/lib/__tests__/registry-store.test.ts` — create
- `src/lib/__tests__/activity-store.test.ts` — create

---

## Dependencies

- T-202 (atomic file I/O) — these tests validate T-202's guarantees

---

## Test Cases to Cover

### RegistryStore
- `saveRegistry()` — happy path, idempotent upsert
- `getRegistry(id)` — found, not found
- `listRegistries()` — empty, multiple
- `deleteRegistry(id)` — removes file
- Atomic write — partial write does not corrupt existing data
- Corruption recovery — falls back to `.bak` when main file is invalid JSON

### ActivityStore
- `logActivity()` — appends entry
- Race condition simulation — concurrent writes don't lose entries

---

## Acceptance Criteria

- [ ] Tests use a temp directory — never touch `DATA_DIR` in real filesystem
- [ ] Atomic write guarantee is explicitly tested with simulated crash
- [ ] `bun test` passes all file store tests
- [ ] Cleanup happens in `afterEach` — no leftover tmp files

---

## Notes

The `node:fs/promises` `rename()` is the key operation for atomic writes. Spy on it with Vitest to simulate filesystem failures. Use `mkdtempSync` from `node:os` for a unique temp directory per test run.
