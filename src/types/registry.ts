export type RegistryProviderType =
  | "generic"
  | "dockerhub"
  | "ghcr"
  | "ecr"
  | "gcr"
  | "acr"

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
  namespace?: string
  isDefault?: boolean
  capabilities?: ProviderCapabilities
  rateLimit?: RegistryRateLimit
  createdAt: string
  updatedAt: string
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
