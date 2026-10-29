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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useDebounce } from "@/hooks/use-debounce"
import { useNamespaces } from "@/hooks/use-namespaces"
import { useRegistries } from "@/hooks/use-registries"
import { useRepositories, useSearchRepositories } from "@/hooks/use-repositories"
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

  const namespaceList = useMemo(() => namespacesQuery.data ?? [], [namespacesQuery.data])

  const filteredNamespaces = useMemo(() => {
    if (!debouncedSearch.trim()) return namespaceList
    const term = debouncedSearch.toLowerCase()
    return namespaceList.filter((ns) =>
      ns.name.toLowerCase().includes(term) || (ns.name === "" && "(root)".includes(term)),
    )
  }, [debouncedSearch, namespaceList])

  const searchReposQuery = useSearchRepositories(
    selectedNamespace === null ? selectedRegistry : "",
    debouncedSearch,
  )

  const activeRepos = useMemo(() => {
    if (selectedNamespace === null) {
      return searchReposQuery.data?.items ?? []
    }
    const repos = repositoriesQuery.data?.items ?? []
    if (!debouncedSearch.trim()) return repos
    const term = debouncedSearch.toLowerCase()
    return repos.filter(
      (repo) =>
        repo.name.toLowerCase().includes(term) || repo.fullName.toLowerCase().includes(term),
    )
  }, [selectedNamespace, searchReposQuery.data, repositoriesQuery.data, debouncedSearch])

  const sortedRepos = useMemo(() => {
    const repos = [...activeRepos]
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
  }, [activeRepos, sortBy])

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 pt-2 pb-10">
      {!selectedRegistry ? (
        <NoRegistryState />
      ) : (
        <>
          <div className="flex flex-col gap-4 border-b border-border/70 pb-5">
            {selectedNamespace !== null ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleBackToNamespaces} className="w-fit rounded-control h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1">
                  <ChevronLeftIcon className="size-3.5" />
                  {"Namespaces"}
                </Button>
                <span className="rounded-control bg-secondary/80 border border-border/70 px-2 py-0.5 font-mono text-[11px] text-foreground font-medium">
                  {selectedNamespaceValue || "(root)"}
                </span>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {selectedNamespace !== null
                    ? selectedNamespaceValue
                      ? `${selectedNamespaceValue}/`
                      : "(root)"
                    : "Repositories"}
                </h1>
                <p className="max-w-2xl text-xs text-muted-foreground sm:text-sm">
                  {selectedNamespace !== null
                    ? "Browse repositories in the selected namespace."
                    : "Choose a registry and namespace to browse repositories."}
                </p>
              </div>

              {selectedNamespace === null && registries.length > 1 ? (
                <div className="flex flex-wrap items-center gap-1 rounded-control bg-secondary/30 p-1 border border-border/60">
                  {registries.map((registry) => (
                    <button
                      key={registry.id}
                      type="button"
                      onClick={() => handleRegistryChange(registry.id)}
                      className={selectedRegistry === registry.id ? "rounded-control bg-primary text-primary-foreground font-semibold px-3 py-1 text-xs shadow-xs" : "rounded-control px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60"}
                    >
                      <span className="truncate">{registry.name}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {selectedNamespace === null ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <SearchIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={handleSearchChange}
                    className="pl-8 pr-12 rounded-control h-9 text-xs bg-secondary/50 border border-border/70 focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Search repositories or filter namespaces…"
                    aria-label="Search repositories or namespaces"
                  />
                  {search ? (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                      aria-label="Clear search"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
                <div className="text-xs text-muted-foreground">
                  {namespaceList.length} {namespaceList.length === 1 ? "namespace" : "namespaces"} available
                </div>
              </div>

              {debouncedSearch ? (
                <div className="space-y-5">
                  {searchReposQuery.isLoading ? (
                    <RepoSkeleton />
                  ) : activeRepos.length > 0 ? (
                    <div className="rounded-panel border border-panel-border bg-card p-4 sm:p-5 shadow-panel overflow-hidden">
                      <div className="pb-3 border-b border-border/70 mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <h2 className="text-sm font-semibold tracking-tight text-foreground">Matching Repositories</h2>
                          <p className="text-xs text-muted-foreground">{activeRepos.length} results found across all namespaces</p>
                        </div>
                        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                          <SelectTrigger className="w-36 rounded-control h-8 text-xs bg-secondary/50 border border-border/70" aria-label="Sort repositories">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-control">
                            <SelectItem value="name-asc" className="text-xs">Name A-Z</SelectItem>
                            <SelectItem value="name-desc" className="text-xs">Name Z-A</SelectItem>
                            <SelectItem value="tags-desc" className="text-xs">Most tags</SelectItem>
                            <SelectItem value="tags-asc" className="text-xs">Fewest tags</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <RepoTable registryId={selectedRegistry} repositories={sortedRepos} />
                    </div>
                  ) : null}

                  {filteredNamespaces.length > 0 ? (
                    <Panel
                      title="Matching Namespaces"
                      description={`${filteredNamespaces.length} namespaces match your query`}
                    >
                      <NamespaceList namespaces={filteredNamespaces} onSelect={handleNamespaceSelect} />
                    </Panel>
                  ) : null}

                  {!searchReposQuery.isLoading && activeRepos.length === 0 && filteredNamespaces.length === 0 ? (
                    <EmptyState message="No namespaces or repositories match your search." />
                  ) : null}
                </div>
              ) : (
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
              )}
            </div>
          ) : (
            <div className="rounded-panel border border-panel-border bg-card p-4 sm:p-5 shadow-panel overflow-hidden">
              <div className="space-y-3 pb-4 border-b border-border/70 mb-3">
                <div className="space-y-0.5">
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">Repository Inventory</h2>
                  <p className="text-xs text-muted-foreground">
                    {repositoriesQuery.isLoading
                      ? "Loading repositories…"
                      : repositoriesQuery.isError
                        ? "Repository count unavailable"
                        : `${sortedRepos.length} ${sortedRepos.length === 1 ? "repository" : "repositories"} in ${selectedNamespaceValue || "root"}`}
                  </p>
                  {repositoriesQuery.data && (Boolean(repositoriesQuery.data.meta?.nextCursor) || (repositoriesQuery.data.meta?.totalPages ?? 1) > 1) ? (
                    <p className="text-[11px] text-muted-foreground">Showing loaded repositories only; additional results may be available.</p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={handleSearchChange}
                      className="pl-8 rounded-control h-9 text-xs bg-secondary/50 border border-border/70 focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder={`Search in ${selectedNamespaceValue || "root"}…`}
                      aria-label="Search repositories"
                    />
                    {search ? (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                        aria-label="Clear search"
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>

                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                    <SelectTrigger className="w-full sm:w-44 rounded-control h-9 text-xs bg-secondary/50 border border-border/70" aria-label="Sort repositories">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-control">
                      <SelectItem value="name-asc" className="text-xs">Name A-Z</SelectItem>
                      <SelectItem value="name-desc" className="text-xs">Name Z-A</SelectItem>
                      <SelectItem value="tags-desc" className="text-xs">Most tags</SelectItem>
                      <SelectItem value="tags-asc" className="text-xs">Fewest tags</SelectItem>
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
    <div className="rounded-panel border border-panel-border bg-card p-4 sm:p-5 shadow-panel overflow-hidden">
      <div className="mb-3.5 pb-3 border-b border-border/70">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
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
    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {sortedNamespaces.map((namespace) => {
        const isRoot = namespace.name === ""
        const label = isRoot ? "(root)" : namespace.name

        return (
          <button
            key={namespace.name || "_root"}
            type="button"
            onClick={() => onSelect(namespace.name)}
            className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-control border border-border/60 bg-secondary/25 p-3 text-left transition-colors duration-150 hover:bg-secondary/50 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-control bg-secondary text-primary">
                <FolderIcon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
                  {label}{isRoot ? "" : "/"}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  Collection
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <span className="inline-flex items-center rounded-control bg-secondary/80 border border-border/60 px-2 py-0.5 font-mono text-[11px] font-medium text-foreground">
                {namespace.repositoryCount} <span className="text-muted-foreground ml-1">repos</span>
              </span>
              <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
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
      className="rounded-panel border border-panel-border bg-card p-12 text-center shadow-panel"
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
        className="rounded-panel border border-panel-border bg-card p-8 text-center"
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
        className="rounded-panel border border-panel-border bg-card p-8 text-center"
      />
    </div>
  )
}
