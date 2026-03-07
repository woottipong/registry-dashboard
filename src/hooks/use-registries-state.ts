import { useState, useCallback } from 'react'
import { useRegistries, useDeleteRegistry, useSetDefaultRegistry } from '@/hooks/use-registries'
import type { RegistryConnection } from '@/types/registry'

interface RegistryStatus {
  status: 'connected' | 'error' | 'checking'
  latencyMs?: number
  checkedAt?: string
}

interface UseRegistriesStateProps {
  initialRegistries?: RegistryConnection[]
}

interface UseRegistriesStateReturn {
  // Data
  registries: RegistryConnection[]
  isLoading: boolean
  isError: boolean

  // Actions
  handleDelete: (id: string) => void
  handleSetDefault: (id: string) => void

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
  // Status tracking
  const [registryStatuses, setRegistryStatuses] = useState<Record<string, RegistryStatus>>({})

  // Registry data
  const { data: registries = [], isLoading, isError } = useRegistries({
    initialData: initialRegistries,
  })

  // Mutations
  const deleteRegistry = useDeleteRegistry()
  const setDefaultRegistry = useSetDefaultRegistry()

  // Handle delete
  const handleDelete = useCallback((id: string) => {
    deleteRegistry.mutate(id, {
      onSuccess: () => {
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

    setDefaultRegistry.mutate({ id, registry })
  }, [registries, setDefaultRegistry])

  // Computed values
  const hasRegistries = registries.length > 0
  const isEmpty = !isLoading && !hasRegistries
  const hasError = isError

  return {
    // Data
    registries,
    isLoading,
    isError,

    // Actions
    handleDelete,
    handleSetDefault,

    // Status tracking
    registryStatuses,

    // Computed
    hasRegistries,
    isEmpty,
    hasError,
  }
}
