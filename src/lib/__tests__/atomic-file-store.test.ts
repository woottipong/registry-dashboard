import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import fs, { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { AtomicJsonStore } from "../atomic-file-store"

describe("AtomicJsonStore", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "atomic-store-test-"))
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  it("returns fallback value when file does not exist", () => {
    const filePath = join(tmpDir, "missing.json")
    const store = new AtomicJsonStore<string[]>(filePath, () => ["default"])

    expect(store.read()).toEqual(["default"])
  })

  it("writes data atomically and reads it back", () => {
    const filePath = join(tmpDir, "sub", "store.json")
    const store = new AtomicJsonStore<{ count: number }>(filePath, () => ({ count: 0 }))

    store.write({ count: 42 })

    expect(existsSync(filePath)).toBe(true)
    expect(store.read()).toEqual({ count: 42 })
  })

  it("creates a .bak file on subsequent writes", () => {
    const filePath = join(tmpDir, "store.json")
    const bakPath = `${filePath}.bak`
    const store = new AtomicJsonStore<string[]>(filePath, () => [])

    store.write(["first"])
    expect(existsSync(bakPath)).toBe(false)

    store.write(["second"])
    expect(existsSync(bakPath)).toBe(true)
    expect(JSON.parse(readFileSync(bakPath, "utf-8"))).toEqual(["first"])
    expect(JSON.parse(readFileSync(filePath, "utf-8"))).toEqual(["second"])
  })

  it("recovers from .bak file when primary file is corrupt JSON", () => {
    const filePath = join(tmpDir, "store.json")
    const store = new AtomicJsonStore<{ valid: boolean }>(filePath, () => ({ valid: false }), "[test-tag]")

    store.write({ valid: true })
    store.write({ valid: true }) // creates .bak with { valid: true }

    // Corrupt primary file
    writeFileSync(filePath, "INVALID_JSON_CONTENT{{{", "utf-8")

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    const result = store.read()

    expect(result).toEqual({ valid: true })
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Recovered valid state from backup file"))
  })

  it("returns fallback and logs error when both primary and .bak are corrupt", () => {
    const filePath = join(tmpDir, "store.json")
    const store = new AtomicJsonStore<string[]>(filePath, () => ["fallback"], "[test-tag]")

    writeFileSync(filePath, "NOT_JSON", "utf-8")
    writeFileSync(`${filePath}.bak`, "ALSO_NOT_JSON", "utf-8")

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const result = store.read()

    expect(result).toEqual(["fallback"])
    expect(errorSpy).toHaveBeenCalledWith("[test-tag] Failed to parse store, starting fresh")
  })

  it("supports dynamic getter for file path", () => {
    let currentDir = tmpDir
    const store = new AtomicJsonStore<number[]>(() => join(currentDir, "dynamic.json"), () => [])

    store.write([1, 2, 3])
    expect(store.read()).toEqual([1, 2, 3])

    // Move to another directory
    const newDir = mkdtempSync(join(tmpdir(), "atomic-store-test-2-"))
    currentDir = newDir
    expect(store.read()).toEqual([])

    store.write([99])
    expect(store.read()).toEqual([99])
    rmSync(newDir, { recursive: true, force: true })
  })

  it("cleans up temporary file if write throws an error", () => {
    const filePath = join(tmpDir, "error-store.json")
    const store = new AtomicJsonStore<string[]>(filePath, () => [])

    const renameSpy = vi.spyOn(fs, "renameSync").mockImplementation(() => {
      throw new Error("Disk error simulation")
    })

    expect(() => store.write(["test"])).toThrow("Disk error simulation")

    // Ensure no .tmp file left over in directory
    const files = readdirSync(tmpDir)
    expect(files.filter((f) => f.endsWith(".tmp"))).toHaveLength(0)

    renameSpy.mockRestore()
  })
})

