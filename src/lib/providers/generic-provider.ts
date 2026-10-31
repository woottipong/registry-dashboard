import { createHash } from "node:crypto"
import { RegistryHttpClient } from "@/lib/registry-client"
import * as z from "zod"
import { parseRepositoryName } from "@/lib/format"
import type { ImageConfig, ImageIndex, ImageManifest } from "@/types/manifest"
import type { Namespace, RegistryConnection, Repository, Tag } from "@/types/registry"
import type { ListOptions, PaginatedResult, RegistryProvider } from "@/lib/providers/types"

const INDEX_MEDIA_TYPES = new Set([
  "application/vnd.oci.image.index.v1+json",
  "application/vnd.docker.distribution.manifest.list.v2+json",
])

const MANIFEST_ACCEPT_HEADER = [
  "application/vnd.oci.image.index.v1+json",
  "application/vnd.oci.image.manifest.v1+json",
  "application/vnd.docker.distribution.manifest.list.v2+json",
  "application/vnd.docker.distribution.manifest.v2+json",
  "application/json",
].join(", ")

interface CatalogResponse {
  repositories?: string[]
}

interface TagListResponse {
  name: string
  tags: string[] | null
}

const catalogResponseSchema = z.object({
  repositories: z.array(z.string()).nullable().optional(),
})

const tagListResponseSchema = z.object({
  name: z.string(),
  tags: z.array(z.string()).nullable(),
})

