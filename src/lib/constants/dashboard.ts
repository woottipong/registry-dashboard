// Dashboard configuration constants
export const DASHBOARD_CONFIG = {
  // Data fetching limits
  MAX_CHART_ITEMS: 10,
  MAX_ACTIVITIES: 50,
  REPOSITORIES_PAGE_SIZE: 1000,
  // First N registries load immediately; the rest wait until those complete
  EAGER_REGISTRY_COUNT: 3,

  // UI layout
  CONTAINER_MAX_WIDTH: 'max-w-[1200px]',

  // Animation durations
  FADE_IN_DURATION: 'duration-500',
  SLIDE_IN_DURATION: 'duration-500',

  // Activity storage
  MAX_STORED_ACTIVITIES: 1000,
  RECENT_ACTIVITY_HOURS: 24,

  // Loading states
  SKELETON_DELAY: 200,
} as const

// Query keys for consistent caching
export const DASHBOARD_QUERY_KEYS = {
  REGISTRIES: ['registries'] as const,
  REPOSITORIES: (registryId: string, page: number, perPage: number, search: string) =>
    ['repositories', registryId, page, perPage, search] as const,
} as const
