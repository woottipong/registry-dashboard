"use client"

import { RepoGroupedView } from "@/components/repository/repo-grouped-view"
import { RepositorySearch, RegistrySelector, RepositoryLoading, RepositoryError, RepositoryEmpty } from "@/components/repository/repository-ui-components"
import { useRepositoriesState } from "@/hooks/use-repositories-state"
import type { RegistryConnection } from "@/types/registry"

interface ModernRepositoriesClientProps {
  initialRegistry: string
  initialRegistries: RegistryConnection[]
}

export function ModernRepositoriesClient({ 
  initialRegistry, 
  initialRegistries 
}: ModernRepositoriesClientProps) {
  const {
    search,
    selectedRegistry,
    registries,
    repositories,
    isLoading,
    handleSearchChange,
    handleRegistryChange,
    clearSearch,
    refetch,
    hasSearch,
    isEmpty,
    hasError,
  } = useRepositoriesState({ initialRegistry, initialRegistries })

  const handleConnectRegistry = () => {
    // Navigate to registry creation page
    window.location.href = '/registries/new'
  }

  return (
    <section className="space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Repositories</h1>
          <p className="text-muted-foreground">
            Explore and manage container images across your connected registries.
          </p>
        </div>
      </div>

      {/* Search and Registry Selection */}
      <div className="flex flex-col lg:flex-row gap-4">
        <RepositorySearch
          value={search}
          onChange={handleSearchChange}
          onClear={clearSearch}
          disabled={isLoading}
        />
        
        <RegistrySelector
          registries={registries}
          selectedRegistry={selectedRegistry}
          onRegistryChange={handleRegistryChange}
          disabled={isLoading}
        />
      </div>

      {/* Repository Content */}
      <div className="min-h-[400px]">
        {!selectedRegistry ? (
          <RepositoryEmpty 
            hasSearch={false} 
            onConnectRegistry={handleConnectRegistry}
          />
        ) : isLoading ? (
          <RepositoryLoading />
        ) : hasError ? (
          <RepositoryError 
            onRetry={refetch}
          />
        ) : isEmpty ? (
          <RepositoryEmpty 
            hasSearch={hasSearch}
          />
        ) : (
          <div key={`${selectedRegistry}-${search}`} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <RepoGroupedView
              registryId={selectedRegistry}
              repositories={repositories}
              viewMode="table"
            />
          </div>
        )}
      </div>
    </section>
  )
}
