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

    const repositories = (response.repositories ?? []).map<Repository>((repoName) => ({
      name: repoName.split("/").pop() ?? repoName,
      fullName: repoName,
      namespace: repoName.includes("/") ? repoName.split("/").slice(0, -1).join("/") : undefined,
    }))

    return {
      items: repositories,
      page: options.page ?? 1,
      perPage,
      nextCursor: null,
    }
  }

  async listTags(repo: string, options: ListOptions = {}): Promise<PaginatedResult<Tag>> {
    const response = await this.client.request<TagListResponse>(`/v2/${repo}/tags/list`)

    const tags = (response.tags ?? []).map<Tag>((tagName) => ({
      name: tagName,
      digest: "",
      size: 0,
      createdAt: null,
      architecture: "unknown",
      os: "unknown",
    }))

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
