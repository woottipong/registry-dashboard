"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowRightIcon,
  CheckIcon,
  DatabaseIcon,
  PlusIcon,
  SearchIcon,
  ServerIcon,
  ShieldCheckIcon,
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
  const providerCount = useMemo(
    () => new Set(registries.map((registry) => registry.provider)).size,
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
    <section className="mx-auto flex w-full max-w-page flex-col gap-6 pt-3 sm:gap-7 sm:pt-6">
      <div className="flex flex-col gap-5 pb-2">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-page-title font-semibold tracking-tight sm:text-3xl">Registries</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Manage registry connections, defaults, authentication, and repository entry points.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={handleAddRegistry}>
              <PlusIcon data-icon="inline-start" />
              Add Registry
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/repos">
                Browse repositories
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-3 sm:grid-cols-3 [&>div:last-child]:col-span-2 sm:[&>div:last-child]:col-span-1">
          <SummaryStat label="Registries" value={String(registries.length)} icon={DatabaseIcon} />
          <SummaryStat label="Providers" value={String(providerCount)} icon={ShieldCheckIcon} />
          <SummaryStat label="Default Registry" value={defaultRegistry?.name ?? "Unset"} mono={false} icon={CheckIcon} />
        </div>

        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, URL, or namespace"
              className="pl-9.5 rounded-control h-10"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-full sm:w-[150px] rounded-control h-10">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All providers</SelectItem>
                <SelectItem value="generic">Registry V2</SelectItem>
                <SelectItem value="dockerhub">Docker Hub</SelectItem>
              </SelectContent>
            </Select>
            <Select value={authFilter} onValueChange={setAuthFilter}>
              <SelectTrigger className="w-full sm:w-[140px] rounded-control h-10">
                <SelectValue placeholder="Auth" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All auth</SelectItem>
                <SelectItem value="none">Anonymous</SelectItem>
                <SelectItem value="basic">Basic Auth</SelectItem>
                <SelectItem value="bearer">Token</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters ? (
              <Button type="button" variant="ghost" size="sm" onClick={resetFilters} className="rounded-control h-10">
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
          className="rounded-panel bg-card p-12 shadow-panel border-0"
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
          className="rounded-panel bg-card p-12 shadow-panel border-0"
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
          className="rounded-panel bg-card p-10 shadow-panel border-0"
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

function SummaryStat({
  label,
  value,
  mono = true,
  compact = false,
  icon: Icon,
}: {
  label: string
  value: string
  mono?: boolean
  compact?: boolean
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className={`flex min-w-0 flex-col justify-between ${compact ? "py-2" : "py-3"}`}>
      <div className="flex items-center gap-2.5 text-muted-foreground">
        {Icon ? (
          <Icon className="size-4 shrink-0" />
        ) : null}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className={`mt-3 truncate font-semibold tracking-tight text-foreground ${mono ? "text-2xl tabular-nums" : "text-base sm:text-lg"}`}>
        {value}
      </p>
    </div>
  )
}
