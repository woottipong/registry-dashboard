import { useCallback } from 'react'
import { useRegistries, useDeleteRegistry, useSetDefaultRegistry } from '@/hooks/use-registries'
import type { RegistryConnection } from '@/types/registry'

interface MutationCallbacks {
  onSuccess?: () => void
  onError?: (error: Error) => void
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
  handleDelete: (id: string, callbacks?: MutationCallbacks) => void
  handleSetDefault: (id: string, callbacks?: MutationCallbacks) => void
  isDeleting: boolean
  isSettingDefault: boolean

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
  const handleDelete = useCallback((id: string, callbacks?: MutationCallbacks) => {
    if (callbacks) {
      deleteRegistry.mutate(id, callbacks)
      return
    }

    deleteRegistry.mutate(id)
  }, [deleteRegistry])

  // Handle set default
  const handleSetDefault = useCallback((id: string, callbacks?: MutationCallbacks) => {
    const registry = registries.find(item => item.id === id)
    if (!registry) return

    if (callbacks) {
      setDefaultRegistry.mutate({ id, registry }, callbacks)
      return
    }

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
    isDeleting: deleteRegistry.isPending,
    isSettingDefault: setDefaultRegistry.isPending,

    // Computed
    hasRegistries,
    isEmpty,
    hasError,
  }
}
