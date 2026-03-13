import { describe, it, expect, vi, afterEach } from "vitest"
import {
  ERROR_CODES,
  createAppError,
  normalizeError,
  isAppError,
  getUserFriendlyMessage,
  assertApiSuccess,
} from "@/lib/error-handling"
import type { AppError } from "@/lib/error-handling"

// ── createAppError ────────────────────────────────────────────────────────────

describe("createAppError", () => {
  it("creates an AppError with correct code and message", () => {
    const error = createAppError("REGISTRY_NOT_FOUND")
    expect(error.code).toBe("REGISTRY_NOT_FOUND")
    expect(error.message).toBe(ERROR_CODES.REGISTRY_NOT_FOUND)
  })

  it("includes details when provided", () => {
    const error = createAppError("NETWORK_ERROR", "connection refused")
    expect(error.details).toBe("connection refused")
  })

  it("includes statusCode when provided", () => {
    const error = createAppError("REGISTRY_AUTH_FAILED", undefined, 401)
    expect(error.statusCode).toBe(401)
  })

  it("sets userMessage from getUserFriendlyMessage", () => {
    const error = createAppError("REGISTRY_AUTH_FAILED")
    expect(error.userMessage).toContain("credentials")
  })
})

// ── normalizeError ────────────────────────────────────────────────────────────

describe("normalizeError", () => {
  it("returns AppError as-is when already an AppError", () => {
    const appError: AppError = {
      code: "UNKNOWN_ERROR",
      message: "test",
    }
    const result = normalizeError(appError)
    expect(result).toBe(appError)
  })

  it("converts a regular Error to AppError", () => {
    const result = normalizeError(new Error("something went wrong"))
    expect(result.code).toBe("UNKNOWN_ERROR")
    expect(result.details).toBe("something went wrong")
  })

  it("converts a string to AppError", () => {
    const result = normalizeError("oops")
    expect(result.code).toBe("UNKNOWN_ERROR")
    expect(result.details).toBe("oops")
  })

  it("converts null to AppError", () => {
    const result = normalizeError(null)
    expect(result.code).toBe("UNKNOWN_ERROR")
  })
})

// ── isAppError ────────────────────────────────────────────────────────────────

describe("isAppError", () => {
  it("returns true for a valid AppError", () => {
    const appError: AppError = { code: "UNKNOWN_ERROR", message: "test" }
    expect(isAppError(appError)).toBe(true)
  })

  it("returns false for a plain Error", () => {
    expect(isAppError(new Error("nope"))).toBe(false)
  })

  it("returns false for null", () => {
    expect(isAppError(null)).toBe(false)
  })

  it("returns false for a string", () => {
    expect(isAppError("error string")).toBe(false)
  })

  it("returns false for object missing message", () => {
    expect(isAppError({ code: "UNKNOWN_ERROR" })).toBe(false)
  })
})

// ── getUserFriendlyMessage ────────────────────────────────────────────────────

describe("getUserFriendlyMessage", () => {
  it("returns auth-specific message for REGISTRY_AUTH_FAILED", () => {
    const msg = getUserFriendlyMessage("REGISTRY_AUTH_FAILED")
    expect(msg).toContain("credentials")
  })

  it("returns network-specific message for NETWORK_ERROR", () => {
    const msg = getUserFriendlyMessage("NETWORK_ERROR")
    expect(msg).toContain("connection")
  })

  it("returns timeout-specific message for TIMEOUT_ERROR", () => {
    const msg = getUserFriendlyMessage("TIMEOUT_ERROR")
    expect(msg).toContain("too long")
  })

  it("returns service unavailable message for SERVICE_UNAVAILABLE", () => {
    const msg = getUserFriendlyMessage("SERVICE_UNAVAILABLE")
    expect(msg).toContain("temporarily unavailable")
  })

  it("includes details in default case", () => {
    const msg = getUserFriendlyMessage("UNKNOWN_ERROR", "extra detail")
    expect(msg).toContain("extra detail")
  })

  it("returns base message when no details for default case", () => {
    const msg = getUserFriendlyMessage("UNKNOWN_ERROR")
    expect(msg).toBe(ERROR_CODES.UNKNOWN_ERROR)
  })
})

// ── assertApiSuccess ──────────────────────────────────────────────────────────

describe("assertApiSuccess", () => {
  it("returns data when response is ok and success is true", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ success: true, data: { id: "1" }, error: null }),
    } as unknown as Response

    const result = await assertApiSuccess<{ id: string }>(mockResponse)
    expect(result).toEqual({ id: "1" })
  })

  it("throws when response is not ok", async () => {
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({ success: false, data: null, error: { message: "Not found" } }),
    } as unknown as Response

    await expect(assertApiSuccess(mockResponse)).rejects.toThrow("Not found")
  })

  it("throws when success is false", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ success: false, data: null, error: { message: "Forbidden" } }),
    } as unknown as Response

    await expect(assertApiSuccess(mockResponse)).rejects.toThrow("Forbidden")
  })

  it("returns null when data is null but success is true", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ success: true, data: null, error: null }),
    } as unknown as Response

    const result = await assertApiSuccess<null>(mockResponse)
    expect(result).toBeNull()
  })

  it("throws generic message when no error message provided", async () => {
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({ success: false, data: null, error: null }),
    } as unknown as Response

    await expect(assertApiSuccess(mockResponse)).rejects.toThrow("Request failed")
  })
})
