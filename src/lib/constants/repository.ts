// Repository management constants
export const REPOSITORY_CONFIG = {
  // Search configuration
  SEARCH_DEBOUNCE_MS: 300,
  SEARCH_MIN_LENGTH: 1,
  MAX_SEARCH_RESULTS: 100,
  
  // Pagination
  DEFAULT_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
  
  // UI configuration
  SKELETON_COUNT: 8,
  ANIMATION_DURATION: 300,
  
  // Registry selection
  ALL_REGISTRIES_ID: 'all',
} as const

// Repository query keys for React Query
export const REPOSITORY_QUERY_KEYS = {
  repositories: (registryId: string, page: number, perPage: number, search?: string) =>
    ['repositories', registryId, page, perPage, search] as const,
  search: (registryId: string, search: string) =>
    ['repositories-search', registryId, search] as const,
} as const

// Repository view modes
export type RepositoryViewMode = 'table' | 'grid' | 'list'

// Repository sorting options
export type RepositorySortOption = 'name' | 'updated' | 'size' | 'tags'

// Repository filter options
export interface RepositoryFilters {
  search?: string
  registry?: string
  tags?: string
  sortBy?: RepositorySortOption
  sortOrder?: 'asc' | 'desc'
}
