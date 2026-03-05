"use client"

import { PlusIcon, RefreshCwIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
    <section className="space-y-8 max-w-6xl mx-auto">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm text-muted-foreground">
        <a href="/" className="hover:text-foreground transition-colors">Home</a>
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
            variant="outline"
            size="lg"
            onClick={() => window.location.reload()}
            className="rounded-xl px-4 py-3 hover:bg-muted/50 transition-all duration-300"
            title="Refresh page"
          >
            <RefreshCwIcon className="size-5" />
          </Button>
          
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
          <RegistryLoading count={6} />
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
                style={{ animationDelay: `${index * 100}ms` }}
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

      {/* Summary */}
      <div className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg">Registry Overview</h3>
              <Badge variant="secondary" className="text-sm bg-primary/10 text-primary border-primary/20">
                {filteredRegistries.length} of {registries.length} shown
              </Badge>
            </div>
            
            {/* Quick Stats */}
            <div className="hidden sm:flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-2 animate-pulse"></div>
                <span className="text-muted-foreground">
                  Active
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive animate-pulse"></div>
                <span className="text-muted-foreground">
                  Issues
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
                <span className="text-muted-foreground">
                  Monitoring
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Status Indicators */}
          <div className="sm:hidden flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-chart-2"></div>
              <span className="text-muted-foreground">Connected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive"></div>
              <span className="text-muted-foreground">Error</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="text-muted-foreground">Checking</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
