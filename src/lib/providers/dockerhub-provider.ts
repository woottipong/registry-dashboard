import { RegistryHttpClient } from "@/lib/registry-client"
import type { ImageConfig, ImageManifest, ManifestBlobReference } from "@/types/manifest"
import type { Namespace, RegistryConnection, Repository, Tag } from "@/types/registry"
import type { ListOptions, PaginatedResult, RegistryProvider } from "@/lib/providers/types"
import { UnsupportedError } from "@/lib/providers/types"

// Docker Hub API Constants
const DOCKER_HUB_CONFIG = {
  baseUrl: "https://hub.docker.com",
  registryUrl: "https://registry-1.docker.io",
  apiVersion: "v2",
  defaultNamespace: "library",
  defaultPageSize: 25,
} as const

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

interface DockerHubAuthResponse {
  token: string
}

export class DockerHubProvider implements RegistryProvider {
  readonly type = "dockerhub" as const
  private readonly registryClient: RegistryHttpClient
  private readonly config: typeof DOCKER_HUB_CONFIG
  private hubJwtToken: string | null = null
  private hubTokenExpiresAt = 0   // unix ms; 0 = no cached token
  private authenticatedUsername: string | null = null

  /** Returns true when a cached token exists and has >30 s left before expiry */
  private isHubTokenValid(): boolean {
    return this.hubJwtToken !== null && Date.now() < this.hubTokenExpiresAt - 30_000
  }

  /**
   * Decode the `exp` claim from a JWT's payload segment.
   * Returns the expiry in milliseconds (unix), or null if not present.
   */
  private parseJwtExpiry(token: string): number | null {
    try {
      const payloadB64 = token.split(".")[1]
      if (!payloadB64) return null
      const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8")) as { exp?: unknown }
      return typeof payload.exp === "number" ? payload.exp * 1000 : null
    } catch {
      return null
    }
  }

  constructor(private readonly connection: RegistryConnection) {
    this.registryClient = new RegistryHttpClient(connection)
    this.config = DOCKER_HUB_CONFIG
  }

  async ping(): Promise<boolean> {
    try {
      // Test Docker Hub API access
      await this.authenticateHubApi()
      return true
    } catch {
      return false
    }
  }

  async listNamespaces(): Promise<Namespace[]> {
    await this.ensureAuthenticated()
    const namespace = this.getEffectiveNamespace()

    try {
      const headers: HeadersInit = this.hubJwtToken
        ? { Authorization: `JWT ${this.hubJwtToken}` }
        : {}

      const response = await this.registryClient.request<DockerHubRepoResponse>(
        `${this.config.baseUrl}/${this.config.apiVersion}/repositories/${namespace}/?page_size=1`,
        { headers },
      )

      return [{ name: namespace, repositoryCount: response.count }]
    } catch {
      return [{ name: namespace, repositoryCount: 0 }]
    }
  }

  async listRepositories(options: ListOptions & { namespace?: string } = {}): Promise<PaginatedResult<Repository>> {
    await this.ensureAuthenticated()

    const namespace = this.getEffectiveNamespace()
    // Hub API page_size max is 100; fetch all pages so consumers see the full list
    const pageSize = 100

    const headers: HeadersInit = {}
    if (this.hubJwtToken) {
      headers.Authorization = `JWT ${this.hubJwtToken}`
    }

    try {
      const allItems: Repository[] = []
      let nextUrl: string | null = `${this.config.baseUrl}/${this.config.apiVersion}/repositories/${namespace}/?page=1&page_size=${pageSize}`
      let total = 0

      while (nextUrl) {
        const url: string = nextUrl
        const response: DockerHubRepoResponse = await this.registryClient.request<DockerHubRepoResponse>(url, { headers })
        total = response.count
        allItems.push(...response.results.map((repo) => this.mapRepositoryResponse(repo)))
        nextUrl = response.next ?? null
      }

      return {
        items: allItems,
        page: 1,
        perPage: allItems.length,
        total,
        nextCursor: null,
      }
    } catch (error) {
      this.handleApiError(error, `Failed to list repositories for namespace ${namespace}`)
    }
  }

