"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowRightIcon,
  PlusIcon,
  SearchIcon,
  ServerIcon,
  Trash2Icon,
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
  const defaultRegistry = useMemo(
    () => registries.find((registry) => registry.isDefault) ?? null,
    [registries],
  )
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
      <div className="flex flex-col gap-4 border-b border-border/70 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Registries</h1>
              <span className="rounded-control bg-secondary/80 border border-border/70 px-2 py-0.5 text-[11px] font-mono text-muted-foreground font-medium">
                {registries.length} {registries.length === 1 ? "endpoint" : "endpoints"}
              </span>
              {defaultRegistry ? (
                <span className="inline-flex items-center gap-1.5 rounded-control border border-border/70 bg-secondary/50 px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  <span>Default:</span>
                  <span className="text-foreground font-medium">{defaultRegistry.name}</span>
                </span>
              ) : null}
            </div>
            <p className="max-w-2xl text-xs text-muted-foreground sm:text-sm">
              Manage registry connections, defaults, authentication, and repository entry points.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button size="sm" className="h-9 rounded-control font-medium px-3.5 gap-1.5" onClick={handleAddRegistry}>
              <PlusIcon className="size-3.5" />
              Add Registry
            </Button>
            <Button size="sm" variant="outline" className="h-9 rounded-control font-medium px-3.5 gap-1.5 border-border/80 hover:bg-secondary" asChild>
              <Link href="/repos">
                Browse repositories
                <ArrowRightIcon className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, URL, or namespace…"
              className="pl-8 rounded-control h-9 text-xs bg-secondary/50 border border-border/70 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-full sm:w-[130px] rounded-control h-9 text-xs bg-secondary/50 border border-border/70">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent className="rounded-control">
                <SelectItem value="all" className="text-xs">All providers</SelectItem>
                <SelectItem value="generic" className="text-xs">Registry V2</SelectItem>
                <SelectItem value="dockerhub" className="text-xs">Docker Hub</SelectItem>
              </SelectContent>
            </Select>
            <Select value={authFilter} onValueChange={setAuthFilter}>
              <SelectTrigger className="w-full sm:w-[130px] rounded-control h-9 text-xs bg-secondary/50 border border-border/70">
                <SelectValue placeholder="Auth" />
              </SelectTrigger>
              <SelectContent className="rounded-control">
                <SelectItem value="all" className="text-xs">All auth</SelectItem>
                <SelectItem value="none" className="text-xs">Anonymous</SelectItem>
                <SelectItem value="basic" className="text-xs">Basic Auth</SelectItem>
                <SelectItem value="bearer" className="text-xs">Token</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters ? (
              <Button type="button" variant="ghost" size="sm" onClick={resetFilters} className="rounded-control h-9 text-xs">
                Clear
              </Button>
            ) : null}
          </div>
        </div>
      </div>

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
          className="rounded-panel bg-card p-12 shadow-panel border border-panel-border"
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
          className="rounded-panel bg-card p-12 shadow-panel border border-panel-border"
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
          className="rounded-panel bg-card p-10 shadow-panel border border-panel-border"
        />
      ) : (
        <div className="grid items-start gap-3 xl:grid-cols-2">
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
