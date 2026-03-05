"use client"

import Link from "next/link"
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
    <section className="space-y-8 max-w-6xl mx-auto">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Registries</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 animate-in slide-in-from-top-4 duration-500">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
            Registries
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
            Manage your connected container registries and monitor their status in real-time.
            Connect to Docker Hub, ECR, GCR, and more to streamline your container workflow.
          </p>
        </div>

        <div className="flex items-center gap-4 animate-in slide-in-from-right-4 duration-500 delay-200">
          <RegistrySearch
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            disabled={isLoading}
          />

          <Button
            onClick={handleAddRegistry}
            size="lg"
            className="rounded-xl px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-primary to-chart-2 hover:from-primary/90 hover:to-chart-2/90"
          >
            <PlusIcon className="size-5 mr-2" />
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