  async searchRepositories(query: string): Promise<PaginatedResult<Repository>> {
    await this.ensureAuthenticated()

    try {
      const headers: HeadersInit = {}
      if (this.hubJwtToken) {
        headers.Authorization = `JWT ${this.hubJwtToken}`
      }

      const response = await this.registryClient.request<DockerHubRepoResponse>(
        `${this.config.baseUrl}/${this.config.apiVersion}/search/repositories/?query=${encodeURIComponent(query)}&page_size=${this.config.defaultPageSize}`,
        { headers },
      )

      return {
        items: response.results.map(repo => this.mapRepositoryResponse(repo)),
        page: 1,
        perPage: this.config.defaultPageSize,
        total: response.count,
        nextCursor: response.next,
      }
    } catch (error) {
      this.handleApiError(error, `Failed to search repositories with query: ${query}`)
    }
  }

  private mapRepositoryResponse(repo: DockerHubRepoResponse['results'][0]): Repository {
    return {
      name: repo.name,
      namespace: repo.namespace,
      fullName: `${repo.namespace}/${repo.name}`,
      description: repo.description,
      isPrivate: repo.is_private,
      isOfficial: repo.is_official,
      starCount: repo.star_count,
      pullCount: repo.pull_count,
      lastUpdated: repo.last_updated,
      tagCount: undefined, // Docker Hub doesn't provide this in listing
    }
  }

