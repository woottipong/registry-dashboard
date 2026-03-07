import { useMemo, useState, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useRegistries } from '@/hooks/use-registries'
import { useRepositories as useRepositoriesQuery, useSearchRepositories } from '@/hooks/use-repositories'
import { useDebounce } from '@/hooks/use-debounce'
import { REPOSITORY_CONFIG } from '@/lib/constants/repository'
import type { RegistryConnection, Repository } from '@/types/registry'

interface UseRepositoriesStateProps {
  initialRegistry: string
  initialRegistries: RegistryConnection[]
}

interface UseRepositoriesStateReturn {
  // State
  search: string
  debouncedSearch: string
  selectedRegistry: string

  // Data
  registries: RegistryConnection[]
  repositories: Repository[]
  isLoading: boolean
  isError: boolean

  // Actions
  handleSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleRegistryChange: (id: string) => void
  clearSearch: () => void
  refetch: () => void

  // Computed
  hasSearch: boolean
  isEmpty: boolean
  hasError: boolean
}

export function useRepositoriesState({ initialRegistry, initialRegistries }: UseRepositoriesStateProps): UseRepositoriesStateReturn {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const registryParam = searchParams.get('registry')

  // Search state
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, REPOSITORY_CONFIG.SEARCH_DEBOUNCE_MS)

  // Registry data
  const registriesQuery = useRegistries({
    initialData: initialRegistries,
  })

  // Selected registry logic
  const selectedRegistry = useMemo(() => {
    if (registryParam) return registryParam
    return initialRegistry
  }, [registryParam, initialRegistry])

  const isSearchMode = debouncedSearch.trim().length > 0

  // Repository queries — mutually exclusive: only one fires at a time
  const repositoriesQuery = useRepositoriesQuery(selectedRegistry, {
    page: REPOSITORY_CONFIG.DEFAULT_PAGE,
    perPage: REPOSITORY_CONFIG.DEFAULT_PAGE_SIZE,
    enabled: !isSearchMode,
  })

  // searchQuery already gates itself with enabled: Boolean(registryId && query.trim().length > 0)
  const searchQuery = useSearchRepositories(selectedRegistry, debouncedSearch)

  // Active result based on search state
  const activeResult = useMemo(() => {
    return isSearchMode ? searchQuery.data : repositoriesQuery.data
  }, [repositoriesQuery.data, searchQuery.data, isSearchMode])

  // Actions
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value)
  }, [])

  const handleRegistryChange = useCallback((id: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (id) {
      params.set('registry', id)
    } else {
      params.delete('registry')
    }
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  const clearSearch = useCallback(() => {
    setSearch('')
  }, [])

  const refetch = useCallback(() => {
    if (isSearchMode) {
      searchQuery.refetch()
    } else {
      repositoriesQuery.refetch()
    }
  }, [repositoriesQuery, searchQuery, isSearchMode])

  // Computed values — only check the active query
  const isLoading = isSearchMode ? searchQuery.isLoading : repositoriesQuery.isLoading
  const isError = isSearchMode ? searchQuery.isError : repositoriesQuery.isError
  const repositories = activeResult?.items ?? []
  const hasSearch = search.trim().length > 0
  const isEmpty = repositories.length === 0 && !isLoading
  const hasError = isError

  return {
    // State
    search,
    debouncedSearch,
    selectedRegistry,

    // Data
    registries: registriesQuery.data ?? [],
    repositories,
    isLoading,
    isError,

    // Actions
    handleSearchChange,
    handleRegistryChange,
    clearSearch,
    refetch,

    // Computed
    hasSearch,
    isEmpty,
    hasError,
  }
}
