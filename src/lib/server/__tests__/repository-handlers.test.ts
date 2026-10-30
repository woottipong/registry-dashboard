import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  listTagsHandler,
  getRepositoryDetailHandler,
  deleteRepositoryHandler,
} from "../repository-handlers"
import type { RegistryConnection } from "@/types/registry"

const mockRegistry: RegistryConnection = {
  id: "reg-1",
  name: "Local Registry",
  url: "https://registry.example.com",
  provider: "generic",
  authType: "none",
  createdAt: "2024-01-01T00:00:00Z",
}

const mockListTags = vi.fn()
const mockCapabilities = vi.fn()
const mockDeleteManifest = vi.fn()

vi.mock("@/lib/providers", () => ({
  createProvider: () => ({
    listTags: mockListTags,
    capabilities: mockCapabilities,
    deleteManifest: mockDeleteManifest,
  }),
}))

describe("repository-handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCapabilities.mockReturnValue({
      canListCatalog: true,
      canDelete: true,
      canSearch: true,
      hasRateLimit: false,
    })
  })

  describe("listTagsHandler", () => {
    it("returns tags with pagination metadata", async () => {
      mockListTags.mockResolvedValueOnce({
        items: [
          { name: "v1.0", digest: "sha256:111", size: 100 },
          { name: "v2.0", digest: "sha256:222", size: 200 },
        ],
        page: 1,
        perPage: 25,
        total: 2,
      })

      const searchParams = new URLSearchParams({ page: "1", perPage: "25" })
      const res = await listTagsHandler(mockRegistry, "apps/web", searchParams)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.meta.total).toBe(2)
      expect(res.headers.get("Cache-Control")).toContain("s-maxage=30")
    })

    it("passes search query parameter to provider", async () => {
      mockListTags.mockResolvedValueOnce({
        items: [],
        page: 1,
        perPage: 25,
        total: 0,
      })

      const searchParams = new URLSearchParams({ page: "1", perPage: "25", search: "prod" })
      await listTagsHandler(mockRegistry, "apps/web", searchParams)

      expect(mockListTags).toHaveBeenCalledWith("apps/web", {
        page: 1,
        perPage: 25,
        search: "prod",
      })
    })

    it("returns 422 on invalid query parameters", async () => {
      const searchParams = new URLSearchParams({ page: "-1", perPage: "invalid" })
      const res = await listTagsHandler(mockRegistry, "apps/web", searchParams)
      const data = await res.json()

      expect(res.status).toBe(422)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe("VALIDATION_ERROR")
    })

    it("returns 502 on upstream provider failure", async () => {
      mockListTags.mockRejectedValueOnce(new Error("Upstream timeout"))

      const searchParams = new URLSearchParams()
      const res = await listTagsHandler(mockRegistry, "apps/web", searchParams)
      const data = await res.json()

      expect(res.status).toBe(502)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe("TAGS_FETCH_FAILED")
    })
  })

  describe("getRepositoryDetailHandler", () => {
    it("returns parsed repository metadata with 200 OK", async () => {
      const res = await getRepositoryDetailHandler(mockRegistry, "library/ubuntu")
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual({
        name: "ubuntu",
        namespace: "library",
        fullName: "library/ubuntu",
      })
    })

    it("handles root-level repository correctly", async () => {
      const res = await getRepositoryDetailHandler(mockRegistry, "nginx")
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe("nginx")
      expect(data.data.namespace).toBeUndefined()
    })
  })

  describe("deleteRepositoryHandler", () => {
    it("rejects deletion requests ending in /tags with 400 Bad Request", async () => {
      const res = await deleteRepositoryHandler(mockRegistry, "apps/web/tags")
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe("INVALID_REQUEST")
      expect(mockDeleteManifest).not.toHaveBeenCalled()
    })

    it("returns 405 when provider does not support deletion", async () => {
      mockCapabilities.mockReturnValueOnce({ canDelete: false })

      const res = await deleteRepositoryHandler(mockRegistry, "apps/web")
      const data = await res.json()

      expect(res.status).toBe(405)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe("DELETE_NOT_SUPPORTED")
    })

    it("deletes deduplicated digests across multiple tags", async () => {
      mockListTags.mockResolvedValueOnce({
        items: [
          { name: "latest", digest: "sha256:common-hash" },
          { name: "v1.0", digest: "sha256:common-hash" }, // duplicate digest
          { name: "v2.0", digest: "sha256:unique-hash" },
        ],
        page: 1,
        perPage: 1000,
        total: 3,
      })

      const res = await deleteRepositoryHandler(mockRegistry, "apps/web")
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockDeleteManifest).toHaveBeenCalledTimes(2)
      expect(mockDeleteManifest).toHaveBeenCalledWith("apps/web", "sha256:common-hash")
      expect(mockDeleteManifest).toHaveBeenCalledWith("apps/web", "sha256:unique-hash")
    })

    it("returns 502 on deletion failure", async () => {
      mockListTags.mockRejectedValueOnce(new Error("Registry error"))

      const res = await deleteRepositoryHandler(mockRegistry, "apps/web")
      const data = await res.json()

      expect(res.status).toBe(502)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe("REPOSITORY_DELETE_FAILED")
    })
  })
})
