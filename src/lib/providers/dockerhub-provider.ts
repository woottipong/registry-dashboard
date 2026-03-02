import { RegistryHttpClient } from "@/lib/registry-client"
import type { ImageConfig, ImageManifest } from "@/types/manifest"
import type { RegistryConnection, Repository, Tag } from "@/types/registry"
import type { ListOptions, PaginatedResult, RegistryProvider } from "@/lib/providers/types"
import { UnsupportedError } from "@/lib/providers/types"

interface DockerHubRepoResponse {
  count: number
  results: Array<{
    name: string
    namespace: string
    description?: string
    is_private?: boolean
    is_official?: boolean
    star_count?: number
    pull_count?: number
    last_updated?: string
  }>
  next?: string | null
}

interface DockerHubTagResponse {
  count: number
  results: Array<{
    name: string
    digest?: string
    full_size?: number
    last_updated?: string
    images?: Array<{ architecture?: string; os?: string }>
  }>
  next?: string | null
}

export class DockerHubProvider implements RegistryProvider {
  readonly type = "dockerhub" as const
  private readonly registryClient: RegistryHttpClient
  private readonly defaultNamespace: string

  constructor(private readonly connection: RegistryConnection) {
    this.registryClient = new RegistryHttpClient(connection)
    this.defaultNamespace = connection.namespace ?? "library"
  }

  async ping(): Promise<boolean> {
    await this.registryClient.request<unknown>("https://registry-1.docker.io/v2/")
    return true
  }

  async listRepositories(options: ListOptions = {}): Promise<PaginatedResult<Repository>> {
    const page = options.page ?? 1
    const perPage = options.perPage ?? 25
    const namespace = this.defaultNamespace

    const response = await this.registryClient.request<DockerHubRepoResponse>(
      `https://hub.docker.com/v2/repositories/${namespace}/?page=${page}&page_size=${perPage}`,
    )

    return {
      items: response.results.map((repo) => ({
        name: repo.name,
        namespace: repo.namespace,
        fullName: `${repo.namespace}/${repo.name}`,
        description: repo.description,
        isPrivate: repo.is_private,
        isOfficial: repo.is_official,
        starCount: repo.star_count,
        pullCount: repo.pull_count,
        lastUpdated: repo.last_updated,
      })),
      page,
      perPage,
      total: response.count,
      nextCursor: response.next,
    }
  }

  async searchRepositories(query: string): Promise<PaginatedResult<Repository>> {
    const response = await this.registryClient.request<DockerHubRepoResponse>(
      `https://hub.docker.com/v2/search/repositories/?query=${encodeURIComponent(query)}&page_size=25`,
    )

    return {
      items: response.results.map((repo) => ({
        name: repo.name,
        namespace: repo.namespace,
        fullName: `${repo.namespace}/${repo.name}`,
        description: repo.description,
        isOfficial: repo.is_official,
        starCount: repo.star_count,
        pullCount: repo.pull_count,
        lastUpdated: repo.last_updated,
      })),
      page: 1,
      perPage: 25,
      total: response.count,
      nextCursor: response.next,
    }
  }

  async listTags(repo: string, options: ListOptions = {}): Promise<PaginatedResult<Tag>> {
    const page = options.page ?? 1
    const perPage = options.perPage ?? 25

    const response = await this.registryClient.request<DockerHubTagResponse>(
      `https://hub.docker.com/v2/repositories/${repo}/tags/?page=${page}&page_size=${perPage}`,
    )

    return {
      items: response.results.map((tag) => ({
        name: tag.name,
        digest: tag.digest ?? "",
        size: tag.full_size ?? 0,
        createdAt: tag.last_updated ?? null,
        architecture: tag.images?.[0]?.architecture ?? "unknown",
        os: tag.images?.[0]?.os ?? "unknown",
      })),
      page,
      perPage,
      total: response.count,
      nextCursor: response.next,
    }
  }

  async getManifest(repo: string, ref: string): Promise<ImageManifest> {
    const manifest = await this.registryClient.request<Omit<ImageManifest, "digest" | "totalSize"> & { digest?: string }>(
      `https://registry-1.docker.io/v2/${repo}/manifests/${ref}`,
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
    return this.registryClient.request<ImageConfig>(
      `https://registry-1.docker.io/v2/${repo}/blobs/${digest}`,
    )
  }

  async deleteManifest(): Promise<void> {
    throw new UnsupportedError("Docker Hub does not support manifest deletion via API")
  }

  async authenticate(): Promise<void> {
    await this.ping()
  }

  capabilities() {
    return {
      canListCatalog: false,
      canDelete: false,
      canSearch: true,
      hasRateLimit: true,
    }
  }
}
