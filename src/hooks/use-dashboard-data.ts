import { useMemo } from "react"
import { useQueries } from "@tanstack/react-query"
import { useRegistries } from "@/hooks/use-registries"
import { fetchRepositories } from "@/hooks/use-repositories"
import { STALE_TIME_REPOSITORIES } from "@/lib/query-client"
import { DASHBOARD_CONFIG, DASHBOARD_QUERY_KEYS } from "@/lib/constants/dashboard"
import type { ProviderCapabilities, RegistryAuthType, RegistryConnection, RegistryCredentials, RegistryProviderType, Repository } from "@/types/registry"

interface DashboardData {
  totalRepositories: number
  totalTags: number
  totalSizeBytes: number
  chartData: Array<{ name: string; registryId: string; tagCount: number }>
  registriesWithStats: Array<{
    id: string
    name: string
    url: string
    provider: RegistryProviderType
    authType: RegistryAuthType
    credentials?: RegistryCredentials
    namespace?: string
    isDefault?: boolean
    capabilities?: ProviderCapabilities
    createdAt: string
    updatedAt?: string
    repoCount: number
    tagCount: number
    sizeBytes: number
  }>
}

interface UseDashboardDataOptions {
  initialRegistries?: RegistryConnection[]
}

export function useDashboardData({ initialRegistries }: UseDashboardDataOptions = {}) {
  const registriesQuery = useRegistries(
    initialRegistries !== undefined ? { initialData: initialRegistries } : undefined,
  )
  const memoizedRegistries = useMemo(() => registriesQuery.data ?? [], [registriesQuery.data])

  // Eager registries load immediately; deferred wait until eager ones complete
  const eagerRegistries = useMemo(
    () => memoizedRegistries.slice(0, DASHBOARD_CONFIG.EAGER_REGISTRY_COUNT),
    [memoizedRegistries]
  )
  const deferredRegistries = useMemo(
    () => memoizedRegistries.slice(DASHBOARD_CONFIG.EAGER_REGISTRY_COUNT),
    [memoizedRegistries]
  )

  const eagerQueries = useQueries({
    queries: eagerRegistries.map((registry) => ({
      queryKey: DASHBOARD_QUERY_KEYS.REPOSITORIES(registry.id, 1, DASHBOARD_CONFIG.REPOSITORIES_PAGE_SIZE, ""),
      queryFn: () => fetchRepositories(registry.id, { perPage: DASHBOARD_CONFIG.REPOSITORIES_PAGE_SIZE }),
      staleTime: STALE_TIME_REPOSITORIES,
      enabled: memoizedRegistries.length > 0,
    })),
  })

  const allEagerDone = eagerQueries.length === 0 || eagerQueries.every((q) => !q.isLoading)

  const deferredQueries = useQueries({
    queries: deferredRegistries.map((registry) => ({
      queryKey: DASHBOARD_QUERY_KEYS.REPOSITORIES(registry.id, 1, DASHBOARD_CONFIG.REPOSITORIES_PAGE_SIZE, ""),
      queryFn: () => fetchRepositories(registry.id, { perPage: DASHBOARD_CONFIG.REPOSITORIES_PAGE_SIZE }),
      staleTime: STALE_TIME_REPOSITORIES,
      enabled: allEagerDone,
    })),
  })

  const repoQueries = useMemo(
    () => [...eagerQueries, ...deferredQueries],
    [eagerQueries, deferredQueries],
  )

  const isLoadingRegistries = registriesQuery.isLoading
  const isLoadingRepos = repoQueries.some((q) => q.isLoading)

  // Optimize stats calculation with better memoization
  const dashboardData = useMemo((): DashboardData => {
    // Early return if no data yet
    if (memoizedRegistries.length === 0) {
      return {
        totalRepositories: 0,
        totalTags: 0,
        totalSizeBytes: 0,
        chartData: [],
        registriesWithStats: []
      }
    }

    const allRepos: { name: string; registryId: string; tagCount: number }[] = []
    let totalRepos = 0
    let totalTagsCount = 0
    let totalSize = 0

    const regStats = memoizedRegistries.map((registry, index) => {
      const queryResult = repoQueries[index]

      // If query is still loading, use cached or partial data
      const repos = queryResult?.data?.items ?? []
      const repoCount = repos.length
      // For providers that don't provide tag counts (like Docker Hub),
      // we'll leave tagCount undefined until we can fetch it separately
      const tagCount = repos.some(r => r.tagCount !== undefined) ?
        repos.reduce((sum: number, r: Repository) => sum + (r.tagCount ?? 0), 0) : undefined
      const sizeBytes = repos.reduce((sum: number, r: Repository) => sum + (r.sizeBytes ?? 0), 0)

      // Only add to chart data if we have repositories
      if (repoCount > 0) {
        repos.forEach((r: Repository) => {
          if ((r.tagCount ?? 0) > 0) {
            allRepos.push({
              name: r.fullName,
              registryId: registry.id,
              tagCount: r.tagCount ?? 0,
            })
          }
        })
      }

      totalRepos += repoCount
      totalTagsCount += tagCount ?? 0  // Only add if tagCount is defined
      totalSize += sizeBytes

      return {
        ...registry,
        repoCount,
        tagCount: tagCount ?? 0,  // Ensure tagCount is always a number
        sizeBytes
      }
    })

    // Sort and limit chart data for better performance
    const sortedChartData = allRepos
      .sort((a, b) => b.tagCount - a.tagCount)
      .slice(0, DASHBOARD_CONFIG.MAX_CHART_ITEMS)

    return {
      totalRepositories: totalRepos,
      totalTags: totalTagsCount,
      totalSizeBytes: totalSize,
      chartData: sortedChartData,
      registriesWithStats: regStats
    }
  }, [memoizedRegistries, repoQueries])

  return {
    dashboardData,
    isLoadingRegistries,
    isLoadingRepos,
    registries: memoizedRegistries,
  }
}
