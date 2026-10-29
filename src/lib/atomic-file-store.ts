import { randomUUID } from "crypto"
import fs from "fs"
import path from "path"

type ReadParseResult<T> =
  | { success: true; data: T }
  | { success: false; reason: "missing" | "io" | "parse" }

export class AtomicJsonStore<T> {
  private readonly getPath: () => string
  private readonly fallback: () => T
  private readonly loggerTag: string

  constructor(
    pathOrGetter: string | (() => string),
    fallback: () => T,
    loggerTag = "[atomic-json-store]",
  ) {
    this.getPath = typeof pathOrGetter === "function" ? pathOrGetter : () => pathOrGetter
    this.fallback = fallback
    this.loggerTag = loggerTag
  }

  /**
   * Resolves the current target file path.
   */
  getFilePath(): string {
    return this.getPath()
  }

  /**
   * Reads and parses JSON safely.
   * If the primary file is missing or contains invalid JSON, attempts recovery from .bak.
   * Falls back to fallback() if recovery is impossible.
   */
  read(): T {
    const filePath = this.getPath()
    const primaryResult = this.tryReadAndParse(filePath)
    if (primaryResult.success) {
      return primaryResult.data
    }

    // Attempt recovery from backup file (.bak)
    const bakPath = `${filePath}.bak`
    const bakResult = this.tryReadAndParse(bakPath)
    if (bakResult.success) {
      console.warn(`${this.loggerTag} Recovered valid state from backup file: ${bakPath}`)
      return bakResult.data
    }

    // Log corruption error only if at least one file had invalid JSON or I/O failure
    if (primaryResult.reason === "parse" || bakResult.reason === "parse") {
      console.error(`${this.loggerTag} Failed to parse store, starting fresh`)
    }

    return this.fallback()
  }

  /**
   * Performs an atomic POSIX write:
   * 1. Ensures parent directory exists.
   * 2. Writes new content to unique <filePath>.<uuid>.tmp.
   * 3. Backs up current <filePath> to <filePath>.bak if it already exists.
   * 4. Renames <filePath>.<uuid>.tmp to <filePath> (POSIX atomic rename).
   * 5. Cleans up temporary file if write fails.
   */
  write(data: T): void {
    const filePath = this.getPath()
    const dir = path.dirname(filePath)
    fs.mkdirSync(dir, { recursive: true })

    const content = JSON.stringify(data, null, 2)
    const tmpPath = `${filePath}.${randomUUID()}.tmp`

    try {
      fs.writeFileSync(tmpPath, content, "utf-8")

      if (fs.existsSync(filePath)) {
        fs.copyFileSync(filePath, `${filePath}.bak`)
      }

      fs.renameSync(tmpPath, filePath)
    } catch (err) {
      try {
        if (fs.existsSync(tmpPath)) {
          fs.unlinkSync(tmpPath)
        }
      } catch {
        // Ignore cleanup errors
      }
      throw err
    }
  }

  private tryReadAndParse(targetPath: string): ReadParseResult<T> {
    try {
      if (!fs.existsSync(targetPath)) {
        return { success: false, reason: "missing" }
      }
      const raw = fs.readFileSync(targetPath, "utf-8")
      const parsed = JSON.parse(raw) as T
      return { success: true, data: parsed }
    } catch (err) {
      if (err instanceof SyntaxError) {
        return { success: false, reason: "parse" }
      }
      return { success: false, reason: "io" }
    }
  }
}

