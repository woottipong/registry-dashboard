// Registry management constants
export const REGISTRY_CONFIG = {
  // Search and filtering
  SEARCH_DEBOUNCE_MS: 300,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Status checking
  PING_INTERVAL_MS: 30000, // 30 seconds
  PING_TIMEOUT_MS: 5000,
  MAX_RETRY_ATTEMPTS: 3,
  
  // UI configuration
  SKELETON_COUNT: 4,
  ANIMATION_DURATION: 300,
  
  // Rate limiting
  RATE_LIMIT_WARNING_THRESHOLD: 80, // percentage
  RATE_LIMIT_CRITICAL_THRESHOLD: 95, // percentage
} as const

// Registry query keys for React Query
export const REGISTRY_QUERY_KEYS = {
  all: ['registries'] as const,
  byId: (id: string) => ['registries', id] as const,
  ping: (id: string) => ['registry-ping', id] as const,
  search: (query: string) => ['registries-search', query] as const,
} as const

// Registry status types
export type RegistryStatus = 'connected' | 'error' | 'checking' | 'offline'

// Registry provider types
export type RegistryProvider = 
  | 'dockerhub'
  | 'github'
  | 'gitlab'
  | 'aws-ecr'
  | 'gcp-artifact-registry'
  | 'azure-acr'
  | 'generic'

// Registry capability types
export interface RegistryCapabilities {
  canDelete: boolean
  canSearch: boolean
  hasRateLimit: boolean
  supportsTags: boolean
  supportsManifests: boolean
}

// Registry connection status
export interface RegistryConnectionStatus {
  status: RegistryStatus
  latencyMs?: number
  checkedAt?: string
  error?: string
}

// Registry rate limit info
export interface RegistryRateLimit {
  limit: number
  remaining: number
  resetAt?: string
}
