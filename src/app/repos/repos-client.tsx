"use client"

import React, { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FolderIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react"
import { EmptyState as AppEmptyState } from "@/components/empty-state"
import { RepoTable } from "@/components/repository/repo-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useDebounce } from "@/hooks/use-debounce"
import { useNamespaces } from "@/hooks/use-namespaces"
import { useRegistries } from "@/hooks/use-registries"
import { useRepositories } from "@/hooks/use-repositories"
import type { Namespace, RegistryConnection } from "@/types/registry"

type SortOption =
  | "name-asc"
  | "name-desc"
  | "tags-desc"
  | "tags-asc"

export function RepositoriesClient({
  initialRegistry,
  initialRegistries,
}: {
  initialRegistry: string
  initialRegistries: RegistryConnection[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const registryParam = searchParams.get("registry")
  const namespaceParam = searchParams.get("namespace")

  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("tags-desc")
  const debouncedSearch = useDebounce(search)

  const registriesQuery = useRegistries({ initialData: initialRegistries })
  const registries = registriesQuery.data ?? []
  const selectedRegistry = useMemo(
    () => registryParam ?? initialRegistry,
    [registryParam, initialRegistry],
  )
  const selectedRegistryData =
    registries.find((registry) => registry.id === selectedRegistry) ?? null

  const selectedNamespace = namespaceParam ?? null
  const selectedNamespaceValue = selectedNamespace === "_root" ? "" : (selectedNamespace ?? undefined)

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value)
  }, [])

  const handleRegistryChange = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (id) {
        params.set("registry", id)
      } else {
        params.delete("registry")
      }
      params.delete("namespace")
      setSearch("")
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams],
  )

  const handleNamespaceSelect = useCallback(
    (namespace: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("namespace", namespace === "" ? "_root" : namespace)
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams],
  )

  const handleBackToNamespaces = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("namespace")
    setSearch("")
    router.push(`${pathname}?${params.toString()}`)
  }, [pathname, router, searchParams])

  const namespacesQuery = useNamespaces(selectedRegistry)
  const repositoriesQuery = useRepositories(selectedRegistry, {
    page: 1,
    perPage: 1000,
    namespace: selectedNamespace !== null ? selectedNamespaceValue : undefined,
  })

  const namespaceList = namespacesQuery.data ?? []

  const filteredRepos = useMemo(() => {
    const repos = repositoriesQuery.data?.items ?? []
    if (!debouncedSearch.trim()) return repos
    const term = debouncedSearch.toLowerCase()
    return repos.filter(
      (repo) =>
        repo.name.toLowerCase().includes(term) || repo.fullName.toLowerCase().includes(term),
    )
  }, [debouncedSearch, repositoriesQuery.data])

  const sortedRepos = useMemo(() => {
    const repos = [...filteredRepos]
    switch (sortBy) {
      case "name-asc":
        return repos.sort((a, b) => a.name.localeCompare(b.name))
      case "name-desc":
        return repos.sort((a, b) => b.name.localeCompare(a.name))
      case "tags-desc":
        return repos.sort((a, b) => (b.tagCount ?? 0) - (a.tagCount ?? 0))
      case "tags-asc":
        return repos.sort((a, b) => (a.tagCount ?? 0) - (b.tagCount ?? 0))
      default:
        return repos
    }
  }, [filteredRepos, sortBy])

  return (
    <section className="mx-auto flex w-full max-w-7xl xl:max-w-[1400px] flex-col gap-6">
      {!selectedRegistry ? (
        <NoRegistryState />
      ) : (
        <>
          <div className="flex flex-col gap-6 pb-2">
            {selectedNamespace !== null ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleBackToNamespaces} className="w-fit rounded-control">
                  <ChevronLeftIcon data-icon="inline-start" />
                  {"Namespaces"}
                </Button>
                <Badge variant="outline" className="font-mono rounded-full">
                  {selectedNamespaceValue || "(root)"}
                </Badge>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {selectedNamespace !== null
                    ? selectedNamespaceValue
                      ? `${selectedNamespaceValue}/`
                      : "(root)"
                    : "Repositories"}
                </h1>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  {selectedNamespace !== null
                    ? "Browse repositories in the selected namespace."
                    : "Choose a registry and namespace to browse repositories."}
                </p>
              </div>

              {selectedNamespace === null && registries.length > 1 ? (
                <div className="flex flex-wrap items-center gap-1.5 rounded-full bg-secondary/40 p-1">
                  {registries.map((registry) => (
                    <Button
                      key={registry.id}
                      variant={selectedRegistry === registry.id ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleRegistryChange(registry.id)}
                      className={selectedRegistry === registry.id ? "rounded-control shadow-xs px-3.5 h-8 text-xs font-medium" : "rounded-full px-3.5 h-8 text-xs font-medium text-muted-foreground hover:text-foreground"}
                    >
                      <span className="truncate">{registry.name}</span>
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {selectedNamespace === null ? (
            <Panel
              title="Namespace Index"
              description={
                selectedRegistryData
                  ? `Available namespaces in ${selectedRegistryData.name}`
                  : "Available namespaces"
              }
            >
              {namespacesQuery.isLoading ? (
                <NamespaceSkeleton />
              ) : namespacesQuery.isError ? (
                <ErrorState onRetry={() => namespacesQuery.refetch()} />
              ) : !namespaceList.length ? (
                <EmptyState message="No repositories found in this registry." />
              ) : (
                <NamespaceList namespaces={namespaceList} onSelect={handleNamespaceSelect} />
              )}
            </Panel>
          ) : (
            <div className="rounded-panel bg-card p-6 sm:p-7 shadow-panel border border-panel-border">
              <div className="space-y-4 pb-4">
                <div className="space-y-1">
                  <h2 className="text-base font-semibold tracking-tight">Repository Inventory</h2>
                  <p className="text-sm text-muted-foreground">
                    {sortedRepos.length} {sortedRepos.length === 1 ? "repository" : "repositories"} in {selectedNamespaceValue || "root"}
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 md:flex-row md:items-center">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={handleSearchChange}
                      className="pl-9.5 rounded-control h-10"
                      placeholder={`Search in ${selectedNamespaceValue || "root"}`}
                      aria-label="Search repositories"
                    />
                    {search ? (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                        aria-label="Clear search"
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>

                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                    <SelectTrigger className="w-full md:w-52 rounded-control h-10" aria-label="Sort repositories">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="name-asc">Name A-Z</SelectItem>
                      <SelectItem value="name-desc">Name Z-A</SelectItem>
                      <SelectItem value="tags-desc">Most tags</SelectItem>
                      <SelectItem value="tags-asc">Fewest tags</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                {repositoriesQuery.isLoading ? (
                  <RepoSkeleton />
                ) : repositoriesQuery.isError ? (
                  <ErrorState onRetry={() => repositoriesQuery.refetch()} />
                ) : filteredRepos.length === 0 ? (
                  <EmptyState
                    message={
                      debouncedSearch
                        ? "No repositories match your search."
                        : "No repositories in this namespace."
                    }
                  />
                ) : (
                  <RepoTable registryId={selectedRegistry} repositories={sortedRepos} />
                )}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}

function Panel({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-panel bg-card p-6 sm:p-7 shadow-panel border border-panel-border">
      <div className="mb-4">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <div>{children}</div>
    </div>
  )
}

interface NamespaceListProps {
  namespaces: Namespace[]
  onSelect: (namespace: string) => void
}

function NamespaceList({ namespaces, onSelect }: NamespaceListProps) {
  const sortedNamespaces = [...namespaces].sort((a, b) => {
    if (b.repositoryCount !== a.repositoryCount) {
      return b.repositoryCount - a.repositoryCount
    }

    return a.name.localeCompare(b.name)
  })

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {sortedNamespaces.map((namespace) => {
        const isRoot = namespace.name === ""
        const label = isRoot ? "(root)" : namespace.name

        return (
          <button
            key={namespace.name || "_root"}
            type="button"
            onClick={() => onSelect(namespace.name)}
            className="group flex w-full cursor-pointer items-center justify-between gap-4 rounded-control bg-secondary/25 p-4 text-left transition-all duration-200 hover:bg-secondary/60 hover:-translate-y-0.5 hover:shadow-xs"
          >
            <div className="flex min-w-0 items-center gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 group-hover:scale-105 transition-transform text-blue-400">
                <FolderIcon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
                  {label}{isRoot ? "" : "/"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Namespace collection
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2.5">
              <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 font-mono text-xs font-semibold text-foreground">
                {namespace.repositoryCount} <span className="font-normal text-muted-foreground ml-1 text-xs">repos</span>
              </span>
              <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
            </div>
          </button>
        )
      })}
    </div>
  )
}

function NamespaceSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center justify-between gap-4 rounded-2xl bg-secondary/20 p-4">
          <div className="flex min-w-0 items-center gap-3.5">
            <Skeleton className="size-10 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}

function RepoSkeleton() {
  return (
    <div className="overflow-hidden space-y-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center justify-between rounded-xl bg-secondary/20 p-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48 max-w-[50vw]" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}

function NoRegistryState() {
  return (
    <AppEmptyState
      icon={<PlusIcon className="size-5" />}
      title={"No registry connected"}
      description={"Connect a Docker registry to start browsing your container images."}
      action={
        <Button className="rounded-control shadow-xs" asChild>
          <Link href="/registries/new">{"Add registry"}</Link>
        </Button>
      }
      className="rounded-panel border border-panel-border bg-card p-12 text-center shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
    />
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-6">
      <AppEmptyState
        icon={<SearchIcon className="size-5" />}
        title="Nothing to show"
        description={message}
        className="rounded-2xl border-0 bg-secondary/30 p-8 text-center"
      />
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-6">
      <AppEmptyState
        icon={<FolderIcon className="size-5" />}
        title="Failed to load"
        description="Unable to fetch data from the selected registry."
        action={
          <Button variant="outline" className="rounded-control shadow-xs" onClick={onRetry}>
            Retry
          </Button>
        }
        className="rounded-2xl border-0 bg-secondary/30 p-8 text-center"
      />
    </div>
  )
}
