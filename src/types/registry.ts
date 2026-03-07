export type RegistryProviderType = "generic" | "dockerhub"

export type RegistryAuthType = "none" | "basic" | "bearer"

export interface ProviderCapabilities {
  canListCatalog: boolean
  canDelete: boolean
  canSearch: boolean
  hasRateLimit: boolean
}

export interface RegistryRateLimit {
  limit: number | null
  remaining: number | null
  resetAt?: string | null
}

export interface RegistryCredentials {
  username?: string
  password?: string
  token?: string
}

export interface RegistryConnection {
  id: string
  name: string
  url: string
  provider: RegistryProviderType
  authType: RegistryAuthType
  credentials?: RegistryCredentials
  // Set by the API when credentials are present but not returned (server-side only)
  hasCredentials?: boolean
  namespace?: string
  isDefault?: boolean
  capabilities?: ProviderCapabilities
  rateLimit?: RegistryRateLimit
  createdAt: string
  updatedAt?: string
}

export interface Namespace {
  name: string
  repositoryCount: number
}

export interface Repository {
  name: string
  namespace?: string
  fullName: string
  description?: string
  isPrivate?: boolean
  isOfficial?: boolean
  starCount?: number
  pullCount?: number
  tagCount?: number
  sizeBytes?: number
  lastUpdated?: string | null
}

export interface Tag {
  name: string
  digest: string
  mediaType?: string
  size: number
  createdAt: string | null
  architecture: string
  os: string
}
