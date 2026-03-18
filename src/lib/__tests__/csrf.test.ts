import { describe, it, expect, vi, type Mock } from "vitest"
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
import { getSession } from "@/lib/session"

function makeRequest(
  url: string,
  method: string,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest(url, { method, headers })
}

const getSessionMock = getSession as Mock

describe("CSRF protection", () => {
  describe("mutating API endpoints (POST/PUT/DELETE/PATCH)", () => {
    it("allows POST when Origin matches the current host without X-Requested-With", async () => {
      const req = makeRequest("http://localhost/api/v1/registries", "POST", {
        Origin: "http://localhost",
      })
      const res = await middleware(req)

      expect(res.status).not.toBe(403)
    })

    it("blocks DELETE when no CSRF headers are present", async () => {
      const req = makeRequest("http://localhost/api/v1/registries/abc", "DELETE")
      const res = await middleware(req)

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error.message).toBe("CSRF check failed: no verifiable request metadata")
    })

    it("allows DELETE for automation clients with X-Requested-With header", async () => {
      const req = makeRequest("http://localhost/api/v1/registries/abc", "DELETE", {
        "X-Requested-With": "XMLHttpRequest",
      })
      const res = await middleware(req)

      expect(res.status).not.toBe(403)
    })

    it("allows PUT when Sec-Fetch-Site indicates same-origin", async () => {
      const req = makeRequest("http://localhost/api/v1/registries/abc", "PUT", {
        "Sec-Fetch-Site": "same-origin",
      })
      const res = await middleware(req)

      expect(res.status).not.toBe(403)
    })

    it("allows PATCH when Sec-Fetch-Site indicates same-site", async () => {
      const req = makeRequest("http://localhost/api/v1/registries/abc", "PATCH", {
        "Sec-Fetch-Site": "same-site",
      })
      const res = await middleware(req)

      expect(res.status).not.toBe(403)
    })

    it("allows POST when Sec-Fetch-Site is none", async () => {
      const req = makeRequest("http://localhost/api/v1/registries", "POST", {
        "Sec-Fetch-Site": "none",
      })
      const res = await middleware(req)

      expect(res.status).not.toBe(403)
    })

    it("allows POST with X-Requested-With: XMLHttpRequest → passes CSRF", async () => {
      const req = makeRequest("http://localhost/api/v1/registries", "POST", {
        "X-Requested-With": "XMLHttpRequest",
      })
      const res = await middleware(req)

      expect(res.status).not.toBe(403)
    })

    it("blocks POST when Origin does not match host", async () => {
      const req = makeRequest("http://localhost/api/v1/registries", "POST", {
        Origin: "https://attacker.example.com",
      })
      const res = await middleware(req)

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error.message).toBe("CSRF check failed: origin mismatch")
    })

    it("blocks POST when Origin header is invalid", async () => {
      const req = makeRequest("http://localhost/api/v1/registries", "POST", {
        Origin: "not a url",
      })
      const res = await middleware(req)

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error.message).toBe("CSRF check failed: invalid origin")
    })

    it("allows DELETE when Origin matches X-Forwarded-Host behind a reverse proxy", async () => {
      const req = makeRequest("http://localhost:3000/api/v1/registries/reg-1/manifests/app/web/sha256:abc", "DELETE", {
        Origin: "https://registry.example.com",
        Host: "localhost:3000",
        "X-Forwarded-Host": "registry.example.com",
      })
      const res = await middleware(req)

      expect(res.status).not.toBe(403)
    })

    it("uses the first X-Forwarded-Host value when proxy adds multiple hosts", async () => {
      const req = makeRequest("http://localhost:3000/api/v1/registries/reg-1/manifests/app/web/sha256:abc", "DELETE", {
        Origin: "https://registry.example.com",
        Host: "localhost:3000",
        "X-Forwarded-Host": "registry.example.com, proxy.internal",
      })
      const res = await middleware(req)

      expect(res.status).not.toBe(403)
    })

    it("blocks DELETE when Origin does not match X-Forwarded-Host behind a reverse proxy", async () => {
      const req = makeRequest("http://localhost:3000/api/v1/registries/reg-1/manifests/app/web/sha256:abc", "DELETE", {
        Origin: "https://attacker.example.com",
        Host: "localhost:3000",
        "X-Forwarded-Host": "registry.example.com",
      })
      const res = await middleware(req)

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error.message).toBe("CSRF check failed: origin mismatch")
    })

    it("blocks DELETE when Sec-Fetch-Site is cross-site", async () => {
      const req = makeRequest("http://localhost/api/v1/registries/reg-1/manifests/app/web/sha256:abc", "DELETE", {
        "Sec-Fetch-Site": "cross-site",
      })
      const res = await middleware(req)

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error.message).toBe("CSRF check failed: cross-site request blocked")
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
      "http://localhost/api/health",
      "http://localhost/favicon.ico",
      "http://localhost/icon",
      "http://localhost/icon.svg",
      "http://localhost/logo.svg",
      "http://localhost/apple-icon",
      "http://localhost/manifest.webmanifest",
    ]

    for (const url of publicPaths) {
      const req = makeRequest(url, "GET")
      const res = await middleware(req)
      expect(res.status).not.toBe(403)
      expect(res.status).not.toBe(401)
    }
  })

  it("authenticated session allows access to protected paths", async () => {
    getSessionMock.mockResolvedValueOnce({
      user: { username: "admin" },
      save: vi.fn(),
    } as never)

    const req = makeRequest("http://localhost/api/v1/registries", "GET")
    const res = await middleware(req)

    expect(res.status).not.toBe(401)
    expect(res.status).not.toBe(403)
  })

  it("unauthenticated request to protected path redirects to /login", async () => {
    getSessionMock.mockResolvedValueOnce({
      user: undefined,
      save: vi.fn(),
    } as never)

    const req = makeRequest("http://localhost/repos", "GET")
    const res = await middleware(req)

    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("/login")
  })

  it("does not treat dotted protected routes as public assets", async () => {
    getSessionMock.mockResolvedValueOnce({
      user: undefined,
      save: vi.fn(),
    } as never)

    const req = makeRequest("http://localhost/repos/docker.io/library/nginx.v1", "GET")
    const res = await middleware(req)

    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("/login")
  })

  it("unauthenticated request to protected API path returns 401 JSON", async () => {
    getSessionMock.mockResolvedValueOnce({
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
      getSessionMock.mockResolvedValueOnce({
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

    getSessionMock.mockResolvedValueOnce({
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
      getSessionMock.mockResolvedValueOnce({
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

    getSessionMock.mockResolvedValueOnce({
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
