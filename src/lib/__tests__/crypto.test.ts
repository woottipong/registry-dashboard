import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/config", () => ({
  config: {
    SESSION_SECRET: "test-session-secret-32-chars-min!",
    DATA_DIR: "/tmp",
    APP_USERNAME: "admin",
    APP_PASSWORD: "password",
  },
}))

import { encryptCredential, decryptCredential } from "@/lib/crypto"

describe("encryptCredential()", () => {
  it("returns a string in iv:tag:ciphertext format", () => {
    const result = encryptCredential("my-password")
    const parts = result.split(":")
    expect(parts).toHaveLength(3)
    // Each part should be a non-empty hex string
    expect(parts[0]).toMatch(/^[0-9a-f]+$/)
    expect(parts[1]).toMatch(/^[0-9a-f]+$/)
    expect(parts[2]).toMatch(/^[0-9a-f]+$/)
  })

  it("produces different ciphertext each call (random IV)", () => {
    const a = encryptCredential("same-password")
    const b = encryptCredential("same-password")
    expect(a).not.toBe(b)
  })

  it("handles empty string", () => {
    expect(() => encryptCredential("")).not.toThrow()
    const result = encryptCredential("")
    expect(result.split(":")).toHaveLength(3)
  })

  it("handles unicode characters", () => {
    expect(() => encryptCredential("pässwörد🔑")).not.toThrow()
  })
})

describe("decryptCredential()", () => {
  it("round-trips a simple password", () => {
    const plain = "s3cr3t-p4ssw0rd"
    const cipher = encryptCredential(plain)
    expect(decryptCredential(cipher)).toBe(plain)
  })

  it("round-trips empty string", () => {
    const cipher = encryptCredential("")
    expect(decryptCredential(cipher)).toBe("")
  })

  it("round-trips unicode string", () => {
    const plain = "pässwörд🔑"
    const cipher = encryptCredential(plain)
    expect(decryptCredential(cipher)).toBe(plain)
  })

  it("round-trips a long string", () => {
    const plain = "a".repeat(4096)
    const cipher = encryptCredential(plain)
    expect(decryptCredential(cipher)).toBe(plain)
  })

  it("migration path — returns plaintext as-is when not in iv:tag:cipher format", () => {
    // Simulate a credential stored before encryption was introduced
    expect(decryptCredential("plain-token-no-colons")).toBe("plain-token-no-colons")
  })

  it("migration: value with only 1 colon is treated as plaintext", () => {
    expect(decryptCredential("http://example.com")).toBe("http://example.com")
  })

  it("throws on tampered ciphertext (GCM auth tag verification fails)", () => {
    const cipher = encryptCredential("legitimate-value")
    // Corrupt the last 4 hex chars of the ciphertext (third segment)
    const parts = cipher.split(":")
    parts[2] = parts[2].slice(0, -4) + "ffff"
    const tampered = parts.join(":")

    expect(() => decryptCredential(tampered)).toThrow()
  })

  it("throws when the auth tag is zeroed out", () => {
    const cipher = encryptCredential("test-value")
    const parts = cipher.split(":")
    // Zero out the auth tag (second segment)
    parts[1] = "0".repeat(parts[1].length)
    const tampered = parts.join(":")

    expect(() => decryptCredential(tampered)).toThrow()
  })
})
