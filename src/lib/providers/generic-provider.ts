import { RegistryHttpClient } from "@/lib/registry-client"
import type { ImageConfig, ImageIndex, ImageManifest } from "@/types/manifest"
import type { RegistryConnection, Repository, Tag } from "@/types/registry"
import type { ListOptions, PaginatedResult, RegistryProvider } from "@/lib/providers/types"
import { UnsupportedError } from "@/lib/providers/types"

const INDEX_MEDIA_TYPES = new Set([
  "application/vnd.oci.image.index.v1+json",
  "application/vnd.docker.distribution.manifest.list.v2+json",
])

interface CatalogResponse {
  repositories?: string[]
}

interface TagListResponse {
  name: string
  tags: string[] | null
}

export class GenericProvider implements RegistryProvider {
  readonly type = "generic" as const
  private readonly client: RegistryHttpClient
  private readonly digestCache = new Map<string, { digest: string; expiresAt: number }>()

  private static readonly DIGEST_CACHE_TTL_MS = 5 * 60 * 1000

  constructor(private readonly connection: RegistryConnection) {
    this.client = new RegistryHttpClient(connection)
  }

  async ping(): Promise<boolean> {
    try {
      await this.client.request<unknown>("/v2/", { method: "GET" })
      return true
    } catch (error) {
      console.error("Generic provider ping failed:", {
        registryUrl: this.connection.url,
        error: error instanceof Error ? error.message : error,
      })
      throw error
    }
  }

  async listRepositories(options: ListOptions = {}): Promise<PaginatedResult<Repository>> {
    const page = options.page ?? 1
    const perPage = options.perPage ?? 10000 // Default to a very large number to get all

    // Fetch ALL repo names from catalog by following Link headers
    const allRepoNames = await this.fetchAllCatalogNames()

    const total = allRepoNames.length
    const start = (page - 1) * perPage
    const pageNames = allRepoNames.slice(start, start + perPage)

    // Fetch tag counts in parallel ONLY for the current page
    const repositories = (
      await Promise.all(
        pageNames.map(async (repoName) => {
          try {
            const tagsResponse = await this.client.request<TagListResponse>(`/v2/${repoName}/tags/list`)
            const tags = tagsResponse.tags ?? []

            // Skip repos with no tags — registry:2 keeps catalog entries even after all manifests are deleted
            if (tags.length === 0) return null

            return {
              name: repoName.split("/").pop() ?? repoName,
              fullName: repoName,
              namespace: repoName.includes("/") ? repoName.split("/").slice(0, -1).join("/") : undefined,
              tagCount: tags.length,
            }
          } catch {
            return null
          }
        }),
      )
    ).filter((repo): repo is NonNullable<typeof repo> => repo !== null)

    return {
      items: repositories,
      page,
      perPage,
      total,
      nextCursor: null,
    }
  }

  private async fetchAllCatalogNames(): Promise<string[]> {
    const allNames: string[] = []
    // Fetch in large batches to minimise round-trips
    const batchSize = 1000
    let url: string | null = `/v2/_catalog?n=${batchSize}`

    while (url) {
      const { body, linkHeader } = await this.client.requestWithHeaders<CatalogResponse>(url)
      allNames.push(...(body.repositories ?? []))
      url = parseLinkNext(linkHeader)
    }

    return allNames
  }

  async listTags(repo: string, options: ListOptions = {}): Promise<PaginatedResult<Tag>> {
    const response = await this.client.request<TagListResponse>(`/v2/${repo}/tags/list`)
    const tagNames = response.tags ?? []

    const resolvedTags = await Promise.all(
      tagNames.map((tagName) => this.resolveTag(repo, tagName)),
    )

    return {
      items: resolvedTags,
      page: options.page ?? 1,
      perPage: options.perPage ?? (resolvedTags.length || 50),
      nextCursor: null,
    }
  }

