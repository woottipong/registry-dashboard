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
    isLoading,
    searchQuery,
    setSearchQuery,
    filteredRegistries,
    handleDelete,
    handleSetDefault,
    isEmpty,
  } = useRegistriesState({ initialRegistries })

  const handleAddRegistry = () => {
    window.location.href = '/registries/new'
  }

  return (
    <section className="space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Registries
          </h1>
          <p className="text-muted-foreground">
            Manage your connected container registries.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <RegistrySearch
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            disabled={isLoading}
          />

          <Button
            onClick={handleAddRegistry}
            size="default"
          >
            <PlusIcon className="size-4 mr-2" />
            Add Registry
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px] animate-in fade-in-0 duration-700 delay-300">
        {isLoading ? (
          <RegistryLoading count={4} />
        ) : isEmpty ? (
          <RegistryEmpty
            onAddRegistry={handleAddRegistry}
            searchQuery={searchQuery}
          />
        ) : (
          <div className="grid gap-6 grid-cols-2 animate-in fade-in-0 duration-500 delay-500">
            {filteredRegistries.map((registry, index) => (
              <div
                key={registry.id}
                className="animate-in slide-in-from-bottom-4 duration-300"
                style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
              >
                <ModernRegistryCard
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
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
