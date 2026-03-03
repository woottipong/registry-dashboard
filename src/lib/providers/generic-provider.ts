import { RegistryHttpClient } from "@/lib/registry-client"
import type { ImageConfig, ImageManifest } from "@/types/manifest"
import type { RegistryConnection, Repository, Tag } from "@/types/registry"
import type { ListOptions, PaginatedResult, RegistryProvider } from "@/lib/providers/types"
import { UnsupportedError } from "@/lib/providers/types"

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

  constructor(private readonly connection: RegistryConnection) {
    this.client = new RegistryHttpClient(connection)
  }

  async ping(): Promise<boolean> {
    await this.client.request<unknown>("/v2/", { method: "GET" })
    return true
  }

  async listRepositories(options: ListOptions = {}): Promise<PaginatedResult<Repository>> {
    const perPage = options.perPage ?? 50
    const searchParams = new URLSearchParams()
    searchParams.set("n", String(perPage))
    if (options.last) {
      searchParams.set("last", options.last)
    }

    const response = await this.client.request<CatalogResponse>(`/v2/_catalog?${searchParams.toString()}`)

    const allRepoNames = response.repositories ?? []

    const repositories = (
      await Promise.all(
        allRepoNames.map(async (repoName) => {
          const tagsResponse = await this.client.request<TagListResponse>(`/v2/${repoName}/tags/list`)
          const tags = tagsResponse.tags ?? []

          // Skip repos with no tags — registry:2 keeps catalog entries even after all manifests are deleted
          if (tags.length === 0) return null

          // Get latest tag config for last updated
          let lastUpdated: string | null = null
          try {
            const manifest = await this.getManifest(repoName, tags[0])
            const config = await this.getConfig(repoName, manifest.config.digest)
            lastUpdated = config.created ?? null
          } catch {
            // Ignore errors for last updated
          }

          return {
            name: repoName.split("/").pop() ?? repoName,
            fullName: repoName,
            namespace: repoName.includes("/") ? repoName.split("/").slice(0, -1).join("/") : undefined,
            tagCount: tags.length,
            lastUpdated,
          }
        }),
      )
    ).filter((repo): repo is NonNullable<typeof repo> => repo !== null)

    return {
      items: repositories,
      page: options.page ?? 1,
      perPage,
      nextCursor: null,
    }
  }

  async listTags(repo: string, options: ListOptions = {}): Promise<PaginatedResult<Tag>> {
    const response = await this.client.request<TagListResponse>(`/v2/${repo}/tags/list`)
    const tagNames = response.tags ?? []

    const tags = await Promise.all(
      tagNames.map(async (tagName): Promise<Tag> => {
        try {
          const manifest = await this.getManifest(repo, tagName)
          let createdAt: string | null = null
          let architecture = "unknown"
          let os = "unknown"

          try {
            const cfg = await this.getConfig(repo, manifest.config.digest)
            createdAt = cfg.created ?? null
            architecture = cfg.architecture ?? "unknown"
            os = cfg.os ?? "unknown"
          } catch {
            // config fetch optional — size and digest still available
          }

          return {
            name: tagName,
            digest: manifest.digest,
            size: manifest.totalSize,
            createdAt,
            architecture,
            os,
          }
        } catch {
          return {
            name: tagName,
            digest: "",
            size: 0,
            createdAt: null,
            architecture: "unknown",
            os: "unknown",
          }
        }
      }),
    )

    return {
      items: tags,
      page: options.page ?? 1,
      perPage: options.perPage ?? (tags.length || 50),
      nextCursor: null,
    }
  }

  async getManifest(repo: string, ref: string): Promise<ImageManifest> {
    const acceptHeader =
      "application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.v2+json, application/json"

    const manifest = await this.client.request<
      Omit<ImageManifest, "digest" | "totalSize"> & { digest?: string }
    >(`/v2/${repo}/manifests/${ref}`, {
      headers: { Accept: acceptHeader },
      // Include credentials so auth flow works
    })

    // Resolve digest: prefer sha256 from body, then try tag ref as fallback
    // The real sha256 digest is fetched separately via resolveDigest when needed for deletion
    const bodyDigest = manifest.digest
    const totalSize = manifest.config.size + manifest.layers.reduce((sum, layer) => sum + layer.size, 0)

    // If body digest looks like a sha256, use it; otherwise resolve via HEAD
    if (bodyDigest?.startsWith("sha256:")) {
      return { ...manifest, digest: bodyDigest, totalSize }
    }

    // Fall back: resolve digest via HEAD request to get Docker-Content-Digest header
    const resolvedDigest = await this.resolveDigest(repo, ref)
    return { ...manifest, digest: resolvedDigest ?? ref, totalSize }
  }

  private async resolveDigest(repo: string, ref: string): Promise<string | null> {
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
      return response.headers.get("Docker-Content-Digest")
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
