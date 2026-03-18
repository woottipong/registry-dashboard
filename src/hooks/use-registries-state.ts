import { useCallback } from 'react'
import { useRegistries, useDeleteRegistry, useSetDefaultRegistry } from '@/hooks/use-registries'
import type { RegistryConnection } from '@/types/registry'

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

  // Computed
  hasRegistries: boolean
  isEmpty: boolean
  hasError: boolean
}

export function useRegistriesState({ initialRegistries }: UseRegistriesStateProps = {}): UseRegistriesStateReturn {
  const registriesQueryOptions =
    initialRegistries !== undefined ? { initialData: initialRegistries } : undefined

  // Registry data
  const { data: registries = [], isLoading, isError } = useRegistries(registriesQueryOptions)

  // Mutations
  const deleteRegistry = useDeleteRegistry()
  const setDefaultRegistry = useSetDefaultRegistry()

  // Handle delete
  const handleDelete = useCallback((id: string) => {
    deleteRegistry.mutate(id)
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

    // Computed
    hasRegistries,
    isEmpty,
    hasError,
  }
}
