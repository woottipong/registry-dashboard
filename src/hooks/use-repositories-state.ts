import { useMemo, useState, useCallback, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useRegistries } from '@/hooks/use-registries'
import { useRepositories as useRepositoriesQuery, useSearchRepositories } from '@/hooks/use-repositories'
import { REPOSITORY_CONFIG } from '@/lib/constants/repository'
import type { RegistryConnection } from '@/types/registry'

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
  repositories: any[]
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
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, REPOSITORY_CONFIG.SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [search])

  // Registry data
  const registriesQuery = useRegistries({
    initialData: initialRegistries,
  })

  // Selected registry logic
  const selectedRegistry = useMemo(() => {
    if (registryParam) return registryParam
    return initialRegistry
  }, [registryParam, initialRegistry])

  // Repository queries
  const repositoriesQuery = useRepositoriesQuery(selectedRegistry, {
    page: REPOSITORY_CONFIG.DEFAULT_PAGE,
    perPage: REPOSITORY_CONFIG.DEFAULT_PAGE_SIZE,
    search: debouncedSearch || undefined,
  })

  const searchQuery = useSearchRepositories(selectedRegistry, debouncedSearch)

  // Active result based on search state
  const activeResult = useMemo(() => {
    if (debouncedSearch.trim().length > 0) {
      return searchQuery.data
    }
    return repositoriesQuery.data
  }, [repositoriesQuery.data, searchQuery.data, debouncedSearch])

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
    repositoriesQuery.refetch()
    if (debouncedSearch.trim().length > 0) {
      searchQuery.refetch()
    }
  }, [repositoriesQuery, searchQuery, debouncedSearch])

  // Computed values
  const isLoading = repositoriesQuery.isLoading || searchQuery.isLoading
  const isError = repositoriesQuery.isError || searchQuery.isError
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
