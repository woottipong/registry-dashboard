import { describe, it, expect } from "vitest"
import { formatBytes, formatDate, truncateDigest, generatePullCommand } from "@/lib/format"

describe("formatBytes", () => {
  it("returns '0 B' for zero", () => {
    expect(formatBytes(0)).toBe("0 B")
  })

  it("formats bytes", () => {
    expect(formatBytes(512)).toBe("512 B")
  })

  it("formats kilobytes", () => {
    expect(formatBytes(1024)).toBe("1.0 KB")
  })

  it("formats megabytes", () => {
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB")
  })

  it("formats gigabytes", () => {
    expect(formatBytes(1024 ** 3)).toBe("1.0 GB")
  })

  it("caps at TB", () => {
    expect(formatBytes(1024 ** 4)).toBe("1.0 TB")
  })

  it("rounds values >= 100", () => {
    expect(formatBytes(100 * 1024)).toBe("100 KB")
  })

  it("throws for negative numbers", () => {
    expect(() => formatBytes(-1)).toThrow()
  })

  it("throws for non-finite numbers", () => {
    expect(() => formatBytes(Infinity)).toThrow()
    expect(() => formatBytes(NaN)).toThrow()
  })
})

describe("formatDate", () => {
  it("returns a relative time string", () => {
    const past = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const result = formatDate(past)
    expect(result).toContain("ago")
  })

  it("throws for invalid date strings", () => {
    expect(() => formatDate("not-a-date")).toThrow()
  })

  it("accepts Date objects", () => {
    const d = new Date(Date.now() - 2 * 60 * 1000)
    const result = formatDate(d)
    expect(result).toContain("ago")
  })

  it("accepts timestamps (numbers)", () => {
    const ts = Date.now() - 30 * 1000
    const result = formatDate(ts)
    expect(result).toContain("ago")
  })
})

describe("truncateDigest", () => {
  const digest = "sha256:abc123def456789012345678"

  it("returns algorithm:prefix... for long hash", () => {
    expect(truncateDigest(digest, 4)).toBe("sha256:abc1...")
  })

  it("returns full digest when hash is short enough", () => {
    const short = "sha256:abcd"
    expect(truncateDigest(short, 4)).toBe("sha256:abcd")
  })

  it("returns original string for malformed digest (no colon)", () => {
    expect(truncateDigest("nocoilonhere", 4)).toBe("nocoilonhere")
  })

  it("respects custom keep length", () => {
    expect(truncateDigest(digest, 8)).toBe("sha256:abc123de...")
  })
})

describe("generatePullCommand", () => {
  it("generates pull with tag", () => {
    expect(generatePullCommand({ repository: "nginx", tag: "latest" })).toBe(
      "docker pull nginx:latest",
    )
  })

  it("defaults to latest tag when none provided", () => {
    expect(generatePullCommand({ repository: "nginx" })).toBe("docker pull nginx:latest")
  })

  it("includes registry prefix when provided", () => {
    expect(generatePullCommand({ registry: "registry.example.com", repository: "nginx", tag: "1.25" })).toBe(
      "docker pull registry.example.com/nginx:1.25",
    )
  })

  it("uses digest when provided (ignores tag)", () => {
    const digest = "sha256:abc123"
    expect(
      generatePullCommand({ repository: "nginx", digest }),
    ).toBe(`docker pull nginx@${digest}`)
  })

  it("throws when repository is empty", () => {
    expect(() => generatePullCommand({ repository: "" })).toThrow()
  })
})