  private async resolveTag(repo: string, tagName: string): Promise<Tag> {
    const acceptHeader = [
      "application/vnd.oci.image.index.v1+json",
      "application/vnd.oci.image.manifest.v1+json",
      "application/vnd.docker.distribution.manifest.list.v2+json",
      "application/vnd.docker.distribution.manifest.v2+json",
      "application/json",
    ].join(", ")

    try {
      const { body: raw, contentDigest } = await this.client.requestWithHeaders<
        (ImageManifest | ImageIndex) & { digest?: string }
      >(`/v2/${repo}/manifests/${tagName}`, { headers: { Accept: acceptHeader } })

      const digest = raw.digest?.startsWith("sha256:")
        ? raw.digest
        : (contentDigest?.startsWith("sha256:") ? contentDigest : null)
        ?? await this.resolveDigest(repo, tagName)
        ?? tagName

      // Multi-arch index — aggregate size from all children, read platform from first entry
      if (INDEX_MEDIA_TYPES.has(raw.mediaType)) {
        const index = raw as ImageIndex & { digest?: string }
        let totalSize = index.manifests.reduce((sum, m) => sum + m.size, 0)
        const firstPlatform = index.manifests[0]?.platform

        // Try to resolve created date and actual size from first child manifest's config
        let createdAt: string | null = null
        const firstEntry = index.manifests[0]
        if (firstEntry) {
          try {
            const child = await this.client.request<
              Omit<ImageManifest, "digest" | "totalSize"> & { digest?: string }
            >(`/v2/${repo}/manifests/${firstEntry.digest}`, { headers: { Accept: acceptHeader } })

            // Calculate actual image size from child manifest
            const childSize = (child.config?.size ?? 0) + (child.layers ?? []).reduce((sum, l) => sum + l.size, 0)
            if (childSize > 0) {
              totalSize = childSize
            }

            if (child.config?.digest) {
              const cfg = await this.getConfig(repo, child.config.digest)
              createdAt = cfg?.created ?? null
            }
          } catch {
            // created date and size extraction is optional
          }
        }

        return {
          name: tagName,
          digest,
          size: totalSize,
          createdAt,
          architecture: firstPlatform?.architecture ?? "multi-arch",
          os: firstPlatform?.os ?? "linux",
        }
      }

      // Single-arch manifest
      const single = raw as ImageManifest & { digest?: string }
      const totalSize = (single.config?.size ?? 0) +
        (single.layers ?? []).reduce((sum, l) => sum + l.size, 0)

      let createdAt: string | null = null
      let architecture = "unknown"
      let os = "unknown"

      if (single.config?.digest) {
        try {
          const cfg = await this.getConfig(repo, single.config.digest)
          createdAt = cfg?.created ?? null
          architecture = cfg?.architecture ?? "unknown"
          os = cfg?.os ?? "unknown"
        } catch {
          // config is optional
        }
      }

      return { name: tagName, digest, size: totalSize, createdAt, architecture, os }
    } catch {
      return { name: tagName, digest: "", size: 0, createdAt: null, architecture: "unknown", os: "unknown" }
    }
  }

  async getManifest(repo: string, ref: string): Promise<ImageManifest> {
    const acceptHeader =
      "application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.v2+json, application/json"

    const { body: manifest, contentDigest } = await this.client.requestWithHeaders<
      Omit<ImageManifest, "digest" | "totalSize"> & { digest?: string }
    >(`/v2/${repo}/manifests/${ref}`, {
      headers: { Accept: acceptHeader },
    })

    const totalSize = manifest.config.size + manifest.layers.reduce((sum, layer) => sum + layer.size, 0)

    // Prefer: 1) sha256 from body, 2) Docker-Content-Digest response header, 3) HEAD fallback
    if (manifest.digest?.startsWith("sha256:")) {
      return { ...manifest, digest: manifest.digest, totalSize }
    }

    if (contentDigest?.startsWith("sha256:")) {
      return { ...manifest, digest: contentDigest, totalSize }
    }

    // Last resort: resolve via HEAD request
    const resolvedDigest = await this.resolveDigest(repo, ref)
    return { ...manifest, digest: resolvedDigest ?? ref, totalSize }
  }

  private async resolveDigest(repo: string, ref: string): Promise<string | null> {
    const cacheKey = `${repo}:${ref}`
    const now = Date.now()
    const cached = this.digestCache.get(cacheKey)
    if (cached && cached.expiresAt > now) {
      return cached.digest
    }

    try {
      const acceptHeader =
        "application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.v2+json, application/json"
      const base = this.connection.url.replace(/\/$/, "")
      const url = `${base}/v2/${repo}/manifests/${ref}`

      // Build auth header manually from connection credentials
      const headers: Record<string, string> = { Accept: acceptHeader }
      if (this.connection.authType === "basic") {
        const { username = "", password = "" } = this.connection.credentials ?? {}
        headers["Authorization"] = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`
      }

      const response = await fetch(url, { method: "HEAD", headers })
      const digest = response.headers.get("Docker-Content-Digest")
      if (digest?.startsWith("sha256:")) {
        this.digestCache.set(cacheKey, {
          digest,
          expiresAt: now + GenericProvider.DIGEST_CACHE_TTL_MS,
        })
        return digest
      }
      return digest
    } catch {
      return null
    }
  }

  async getConfig(repo: string, digest: string): Promise<ImageConfig> {
    return this.client.request<ImageConfig>(`/v2/${repo}/blobs/${digest}`)
  }

  async deleteManifest(repo: string, digest: string): Promise<void> {
    await this.client.request<void>(`/v2/${repo}/manifests/${digest}`, { method: "DELETE" })
  }

  async searchRepositories(_query: string): Promise<PaginatedResult<Repository>> {
    throw new UnsupportedError("Search is not supported for generic registry providers")
  }

  async authenticate(): Promise<void> {
    await this.ping()
  }

  capabilities() {
    return {
      canListCatalog: true,
      canDelete: true,
      canSearch: false,
      hasRateLimit: false,
    }
  }
}

// Parse the `next` URL from a Docker Registry `Link` response header
// Format: </v2/_catalog?last=foo&n=100>; rel="next"
function parseLinkNext(linkHeader: string | null): string | null {
  if (!linkHeader) return null
  const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/)
  if (!match) return null
  // Return just the path portion so RegistryHttpClient prepends the base URL
  try {
    const url = new URL(match[1], "http://placeholder")
    return `${url.pathname}${url.search}`
  } catch {
    return null
  }
}
