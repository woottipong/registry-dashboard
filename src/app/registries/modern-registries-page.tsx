"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowRightIcon,
  PlusIcon,
  SearchIcon,
  ServerIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { EmptyState } from "@/components/empty-state"
import { RegistryCard } from "@/components/registry/registry-card"
import { RegistryLoadingGrid } from "@/components/registry/registry-loading-grid"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRegistriesState } from "@/hooks/use-registries-state"
import { cn } from "@/lib/utils"
import type { RegistryConnection } from "@/types/registry"

interface ModernRegistriesPageProps {
  initialRegistries?: RegistryConnection[]
}

export function ModernRegistriesPage({ initialRegistries }: ModernRegistriesPageProps) {
  const {
    registries,
    isLoading,
    isError,
    handleDelete,
    handleSetDefault,
    isDeleting,
    isSettingDefault,
    isEmpty,
  } = useRegistriesState({ initialRegistries })

  const router = useRouter()
  const [query, setQuery] = useState("")
  const [providerFilter, setProviderFilter] = useState("all")
  const [authFilter, setAuthFilter] = useState("all")
  const [registryToDelete, setRegistryToDelete] = useState<RegistryConnection | null>(null)

  const providerCounts = useMemo(() => {
    const generic = registries.filter((r) => r.provider === "generic").length
    const dockerhub = registries.filter((r) => r.provider === "dockerhub").length
    return { generic, dockerhub }
  }, [registries])

  const filteredRegistries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return registries.filter((registry) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        registry.name.toLowerCase().includes(normalizedQuery) ||
        registry.url.toLowerCase().includes(normalizedQuery) ||
        registry.namespace?.toLowerCase().includes(normalizedQuery)
      const matchesProvider = providerFilter === "all" || registry.provider === providerFilter
      const matchesAuth = authFilter === "all" || registry.authType === authFilter

      return matchesQuery && matchesProvider && matchesAuth
    })
  }, [authFilter, providerFilter, query, registries])

  const hasActiveFilters = query.trim().length > 0 || providerFilter !== "all" || authFilter !== "all"

  function handleAddRegistry() {
    router.push("/registries/new")
  }

  function resetFilters() {
    setQuery("")
    setProviderFilter("all")
    setAuthFilter("all")
  }

  function handleSetDefaultRegistry(registry: RegistryConnection) {
    handleSetDefault(registry.id, {
      onSuccess: () => toast.success(`${registry.name} is now the default registry`),
      onError: (error) => toast.error(error.message),
    })
  }

  function confirmDeleteRegistry() {
    if (!registryToDelete) return

    const registry = registryToDelete
    handleDelete(registry.id, {
      onSuccess: () => {
        toast.success(`Removed ${registry.name}`)
        setRegistryToDelete(null)
      },
      onError: (error) => toast.error(error.message),
    })
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 pt-2 pb-10">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Registries
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Manage upstream Docker registry connections, authentication, and defaults.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button size="sm" variant="outline" className="h-9 rounded-control font-medium px-3.5 gap-1.5 border-border/80 hover:bg-secondary cursor-pointer" asChild>
            <Link href="/repos">
              <span>Browse repos</span>
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </Button>

          <Button size="sm" className="h-9 rounded-control gap-1.5 px-4 font-medium cursor-pointer" onClick={handleAddRegistry}>
            <PlusIcon className="size-3.5" />
            <span>Add registry</span>
          </Button>
        </div>
      </header>

      {/* Main Registries Panel */}
      <div className="rounded-panel border border-panel-border bg-card shadow-panel overflow-hidden">
        {/* Header Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border/70 p-3.5 sm:flex-row sm:items-center sm:justify-between">
          {/* Provider Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0" role="tablist" aria-label="Registry providers">
            <button
              type="button"
              role="tab"
              aria-selected={providerFilter === "all"}
              onClick={() => setProviderFilter("all")}
              className={cn(
                "flex items-center gap-1.5 rounded-control px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring",
                providerFilter === "all"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <span>All</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs font-mono",
                  providerFilter === "all"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-secondary border border-border/50 text-muted-foreground",
                )}
              >
                {registries.length}
              </span>
            </button>

            {providerCounts.generic > 0 && (
              <button
                type="button"
                role="tab"
                aria-selected={providerFilter === "generic"}
                onClick={() => setProviderFilter("generic")}
                className={cn(
                  "flex items-center gap-1.5 rounded-control px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  providerFilter === "generic"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <span>Registry V2</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-xs font-mono",
                    providerFilter === "generic"
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-secondary border border-border/50 text-muted-foreground",
                  )}
                >
                  {providerCounts.generic}
                </span>
              </button>
            )}

            {providerCounts.dockerhub > 0 && (
              <button
                type="button"
                role="tab"
                aria-selected={providerFilter === "dockerhub"}
                onClick={() => setProviderFilter("dockerhub")}
                className={cn(
                  "flex items-center gap-1.5 rounded-control px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  providerFilter === "dockerhub"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <span>Docker Hub</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-xs font-mono",
                    providerFilter === "dockerhub"
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-secondary border border-border/50 text-muted-foreground",
                  )}
                >
                  {providerCounts.dockerhub}
                </span>
              </button>
            )}
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Select value={authFilter} onValueChange={setAuthFilter}>
              <SelectTrigger className="w-28 sm:w-32 rounded-control h-8 text-xs bg-secondary/50 border border-border/70" aria-label="Filter by auth type">
                <SelectValue placeholder="Auth" />
              </SelectTrigger>
              <SelectContent className="rounded-control">
                <SelectItem value="all" className="text-xs">All auth</SelectItem>
                <SelectItem value="none" className="text-xs">Anonymous</SelectItem>
                <SelectItem value="basic" className="text-xs">Basic Auth</SelectItem>
                <SelectItem value="bearer" className="text-xs">Token</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative w-full sm:w-56">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search endpoints…"
                className="w-full rounded-control border border-border/70 bg-secondary/50 pl-7 pr-7 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary h-8"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 size-6 flex items-center justify-center rounded-control text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  aria-label="Clear search"
                >
                  <XIcon className="size-3" />
                </button>
              )}
            </div>

            {hasActiveFilters && (
              <Button type="button" variant="ghost" size="sm" onClick={resetFilters} className="h-8 rounded-control text-xs px-2 text-muted-foreground hover:text-foreground cursor-pointer">
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Panel Body */}
        <div className="p-4 sm:p-5">
          {isLoading ? (
            <RegistryLoadingGrid />
          ) : isError ? (
            <EmptyState
              icon={<ServerIcon className="size-5" />}
              title="Failed to load registries"
              description="We couldn't load your registry connections. Try refreshing the page."
              action={
                <Button variant="outline" className="rounded-control shadow-xs" onClick={() => router.refresh()}>
                  Try again
                </Button>
              }
              className="rounded-panel bg-card p-12 text-center"
            />
          ) : isEmpty ? (
            <EmptyState
              icon={<ServerIcon className="size-5" />}
              title="No registries connected"
              description="Add your first registry to start browsing repositories, verifying connectivity, and managing tags from one place."
              action={
                <Button className="rounded-control shadow-xs" onClick={handleAddRegistry}>
                  <PlusIcon data-icon="inline-start" />
                  Add Registry
                </Button>
              }
              className="rounded-panel bg-card p-12 text-center"
            />
          ) : filteredRegistries.length === 0 ? (
            <EmptyState
              icon={<SearchIcon className="size-5" />}
              title="No registries match"
              description="Adjust the search or filters to see registry connections."
              action={
                <Button variant="outline" className="rounded-control shadow-xs" onClick={resetFilters}>
                  Clear filters
                </Button>
              }
              className="rounded-panel bg-card p-10 text-center"
            />
          ) : (
            <div className="grid items-start gap-4 lg:grid-cols-2">
              {filteredRegistries.map((registry) => (
                <RegistryCard
                  key={registry.id}
                  registry={registry}
                  isActionPending={isDeleting || isSettingDefault}
                  onDelete={() => setRegistryToDelete(registry)}
                  onSetDefault={() => handleSetDefaultRegistry(registry)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer Banner */}
        <div className="flex items-center justify-between border-t border-border/70 bg-secondary/20 px-4 py-2.5 text-xs text-muted-foreground">
          <span className="truncate text-xs">
            {`${filteredRegistries.length} registry ${filteredRegistries.length === 1 ? "endpoint" : "endpoints"} configured.`}
          </span>

          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs font-medium px-2 hover:text-primary transition-colors cursor-pointer shrink-0"
            onClick={handleAddRegistry}
          >
            <PlusIcon className="mr-1 size-3" />
            <span>Add registry</span>
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={registryToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setRegistryToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2Icon />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete registry?</AlertDialogTitle>
            <AlertDialogDescription>
              {registryToDelete
                ? `This removes "${registryToDelete.name}" from the dashboard. Repository images in the registry are not deleted.`
                : "This registry connection will be removed from the dashboard."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault()
                confirmDeleteRegistry()
              }}
            >
              {isDeleting ? "Deleting..." : "Delete registry"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
