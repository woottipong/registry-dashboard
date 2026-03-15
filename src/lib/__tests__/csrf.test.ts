import { describe, it, expect, vi } from "vitest"
import { NextRequest } from "next/server"

// Must mock config before any module that imports it (session, middleware chain)
vi.mock("@/lib/config", () => ({
  config: {
    SESSION_SECRET: "test-session-secret-32-chars-min!",
    DATA_DIR: "/tmp",
    APP_USERNAME: "admin",
    APP_PASSWORD: "password",
  },
}))

// Mock iron-session so the middleware can run without a real session cookie
vi.mock("@/lib/session", () => ({
  getSession: vi.fn().mockResolvedValue({ user: { username: "admin" }, save: vi.fn() }),
}))

import middleware from "@/middleware"
// Static import picks up the mock — avoids loading real session/config via dynamic import
import { getSession } from "@/lib/session"

function makeRequest(
  url: string,
  method: string,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest(url, { method, headers })
}

describe("CSRF protection", () => {
  describe("mutating API endpoints (POST/PUT/DELETE/PATCH)", () => {
    it("blocks POST without X-Requested-With header → 403", async () => {
      const req = makeRequest("http://localhost/api/v1/registries", "POST")
      const res = await middleware(req)

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error.code).toBe("FORBIDDEN")
    })

    it("blocks DELETE without X-Requested-With header → 403", async () => {
      const req = makeRequest("http://localhost/api/v1/registries/abc", "DELETE")
      const res = await middleware(req)

      expect(res.status).toBe(403)
    })

    it("blocks PUT without X-Requested-With header → 403", async () => {
      const req = makeRequest("http://localhost/api/v1/registries/abc", "PUT")
      const res = await middleware(req)

      expect(res.status).toBe(403)
    })

    it("allows POST with X-Requested-With: XMLHttpRequest → passes CSRF", async () => {
      const req = makeRequest("http://localhost/api/v1/registries", "POST", {
        "X-Requested-With": "XMLHttpRequest",
      })
      const res = await middleware(req)

      // Passes CSRF (200 or redirect — NOT 403)
      expect(res.status).not.toBe(403)
    })

    it("blocks POST with wrong X-Requested-With value → 403", async () => {
      const req = makeRequest("http://localhost/api/v1/registries", "POST", {
        "X-Requested-With": "fetch",
      })
      const res = await middleware(req)

      expect(res.status).toBe(403)
    })
  })

  describe("safe methods are exempt from CSRF check", () => {
    it("GET requests pass without X-Requested-With", async () => {
      const req = makeRequest("http://localhost/api/v1/registries", "GET")
      const res = await middleware(req)

      expect(res.status).not.toBe(403)
    })

    it("HEAD requests pass without X-Requested-With", async () => {
      const req = makeRequest("http://localhost/api/v1/registries", "HEAD")
      const res = await middleware(req)

      expect(res.status).not.toBe(403)
    })

    it("OPTIONS requests pass without X-Requested-With", async () => {
      const req = makeRequest("http://localhost/api/v1/registries", "OPTIONS")
      const res = await middleware(req)

      expect(res.status).not.toBe(403)
    })
  })

  describe("non-API paths are not subject to CSRF check", () => {
    it("POST to /login page does not return 403 (CSRF only applies to /api/)", async () => {
      const req = makeRequest("http://localhost/login", "POST")
      const res = await middleware(req)

      // /login is a public path — either redirected or passed through, never 403
      expect(res.status).not.toBe(403)
    })
  })
})

describe("session authentication", () => {
  it("public paths pass through without session check", async () => {
    const publicPaths = [
      "http://localhost/login",
      "http://localhost/api/auth/login",
      "http://localhost/api/auth/logout",
      "http://localhost/api/health",
    ]

    for (const url of publicPaths) {
      const req = makeRequest(url, "GET")
      const res = await middleware(req)
      expect(res.status).not.toBe(403)
    }
  })

  it("authenticated session allows access to protected paths", async () => {
    vi.mocked(getSession).mockResolvedValueOnce({
      user: { username: "admin" },
      save: vi.fn(),
    } as never)

    const req = makeRequest("http://localhost/api/v1/registries", "GET")
    const res = await middleware(req)

    expect(res.status).not.toBe(401)
    expect(res.status).not.toBe(403)
  })

  it("unauthenticated request to protected path redirects to /login", async () => {
    vi.mocked(getSession).mockResolvedValueOnce({
      user: undefined,
      save: vi.fn(),
    } as never)

    const req = makeRequest("http://localhost/repos", "GET")
    const res = await middleware(req)

    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("/login")
  })

  it("unauthenticated request to protected API path returns 401 JSON", async () => {
    vi.mocked(getSession).mockResolvedValueOnce({
      user: undefined,
      save: vi.fn(),
    } as never)

    const req = makeRequest("http://localhost/api/v1/registries", "GET")
    const res = await middleware(req)

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error.code).toBe("UNAUTHENTICATED")
  })

  it("rate limits repeated DELETE requests to protected manifest endpoints", async () => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      vi.mocked(getSession).mockResolvedValueOnce({
        user: { username: "admin" },
        save: vi.fn(),
      } as never)

      const req = makeRequest("http://localhost/api/v1/registries/reg-1/manifests/app/web/sha256:abc", "DELETE", {
        "X-Requested-With": "XMLHttpRequest",
        "X-Real-IP": "198.51.100.10",
      })
      const res = await middleware(req)
      expect(res.status).not.toBe(429)
    }

    vi.mocked(getSession).mockResolvedValueOnce({
      user: { username: "admin" },
      save: vi.fn(),
    } as never)

    const limitedReq = makeRequest("http://localhost/api/v1/registries/reg-1/manifests/app/web/sha256:abc", "DELETE", {
      "X-Requested-With": "XMLHttpRequest",
      "X-Real-IP": "198.51.100.10",
    })
    const limitedRes = await middleware(limitedReq)

    expect(limitedRes.status).toBe(429)
    expect(limitedRes.headers.get("Retry-After")).toBeTruthy()
    const body = await limitedRes.json()
    expect(body.error.code).toBe("RATE_LIMITED")
  })

  it("tracks manifest and repository delete limits separately", async () => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      vi.mocked(getSession).mockResolvedValueOnce({
        user: { username: "admin" },
        save: vi.fn(),
      } as never)

      const manifestReq = makeRequest("http://localhost/api/v1/registries/reg-1/manifests/app/web/sha256:xyz", "DELETE", {
        "X-Requested-With": "XMLHttpRequest",
        "X-Real-IP": "198.51.100.11",
      })
      const manifestRes = await middleware(manifestReq)
      expect(manifestRes.status).not.toBe(429)
    }

    vi.mocked(getSession).mockResolvedValueOnce({
      user: { username: "admin" },
      save: vi.fn(),
    } as never)

    const repositoryReq = makeRequest("http://localhost/api/v1/registries/reg-1/repositories/app/web", "DELETE", {
      "X-Requested-With": "XMLHttpRequest",
      "X-Real-IP": "198.51.100.11",
    })
    const repositoryRes = await middleware(repositoryReq)

    expect(repositoryRes.status).not.toBe(429)
  })
})
