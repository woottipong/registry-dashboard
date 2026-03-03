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

    const repositories = await Promise.all(
      (response.repositories ?? []).map(async (repoName) => {
        const tagsResponse = await this.client.request<TagListResponse>(`/v2/${repoName}/tags/list`)
        const tags = tagsResponse.tags ?? []
        
        // Get latest tag config for last updated
        let lastUpdated: string | null = null
        if (tags.length > 0) {
          try {
            const manifest = await this.getManifest(repoName, tags[0])
            const config = await this.getConfig(repoName, manifest.config.digest)
            lastUpdated = config.created ?? null
          } catch {
            // Ignore errors for last updated
          }
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
    const manifest = await this.client.request<Omit<ImageManifest, "digest" | "totalSize"> & { digest?: string }>(
      `/v2/${repo}/manifests/${ref}`,
      {
        headers: {
          Accept:
            "application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.v2+json, application/json",
        },
      },
    )

    const totalSize = manifest.config.size + manifest.layers.reduce((sum, layer) => sum + layer.size, 0)

    return {
      ...manifest,
      digest: manifest.digest ?? ref,
      totalSize,
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
