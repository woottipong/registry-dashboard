import { describe, it, expect, vi, afterEach } from "vitest"
import { RegistryHttpClient, RegistryHttpError } from "@/lib/registry-client"
import type { RegistryConnection } from "@/types/registry"

const BASE_CONNECTION: RegistryConnection = {
  id: "test-id",
  name: "Test Registry",
  url: "http://registry.test",
  provider: "generic",
  authType: "none",
  createdAt: new Date().toISOString(),
}

interface MockResponse {
  ok?: boolean
  status?: number
  statusText?: string
  body?: string
  headers?: Record<string, string>
}

function mockFetch(responses: MockResponse[]) {
  let callIndex = 0
  return vi.fn().mockImplementation(() => {
    const r = responses[callIndex] ?? responses[responses.length - 1]
    callIndex++
    const headers = new Headers(r.headers)
    const bodyText = r.body ?? "{}"
    return Promise.resolve({
      ok: r.ok ?? true,
      status: r.status ?? 200,
      statusText: r.statusText ?? "OK",
      headers,
      text: () => Promise.resolve(bodyText),
      json: () => Promise.resolve(JSON.parse(bodyText)),
    })
  })
}

describe("RegistryHttpClient", () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  describe("request()", () => {
    it("makes a GET request and parses JSON", async () => {
      global.fetch = mockFetch([{ body: JSON.stringify({ repositories: ["nginx"] }) }]) as typeof fetch

      const client = new RegistryHttpClient(BASE_CONNECTION)
      const result = await client.request<{ repositories: string[] }>("/v2/_catalog")

      expect(result.repositories).toEqual(["nginx"])
    })

    it("throws RegistryHttpError on non-ok response", async () => {
      global.fetch = mockFetch([
        { ok: false, status: 404, statusText: "Not Found", body: JSON.stringify({ errors: [] }) },
      ]) as typeof fetch

      const client = new RegistryHttpClient(BASE_CONNECTION)
      await expect(client.request("/v2/missing/tags/list")).rejects.toThrow(RegistryHttpError)
    })

    it("throws RegistryHttpError with correct status", async () => {
      global.fetch = mockFetch([
        { ok: false, status: 401, statusText: "Unauthorized", body: "{}" },
        { ok: false, status: 401, statusText: "Unauthorized", body: "{}" },
        { ok: false, status: 401, statusText: "Unauthorized", body: "{}" },
      ]) as typeof fetch

      const client = new RegistryHttpClient(BASE_CONNECTION)
      try {
        await client.request("/v2/")
      } catch (err) {
        expect(err).toBeInstanceOf(RegistryHttpError)
      }
    })

    it("returns undefined for 204 responses", async () => {
      global.fetch = mockFetch([{ ok: true, status: 204, body: "" }]) as typeof fetch

      const client = new RegistryHttpClient(BASE_CONNECTION)
      const result = await client.request("/v2/repo/manifests/sha256:abc", { method: "DELETE" })

      expect(result).toBeUndefined()
    })
  })

  describe("auth: basic", () => {
    it("sends Authorization: Basic header", async () => {
      const fetchSpy = mockFetch([{ body: "{}" }]) as typeof fetch
      global.fetch = fetchSpy

      const client = new RegistryHttpClient({
        ...BASE_CONNECTION,
        authType: "basic",
        credentials: { username: "user", password: "pass" },
      })

      await client.request("/v2/")

      const call = (fetchSpy as ReturnType<typeof vi.fn>).mock.calls[0]
      const headers = call[1].headers as Headers
      expect(headers.get("Authorization")).toMatch(/^Basic /)
    })
  })

  describe("rate limit capture", () => {
    it("parses ratelimit headers", async () => {
      global.fetch = mockFetch([
        {
          body: "{}",
          headers: { "ratelimit-limit": "100", "ratelimit-remaining": "95" },
        },
      ]) as typeof fetch

      const client = new RegistryHttpClient(BASE_CONNECTION)
      await client.request("/v2/")

      const rl = client.getRateLimit()
      expect(rl.limit).toBe(100)
      expect(rl.remaining).toBe(95)
    })

    it("returns null rate limit when headers absent", async () => {
      global.fetch = mockFetch([{ body: "{}" }]) as typeof fetch

      const client = new RegistryHttpClient(BASE_CONNECTION)
      await client.request("/v2/")

      const rl = client.getRateLimit()
      expect(rl.limit).toBeNull()
      expect(rl.remaining).toBeNull()
    })
  })

  describe("requestWithHeaders()", () => {
    it("returns body and null headers when absent", async () => {
      global.fetch = mockFetch([{ body: JSON.stringify({ repositories: ["nginx"] }) }]) as typeof fetch

      const client = new RegistryHttpClient(BASE_CONNECTION)
      const result = await client.requestWithHeaders<{ repositories: string[] }>("/v2/_catalog")

      expect(result.body.repositories).toEqual(["nginx"])
      expect(result.linkHeader).toBeNull()
      expect(result.contentDigest).toBeNull()
    })

    it("returns linkHeader when Link header present", async () => {
      global.fetch = mockFetch([{
        body: JSON.stringify({ repositories: ["a"] }),
        headers: { link: '</v2/_catalog?last=a&n=1>; rel="next"' },
      }]) as typeof fetch

      const client = new RegistryHttpClient(BASE_CONNECTION)
      const result = await client.requestWithHeaders<{ repositories: string[] }>("/v2/_catalog?n=1")

      expect(result.linkHeader).toBe('</v2/_catalog?last=a&n=1>; rel="next"')
    })

    it("returns contentDigest when Docker-Content-Digest header present", async () => {
      const digest = "sha256:abc123"
      global.fetch = mockFetch([{
        body: JSON.stringify({ schemaVersion: 2 }),
        headers: { "Docker-Content-Digest": digest },
      }]) as typeof fetch

      const client = new RegistryHttpClient(BASE_CONNECTION)
      const result = await client.requestWithHeaders<{ schemaVersion: number }>("/v2/repo/manifests/latest")

      expect(result.contentDigest).toBe(digest)
    })

    it("returns body undefined and headers for 204", async () => {
      global.fetch = mockFetch([{ ok: true, status: 204, body: "" }]) as typeof fetch

      const client = new RegistryHttpClient(BASE_CONNECTION)
      const result = await client.requestWithHeaders("/v2/repo/manifests/sha256:abc", { method: "DELETE" })

      expect(result.body).toBeUndefined()
      expect(result.linkHeader).toBeNull()
    })
  })

  describe("bearer token exchange", () => {
    it("exchanges token on 401 with WWW-Authenticate: Bearer", async () => {
      const fetchSpy = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: "Unauthorized",
          headers: new Headers({
            "www-authenticate": 'Bearer realm="https://auth.test/token",service="registry.test"',
          }),
          text: () => Promise.resolve("{}"),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: () => Promise.resolve({ token: "my-access-token" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          text: () => Promise.resolve(JSON.stringify({ repositories: [] })),
        })

      global.fetch = fetchSpy as typeof fetch

      const client = new RegistryHttpClient(BASE_CONNECTION)
      const result = await client.request<{ repositories: string[] }>("/v2/_catalog")

      expect(result.repositories).toEqual([])
      const tokenCall = fetchSpy.mock.calls[1]
      expect(String(tokenCall[0])).toContain("auth.test")
    })
  })
})