  async listTags(repo: string, options: ListOptions = {}): Promise<PaginatedResult<Tag>> {
    await this.authenticateHubApi()

    const page = options.page ?? 1
    const perPage = options.perPage ?? 25

    const headers: HeadersInit = {}
    if (this.hubJwtToken) {
      headers.Authorization = `JWT ${this.hubJwtToken}`
    }

    const response = await this.registryClient.request<DockerHubTagResponse>(
      `https://hub.docker.com/v2/repositories/${repo}/tags/?page=${page}&page_size=${perPage}`,
      { headers },
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
    await this.authenticateHubApi()

    type ManifestOrIndex = {
      schemaVersion?: number
      mediaType?: string
      digest?: string
      config?: ManifestBlobReference
      layers?: ManifestBlobReference[]
      // present when Docker Hub returns a manifest list (multi-arch)
      manifests?: Array<{
        mediaType: string
        size: number
        digest: string
        platform?: { architecture: string; os: string; variant?: string }
      }>
    }

    const response = await this.registryClient.request<ManifestOrIndex>(
      `https://registry-1.docker.io/v2/${repo}/manifests/${ref}`,
      {
        headers: {
          Accept: [
            "application/vnd.oci.image.manifest.v1+json",
            "application/vnd.docker.distribution.manifest.v2+json",
            "application/vnd.docker.distribution.manifest.list.v2+json",
            "application/vnd.oci.image.index.v1+json",
            "application/json",
          ].join(", "),
        },
      },
    )

    // Docker Hub frequently returns a manifest list for multi-arch images.
    // Resolve to linux/amd64, or fall back to the first entry.
    if (response.manifests && response.manifests.length > 0) {
      const preferred =
        response.manifests.find(
          (m) => m.platform?.os === "linux" && m.platform?.architecture === "amd64",
        ) ?? response.manifests[0]
      return this.getManifest(repo, preferred.digest)
    }

    // Single-arch manifest — config and layers must be present
    if (!response.config || !response.layers) {
      throw new Error(`Unexpected manifest format for ${repo}:${ref} — missing config or layers`)
    }

    const totalSize = response.config.size + response.layers.reduce((sum, layer) => sum + layer.size, 0)
    return {
      schemaVersion: response.schemaVersion ?? 2,
      mediaType: response.mediaType ?? "",
      config: response.config,
      layers: response.layers,
      digest: response.digest ?? ref,
      totalSize,
    }
  }

  async getConfig(repo: string, digest: string): Promise<ImageConfig> {
    await this.authenticateHubApi()
    return this.registryClient.request<ImageConfig>(
      `https://registry-1.docker.io/v2/${repo}/blobs/${digest}`,
    )
  }

  async deleteManifest(): Promise<void> {
    throw new UnsupportedError("Docker Hub does not support manifest deletion via API")
  }

  async authenticate(): Promise<void> {
    await this.authenticateHubApi()
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

  /**
   * Ensure authentication is set up before making API calls
   */
  private async ensureAuthenticated(): Promise<void> {
    await this.authenticateHubApi()
  }

  /**
   * Get the effective namespace to use for API calls
   */
  private getEffectiveNamespace(): string {
    // Use authenticated username if available (for private repos)
    // Otherwise use configured namespace or default to library
    return this.authenticatedUsername ??
      this.connection.namespace ??
      this.config.defaultNamespace
  }

  /**
   * Handle API errors with consistent logging and error transformation
   */
  private handleApiError(error: unknown, context: string): never {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[DockerHubProvider] ${context}:`, errorMessage)

    // Re-throw with context for better debugging
    throw new Error(`${context}: ${errorMessage}`)
  }

  /**
   * Authenticate with Docker Hub API using personal access token
   * This gets a JWT token for accessing private repositories and enhanced API features
   */
  private async authenticateHubApi(): Promise<void> {
    // Skip authentication if no credentials provided (public access only)
    if (!this.hasCredentials()) {
      return
    }

    // If we already have a valid JWT token, no need to re-authenticate
    if (this.isHubTokenValid()) {
      return
    }

    try {
      const authResponse = await this.performAuthentication()
      this.hubJwtToken = authResponse.token
      // Cache the expiry with a 30 s safety buffer; fall back to 55 min if no exp claim
      this.hubTokenExpiresAt = this.parseJwtExpiry(authResponse.token) ?? (Date.now() + 55 * 60 * 1000)
      this.authenticatedUsername = this.connection.credentials!.username ?? null

      // Verify the token works by making a test request
      await this.verifyAuthentication()

    } catch (error) {
      this.handleAuthenticationError(error)
    }
  }

  /**
   * Check if credentials are provided
   */
  private hasCredentials(): boolean {
    return Boolean(
      this.connection.credentials?.username &&
      this.connection.credentials?.password
    )
  }

  /**
   * Perform the actual authentication request
   */
  private async performAuthentication(): Promise<DockerHubAuthResponse> {
    return this.registryClient.request<DockerHubAuthResponse>(
      `${this.config.baseUrl}/${this.config.apiVersion}/users/login/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: this.connection.credentials!.username,
          password: this.connection.credentials!.password, // PAT or password
        }),
      },
    )
  }

  /**
   * Handle authentication errors with detailed logging
   */
  private handleAuthenticationError(error: unknown): never {
    const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error'

    console.error("[DockerHubProvider] Authentication failed:", {
      username: this.connection.credentials?.username,
      url: this.config.baseUrl,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    })

    throw new Error(
      `Docker Hub authentication failed: ${errorMessage}. ` +
      `Please verify your username and personal access token are correct.`
    )
  }

  /**
   * Verify that authentication is working by making a test request
   */
  private async verifyAuthentication(): Promise<void> {
    if (!this.hubJwtToken || !this.authenticatedUsername) {
      return
    }

    try {
      // Try to access user repositories to verify authentication
      await this.registryClient.request<DockerHubRepoResponse>(
        `${this.config.baseUrl}/${this.config.apiVersion}/repositories/${this.authenticatedUsername}/?page_size=1`,
        {
          headers: {
            Authorization: `JWT ${this.hubJwtToken}`
          },
        },
      )
    } catch (error) {
      console.warn("[DockerHubProvider] Authentication verification failed:", error)
      // Don't throw here, just log the warning as verification is optional
    }
  }
}