function getMaxCatalogPages(): number {
  const parsed = Number.parseInt(process.env.MAX_CATALOG_PAGES ?? "100", 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100
}

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

export class GenericProvider implements RegistryProvider {
  readonly type = "generic" as const
  private readonly client: RegistryHttpClient

  // Shared process-level caches across per-request provider instances
  private static readonly catalogCache = new Map<string, CacheEntry<string[]>>()
  private static readonly tagCountCache = new Map<string, CacheEntry<number>>()
  private static readonly inFlightCatalog = new Map<string, Promise<string[]>>()

  private static readonly CATALOG_CACHE_TTL_MS = 60 * 1000
  private static readonly TAG_COUNT_CACHE_TTL_MS = 60 * 1000
  private static readonly MAX_CACHE_ENTRIES = 500

  static clearCaches(): void {
    GenericProvider.catalogCache.clear()
    GenericProvider.tagCountCache.clear()
    GenericProvider.inFlightCatalog.clear()
  }

  private static setBoundedCache<T>(map: Map<string, CacheEntry<T>>, key: string, entry: CacheEntry<T>): void {
    if (map.size >= GenericProvider.MAX_CACHE_ENTRIES) {
      const now = Date.now()
      for (const [k, v] of map.entries()) {
        if (v.expiresAt <= now) {
          map.delete(k)
        }
      }
      if (map.size >= GenericProvider.MAX_CACHE_ENTRIES) {
        let countToDelete = Math.ceil(GenericProvider.MAX_CACHE_ENTRIES * 0.2)
        for (const k of map.keys()) {
          map.delete(k)
          if (--countToDelete <= 0) break
        }
      }
    }
    map.set(key, entry)
  }

  private getCachePrefix(): string {
    const { id, url, authType, credentials } = this.connection
    return createHash("sha256").update(JSON.stringify([id, url, authType, credentials?.username, credentials?.password, credentials?.token])).digest("hex")
  }

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

  async listNamespaces(): Promise<Namespace[]> {
    // Single catalog request — derive namespaces from repo path prefixes, no N+1 tag fetches
    const allRepoNames = await this.fetchAllCatalogNames()

    const countMap = new Map<string, number>()
    for (const repoName of allRepoNames) {
      const { namespace } = parseRepositoryName(repoName)
      countMap.set(namespace, (countMap.get(namespace) ?? 0) + 1)
    }

    return Array.from(countMap.entries())
      .map(([name, repositoryCount]) => ({ name, repositoryCount }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  async listRepositories(options: ListOptions & { namespace?: string } = {}): Promise<PaginatedResult<Repository>> {
    const page = options.page ?? 1
    const perPage = options.perPage ?? 10000

    // Fetch ALL repo names from catalog by following Link headers
    const allRepoNames = await this.fetchAllCatalogNames()

    // Filter by namespace before fetching tag counts
    // Empty string namespace means repos with no path separator (root-level repos)
    const filteredNames = options.namespace !== undefined
      ? allRepoNames.filter(repoName => {
          const { namespace } = parseRepositoryName(repoName)
          return namespace === options.namespace
        })
      : allRepoNames

    const total = filteredNames.length
    const start = (page - 1) * perPage
    const pageNames = filteredNames.slice(start, start + perPage)

    const repositories = await this.hydrateRepositories(pageNames)

    return {
      items: repositories,
      page,
      perPage,
      total,
      nextCursor: null,
    }
  }

  private async hydrateRepositories(pageNames: string[]): Promise<Repository[]> {
    const prefix = this.getCachePrefix()
    const repositories: (Repository | null)[] = await Promise.all(
      pageNames.map(async (repoName) => {
        try {
          const cacheKey = `${prefix}:${repoName}`
          const now = Date.now()
          const cached = GenericProvider.tagCountCache.get(cacheKey)

          let tagCount: number
          if (cached && cached.expiresAt > now) {
            tagCount = cached.data
          } else {
            const tags = await this.fetchAllTagNames(repoName)
            tagCount = tags.length
            GenericProvider.setBoundedCache(GenericProvider.tagCountCache, cacheKey, {
              data: tagCount,
              expiresAt: now + GenericProvider.TAG_COUNT_CACHE_TTL_MS,
            })
          }

          // Skip repos with no tags — registry:2 keeps catalog entries even after all manifests are deleted
          if (tagCount === 0) return null

          const { namespace, name } = parseRepositoryName(repoName)
          return {
            name,
            fullName: repoName,
            namespace,
            tagCount,
          }
        } catch {
          const { namespace, name } = parseRepositoryName(repoName)
          return { name, fullName: repoName, namespace }
        }
      }),
    )

    return repositories.filter((repo): repo is Repository => repo !== null)
  }

  private async fetchAllCatalogNames(): Promise<string[]> {
    const cacheKey = this.getCachePrefix()
    const now = Date.now()
    const cached = GenericProvider.catalogCache.get(cacheKey)
    if (cached && cached.expiresAt > now) {
      return cached.data
    }

    const inFlight = GenericProvider.inFlightCatalog.get(cacheKey)
    if (inFlight) {
      return inFlight
    }

    const fetchPromise = (async () => {
      try {
        const allNames: string[] = []
        // Fetch in large batches to minimise round-trips
        const batchSize = 1000
        const maxCatalogPages = getMaxCatalogPages()
        let url: string | null = `/v2/_catalog?n=${batchSize}`
        let pageCount = 0

        while (url) {
          if (pageCount >= maxCatalogPages) {
            console.warn(`[GenericProvider] Catalog page cap reached for ${this.connection.url}`, {
              maxPages: maxCatalogPages,
            })
            break
          }

          const { body, linkHeader } = await this.client.requestWithHeaders<CatalogResponse>(url)
          const parsedBody = catalogResponseSchema.parse(body)
          allNames.push(...(parsedBody.repositories ?? []))
          url = parseLinkNext(linkHeader)
          pageCount += 1
        }

        GenericProvider.setBoundedCache(GenericProvider.catalogCache, cacheKey, {
          data: allNames,
          expiresAt: Date.now() + GenericProvider.CATALOG_CACHE_TTL_MS,
        })

        return allNames
      } finally {
        GenericProvider.inFlightCatalog.delete(cacheKey)
      }
    })()

    GenericProvider.inFlightCatalog.set(cacheKey, fetchPromise)
    return fetchPromise
  }

  async listTags(repo: string, options: ListOptions = {}): Promise<PaginatedResult<Tag>> {
    const rawTagNames = await this.fetchAllTagNames(repo)
    const searchQuery = (options.search ?? options.query ?? "").trim().toLowerCase()
    const tagNames = searchQuery
      ? rawTagNames.filter((t) => t.toLowerCase().includes(searchQuery))
      : rawTagNames
    const page = options.page ?? 1
    const perPage = options.perPage ?? 50
    const start = (page - 1) * perPage
    const pageTagNames = tagNames.slice(start, start + perPage)

    const resolvedTags = await Promise.all(
      pageTagNames.map((tagName) => this.resolveTag(repo, tagName)),
    )

    return {
      items: resolvedTags,
      page,
      perPage,
      total: tagNames.length,
      nextCursor: null,
    }
  }

  private async fetchAllTagNames(repo: string): Promise<string[]> {
    const rawTagNames: string[] = []
    const seenNames = new Set<string>()
    const visited = new Set<string>()
    let url: string | null = `/v2/${repo}/tags/list`
    while (url) {
      if (visited.has(url) || visited.size >= getMaxCatalogPages()) {
        throw new Error("Tag listing pagination did not complete")
      }
      visited.add(url)
      const { body, linkHeader } = await this.client.requestWithHeaders<TagListResponse>(url)
      for (const name of tagListResponseSchema.parse(body).tags ?? []) {
        if (seenNames.has(name)) throw new Error("Tag listing contains duplicate names")
        seenNames.add(name)
        rawTagNames.push(name)
      }
      url = parseTagNext(linkHeader, repo)
    }
    return rawTagNames
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
    const { body: raw, contentDigest } = await this.client.requestWithHeaders<
      (Omit<ImageManifest, "digest" | "totalSize"> | ImageIndex) & { digest?: string }
    >(`/v2/${repo}/manifests/${ref}`, {
      headers: { Accept: MANIFEST_ACCEPT_HEADER },
    })

    if (INDEX_MEDIA_TYPES.has(raw.mediaType)) {
      const index = raw as ImageIndex & { digest?: string }
      const preferred =
        index.manifests.find(
          (manifest) => manifest.platform?.os === "linux" && manifest.platform?.architecture === "amd64",
        ) ?? index.manifests[0]

      if (!preferred) {
        throw new Error(`Manifest index for ${repo}:${ref} has no platform manifests`)
      }

      return this.getManifest(repo, preferred.digest)
    }

    const manifest = raw as Omit<ImageManifest, "digest" | "totalSize"> & { digest?: string }
    if (!manifest.config || !manifest.layers) {
      throw new Error(`Unexpected manifest format for ${repo}:${ref} — missing config or layers`)
    }

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
    try {
      const base = this.connection.url.replace(/\/$/, "")
      const url = `${base}/v2/${repo}/manifests/${ref}`

      // Build auth header manually from connection credentials
      const headers: Record<string, string> = { Accept: MANIFEST_ACCEPT_HEADER }
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

    const prefix = this.getCachePrefix()
    GenericProvider.tagCountCache.delete(`${prefix}:${repo}`)
    GenericProvider.catalogCache.delete(prefix)
  }

  async searchRepositories(query: string, options: ListOptions = {}): Promise<PaginatedResult<Repository>> {
    const allRepoNames = await this.fetchAllCatalogNames()
    const queryLower = query.trim().toLowerCase()

    const matchingNames = allRepoNames.filter((repoName) =>
      repoName.toLowerCase().includes(queryLower),
    )

    const page = options.page ?? 1
    const perPage = options.perPage ?? 50
    const start = (page - 1) * perPage
    const pageNames = matchingNames.slice(start, start + perPage)
    const repositories = await this.hydrateRepositories(pageNames)

    return {
      items: repositories,
      page,
      perPage,
      total: matchingNames.length,
      nextCursor: null,
    }
  }

  async authenticate(): Promise<void> {
    await this.ping()
  }

  capabilities() {
    return {
      canListCatalog: true,
      canDelete: true,
      canSearch: true,
      hasRateLimit: false,
    }
  }
}

function splitLinkHeader(value: string, separator: string): string[] {
  const parts: string[] = []
  let start = 0
  let quoted = false
  let inUrl = false
  let escaped = false
  for (let i = 0; i < value.length; i++) {
    const char = value[i]
    if (escaped) { escaped = false; continue }
    if (quoted && char === "\\") { escaped = true; continue }
    if (!inUrl && char === '"') quoted = !quoted
    else if (!quoted && char === "<") inUrl = true
    else if (!quoted && char === ">") inUrl = false
    else if (!quoted && !inUrl && char === separator) {
      parts.push(value.slice(start, i))
      start = i + 1
    }
  }
  if (quoted || inUrl) throw new Error("Invalid tag listing pagination link")
  parts.push(value.slice(start))
  return parts
}

function parseTagNext(linkHeader: string | null, repo: string): string | null {
  if (!linkHeader) return null
  let next: string | null = null
  for (const link of splitLinkHeader(linkHeader, ",")) {
    const [target, ...parameters] = splitLinkHeader(link, ";")
    const match = target.match(/^\s*<([^>]+)>\s*$/)
    const relations = parameters.filter((parameter) => /^\s*rel\s*=/i.test(parameter))
    const rel = relations[0]?.match(/^\s*rel\s*=\s*(?:"([^"]+)"|([^\s]+))\s*$/i)
    if (!match || relations.length !== 1 || !rel || (rel[1] ?? rel[2]).includes("\\")) {
      throw new Error("Invalid tag listing pagination link")
    }
    if (!(rel[1] ?? rel[2]).toLowerCase().split(/\s+/).includes("next")) continue
    if (next) throw new Error("Invalid tag listing pagination link")
    const parsed = new URL(match[1], `http://placeholder/v2/${repo}/tags/list`)
    if (parsed.pathname !== `/v2/${repo}/tags/list`) throw new Error("Invalid tag listing pagination link")
    next = `${parsed.pathname}${parsed.search}`
  }
  return next
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
