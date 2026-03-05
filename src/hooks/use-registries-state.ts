import { useMemo, useState, useCallback, useEffect } from 'react'
import { useRegistries, useDeleteRegistry, useSetDefaultRegistry, usePingRegistry } from '@/hooks/use-registries'
import { REGISTRY_CONFIG, REGISTRY_QUERY_KEYS } from '@/lib/constants/registry'
import type { RegistryConnection } from '@/types/registry'

interface UseRegistriesStateProps {
  initialRegistries?: RegistryConnection[]
}

interface UseRegistriesStateReturn {
  // Data
  registries: RegistryConnection[]
  isLoading: boolean
  isError: boolean
  
  // Search and filtering
  searchQuery: string
  setSearchQuery: (query: string) => void
  filteredRegistries: RegistryConnection[]
  
  // Actions
  handleDelete: (id: string) => void
  handleSetDefault: (id: string) => void
  handlePing: (id: string) => void
  
  // Status tracking
  registryStatuses: Record<string, {
    status: 'connected' | 'error' | 'checking'
    latencyMs?: number
    checkedAt?: string
  }>
  
  // Computed
  hasRegistries: boolean
  isEmpty: boolean
  hasError: boolean
}

export function useRegistriesState({ initialRegistries = [] }: UseRegistriesStateProps = {}): UseRegistriesStateReturn {
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  
  // Status tracking
  const [registryStatuses, setRegistryStatuses] = useState<Record<string, any>>({})
  
  // Registry data
  const { data: registries = [], isLoading, isError } = useRegistries({
    initialData: initialRegistries,
  })
  
  // Mutations
  const deleteRegistry = useDeleteRegistry()
  const setDefaultRegistry = useSetDefaultRegistry()
  
  // Filter registries based on search
  const filteredRegistries = useMemo(() => {
    if (!searchQuery.trim()) return registries
    
    const query = searchQuery.toLowerCase()
    return registries.filter(registry => 
      registry.name.toLowerCase().includes(query) ||
      registry.url.toLowerCase().includes(query) ||
      registry.provider?.toLowerCase().includes(query)
    )
  }, [registries, searchQuery])
  
  // Handle delete
  const handleDelete = useCallback((id: string) => {
    deleteRegistry.mutate(id, {
      onSuccess: () => {
        // Clear status for deleted registry
        setRegistryStatuses(prev => {
          const newStatuses = { ...prev }
          delete newStatuses[id]
          return newStatuses
        })
      }
    })
  }, [deleteRegistry])
  
  // Handle set default
  const handleSetDefault = useCallback((id: string) => {
    const registry = registries.find(item => item.id === id)
    if (!registry) return
    
    setDefaultRegistry.mutate(
      { id, registry },
      {
        onSuccess: () => {
          // Update registries to reflect new default
          // This will trigger a refetch automatically
        }
      }
    )
  }, [registries, setDefaultRegistry])
  
  // Handle ping
  const handlePing = useCallback((id: string) => {
    // Update status to checking
    setRegistryStatuses(prev => ({
      ...prev,
      [id]: { status: 'checking', checkedAt: new Date().toISOString() }
    }))
    
    // This would be handled by the individual registry card's ping hook
    // For now, just update the status
  }, [])
  
  // Computed values
  const hasRegistries = registries.length > 0
  const isEmpty = !isLoading && !hasRegistries
  const hasError = isError
  
  return {
    // Data
    registries,
    isLoading,
    isError,
    
    // Search and filtering
    searchQuery,
    setSearchQuery,
    filteredRegistries,
    
    // Actions
    handleDelete,
    handleSetDefault,
    handlePing,
    
    // Status tracking
    registryStatuses,
    
    // Computed
    hasRegistries,
    isEmpty,
    hasError,
  }
}
