"use client"

import { PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { RegistrySearch, ModernRegistryCard, RegistryLoading, RegistryEmpty } from "@/components/registry/registry-ui-components"
import { useRegistriesState } from "@/hooks/use-registries-state"
import type { RegistryConnection } from "@/types/registry"

interface ModernRegistriesPageProps {
  initialRegistries?: RegistryConnection[]
}

export function ModernRegistriesPage({ initialRegistries }: ModernRegistriesPageProps = {}) {
  const {
    registries,
    isLoading,
    searchQuery,
    setSearchQuery,
    filteredRegistries,
    handleDelete,
    handleSetDefault,
    hasRegistries,
    isEmpty,
  } = useRegistriesState({ initialRegistries })

  const handleAddRegistry = () => {
    window.location.href = '/registries/new'
  }

  return (
    <section className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Registries</h1>
          <p className="text-muted-foreground">
            Manage your connected container registries and monitor their status.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <RegistrySearch
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            disabled={isLoading}
          />
          
          <Button onClick={handleAddRegistry} className="rounded-lg">
            <PlusIcon className="size-4 mr-2" />
            Add Registry
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <RegistryLoading count={4} />
        ) : isEmpty ? (
          <RegistryEmpty 
            onAddRegistry={handleAddRegistry}
            searchQuery={searchQuery}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredRegistries.map((registry) => (
              <ModernRegistryCard
                key={registry.id}
                registry={registry}
                status="checking"
                onEdit={() => window.location.href = `/registries/${registry.id}/edit`}
                onDelete={() => {
                  handleDelete(registry.id)
                  toast.success("Registry removed")
                }}
                onSetDefault={() => {
                  handleSetDefault(registry.id)
                  toast.success("Default registry updated")
                }}
                onPing={() => {
                  toast.info("Registry test functionality coming soon")
                }}
                isLoading={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {hasRegistries && (
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              Showing {filteredRegistries.length} of {registries.length} registries
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span>Connected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span>Error</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>Checking</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
