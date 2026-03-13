import type { RegistryConnection, RegistryRateLimit } from "@/types/registry"

const DEFAULT_TIMEOUT_MS = 10_000
const DEFAULT_RETRIES = 2

interface RequestOptions extends RequestInit {
  timeoutMs?: number
  retries?: number
  skipAuthRetry?: boolean
}

interface BearerChallenge {
  realm: string
  service?: string
  scope?: string
}

export class RegistryHttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message)
    this.name = "RegistryHttpError"
  }
}

export class RegistryHttpClient {
  private bearerToken: string | null
  private rateLimit: RegistryRateLimit = {
    limit: null,
    remaining: null,
    resetAt: null,
  }

  constructor(private readonly connection: RegistryConnection) {
    this.bearerToken = connection.credentials?.token ?? null
  }

  getRateLimit(): RegistryRateLimit {
    return this.rateLimit
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { timeoutMs = DEFAULT_TIMEOUT_MS, retries = DEFAULT_RETRIES, ...init } = options

    let lastError: unknown

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        return await this.fetchOnce<T>(path, { ...init, timeoutMs })
      } catch (error) {
        lastError = error
        const shouldRetry = this.shouldRetry(error, attempt, retries)
        if (!shouldRetry) {
          throw error
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error("Unknown request error")
  }

  async requestWithHeaders<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<{ body: T; linkHeader: string | null; contentDigest: string | null }> {
    const { timeoutMs = DEFAULT_TIMEOUT_MS, retries = DEFAULT_RETRIES, ...init } = options

    let lastError: unknown

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        return await this.fetchOnceWithHeaders<T>(path, { ...init, timeoutMs })
      } catch (error) {
        lastError = error
        const shouldRetry = this.shouldRetry(error, attempt, retries)
        if (!shouldRetry) {
          throw error
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error("Unknown request error")
  }

  private async fetchOnce<T>(
    path: string,
    options: RequestOptions & { timeoutMs: number },
  ): Promise<T> {
    const { body } = await this.fetchOnceWithHeaders<T>(path, options)
    return body
  }

  private async fetchOnceWithHeaders<T>(
    path: string,
    options: RequestOptions & { timeoutMs: number },
  ): Promise<{ body: T; linkHeader: string | null; contentDigest: string | null }> {
    const controller = new AbortController()
    const timeoutHandle = setTimeout(() => controller.abort(), options.timeoutMs)
    const fullUrl = this.toUrl(path)

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers: this.buildHeaders(options.headers),
        signal: controller.signal,
      })

      this.captureRateLimit(response)

      if (response.status === 401 && !options.skipAuthRetry) {
        await this.handleAuthenticationChallenge(response)
        return this.fetchOnceWithHeaders<T>(path, { ...options, skipAuthRetry: true })
      }

      if (!response.ok) {
        const body = await this.readJsonBody<unknown>(response)
        throw new RegistryHttpError(
          `Registry request failed: ${response.status} ${response.statusText}`,
          response.status,
          body,
        )
      }

      const linkHeader = response.headers.get("link")
      const contentDigest = response.headers.get("Docker-Content-Digest")

      if (response.status === 204) {
        return { body: undefined as T, linkHeader, contentDigest }
      }

      const body = await this.readJsonBody<T>(response)
      return { body, linkHeader, contentDigest }
    } catch (error) {
      const isAbort = error instanceof Error && error.name === "AbortError"
      const detail = isAbort
        ? `timed out after ${options.timeoutMs}ms`
        : error instanceof Error
          ? `${error.name}: ${error.message}${error.cause instanceof Error ? ` (cause: ${error.cause.message})` : ""}`
          : String(error)
      if (process.env.NODE_ENV === "development") {
        console.error(`Registry HTTP request failed [${isAbort ? "TIMEOUT" : "ERROR"}]:`, {
          url: fullUrl,
          detail,
        })
      } else {
        console.error(`Registry HTTP request failed [${isAbort ? "TIMEOUT" : "ERROR"}]:`, detail)
      }
      if (isAbort) {
        throw new Error(`Registry request timed out after ${options.timeoutMs}ms (${fullUrl})`)
      }
      throw error
    } finally {
      clearTimeout(timeoutHandle)
    }
  }

  private buildHeaders(headers?: HeadersInit): Headers {
    const mergedHeaders = new Headers(headers)

    if (!mergedHeaders.has("Accept")) {
      mergedHeaders.set("Accept", "application/json")
    }

    if (!mergedHeaders.has("Content-Type")) {
      mergedHeaders.set("Content-Type", "application/json")
    }

    const authHeader = this.buildAuthHeader()
    if (authHeader && !mergedHeaders.has("Authorization")) {
      mergedHeaders.set("Authorization", authHeader)
    }

    return mergedHeaders
  }

  private buildAuthHeader(): string | null {
    // Prioritise a Bearer token that was acquired dynamically via a 401 token-challenge
    // exchange. This is required for registries (incl. Docker Hub) that refuse Basic auth
    // on the registry API even when the connection is configured as "basic".
    if (this.bearerToken) {
      return `Bearer ${this.bearerToken}`
    }

    if (this.connection.authType === "basic") {
      const username = this.connection.credentials?.username ?? ""
      const password = this.connection.credentials?.password ?? ""
      return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`
    }

    return null
  }

  /** Hostnames that must never receive credential-bearing token requests. */
  private static readonly BLOCKED_TOKEN_HOSTS = new Set([
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "169.254.169.254",    // AWS/GCP metadata
    "metadata.google.internal",
  ])

  /** Known, trusted token endpoints that are always allowed. */
  private static readonly TRUSTED_TOKEN_HOSTS = new Set([
    "auth.docker.io",
    "ghcr.io",
    "gcr.io",
    "oauth2.googleapis.com",
  ])

  private validateTokenUrl(tokenUrl: URL): void {
    const hostname = tokenUrl.hostname.toLowerCase()

    if (RegistryHttpClient.BLOCKED_TOKEN_HOSTS.has(hostname)) {
      throw new Error(`Token exchange blocked: ${hostname} is not an allowed token endpoint`)
    }

    // If the realm host matches the registry host, it's always allowed.
    const registryHost = new URL(this.connection.url).hostname.toLowerCase()
    if (hostname === registryHost) return

    // Allow known auth providers unconditionally.
    if (RegistryHttpClient.TRUSTED_TOKEN_HOSTS.has(hostname)) return

    // For unknown hosts, only allow HTTPS to prevent credential leakage.
    if (tokenUrl.protocol !== "https:") {
      throw new Error(`Token exchange blocked: ${hostname} must use HTTPS`)
    }
  }

  private async handleAuthenticationChallenge(response: Response): Promise<void> {
    const challengeHeader = response.headers.get("www-authenticate")

    if (!challengeHeader || !challengeHeader.toLowerCase().startsWith("bearer")) {
      return
    }

    const challenge = this.parseBearerChallenge(challengeHeader)
    if (!challenge?.realm) {
      return
    }

    const tokenUrl = new URL(challenge.realm)
    if (challenge.service) tokenUrl.searchParams.set("service", challenge.service)
    if (challenge.scope) tokenUrl.searchParams.set("scope", challenge.scope)

    this.validateTokenUrl(tokenUrl)

    const tokenResponse = await fetch(tokenUrl, {
      headers: this.buildTokenHeaders(),
    })

    if (!tokenResponse.ok) {
      throw new RegistryHttpError(
        `Token exchange failed: ${tokenResponse.status} ${tokenResponse.statusText}`,
        tokenResponse.status,
      )
    }

    const tokenBody = await tokenResponse.json()
    const token = (tokenBody.token ?? tokenBody.access_token) as string | undefined

    if (!token) {
      throw new Error("Token exchange did not return an access token")
    }

    this.bearerToken = token
  }

  private buildTokenHeaders(): Headers {
    const headers = new Headers()

    if (this.connection.credentials?.username && this.connection.credentials?.password) {
      const credentials = `${this.connection.credentials.username}:${this.connection.credentials.password}`
      headers.set("Authorization", `Basic ${Buffer.from(credentials).toString("base64")}`)
    }

    return headers
  }

  private parseBearerChallenge(headerValue: string): BearerChallenge | null {
    const [, rawParams] = headerValue.split(/\s+/, 2)
    if (!rawParams) {
      return null
    }

    const params = rawParams.match(/(\w+)="([^"]+)"/g) ?? []
    const challenge: BearerChallenge = { realm: "" }

    for (const pair of params) {
      const [, key, value] = pair.match(/(\w+)="([^"]+)"/) ?? []
      if (!key || !value) continue
      if (key === "realm") challenge.realm = value
      if (key === "service") challenge.service = value
      if (key === "scope") challenge.scope = value
    }

    return challenge.realm ? challenge : null
  }

  private captureRateLimit(response: Response) {
    const limitRaw = response.headers.get("ratelimit-limit")
    const remainingRaw = response.headers.get("ratelimit-remaining")

    if (!limitRaw && !remainingRaw) {
      return
    }

    this.rateLimit = {
      limit: this.parseRateValue(limitRaw),
      remaining: this.parseRateValue(remainingRaw),
      resetAt: this.rateLimit.resetAt ?? null,
    }
  }

  private parseRateValue(value: string | null): number | null {
    if (!value) {
      return null
    }

    const normalized = value.split(";")[0]
    const parsed = Number.parseInt(normalized, 10)
    return Number.isFinite(parsed) ? parsed : null
  }

  private shouldRetry(error: unknown, attempt: number, maxRetries: number): boolean {
    if (attempt >= maxRetries) {
      return false
    }

    if (error instanceof RegistryHttpError) {
      if (error.status >= 500) return true
      if (error.status === 429) return true
      return false
    }

    // AbortError (original) and re-wrapped timeout errors are both retryable
    if (error instanceof Error && error.name === "AbortError") {
      return true
    }
    if (error instanceof Error && error.message.includes("timed out after")) {
      return true
    }

    return true
  }

  private async readJsonBody<T>(response: Response): Promise<T> {
    const textBody = await response.text()

    if (!textBody) {
      return {} as T
    }

    try {
      return JSON.parse(textBody) as T
    } catch {
      return textBody as T
    }
  }

  private toUrl(path: string): string {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path
    }

    const base = this.connection.url.replace(/\/$/, "")
    const normalizedPath = path.startsWith("/") ? path : `/${path}`

    return `${base}${normalizedPath}`
  }
}
