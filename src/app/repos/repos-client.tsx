"use client"

import React, { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ChevronLeftIcon,
  FolderIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react"
import { EmptyState as AppEmptyState } from "@/components/empty-state"
import { NamespaceList, NamespaceSkeleton, RepoSkeleton } from "@/components/repository/namespace-list"
import { RepoTable } from "@/components/repository/repo-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDebounce } from "@/hooks/use-debounce"
import { useNamespaces } from "@/hooks/use-namespaces"
import { useRegistries } from "@/hooks/use-registries"
import { useRepositories, useSearchRepositories } from "@/hooks/use-repositories"
import { cn } from "@/lib/utils"
import type { RegistryConnection } from "@/types/registry"

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
      setSearch("")
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

  // Contextual metrics for stat cards
  const totalRepositoriesCount = useMemo(() => {
    if (repositoriesQuery.data?.items?.length) {
      return repositoriesQuery.data.items.length
    }
    return namespaceList.reduce((sum, ns) => sum + ns.repositoryCount, 0)
  }, [repositoriesQuery.data, namespaceList])

  return (
    <section className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 pt-2 pb-10">
      {!selectedRegistry ? (
        <NoRegistryState />
      ) : (
        <>
          {/* Header */}
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {selectedNamespace !== null ? (
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-primary">
                      {selectedNamespaceValue ? `${selectedNamespaceValue}/` : "_root"}
                    </span>
                  </span>
                ) : (
                  "Repositories"
                )}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {selectedNamespace !== null
                  ? `Browsing repositories inside "${selectedNamespaceValue || "_root"}" namespace.`
                  : "Browse container image repositories across namespaces and connected registries."}
              </p>
            </div>

            <Button size="sm" className="h-9 rounded-control gap-1.5 px-4 font-medium self-start sm:self-auto" asChild>
              <Link href="/registries/new">
                <PlusIcon className="size-3.5" />
                <span>{"Add registry"}</span>
              </Link>
            </Button>
          </header>

          {/* MAIN CONTENT AREA */}
          {selectedNamespace === null ? (
            /* VIEW 1: NAMESPACE INDEX */
            <div className="rounded-panel border border-panel-border bg-card shadow-panel overflow-hidden">
              {/* Header Toolbar */}
              <div className="flex flex-col gap-3 border-b border-border/70 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                {/* Registry Filter Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  <span className="text-xs font-semibold text-foreground mr-1 hidden sm:inline">
                    Registry:
                  </span>
                  {registries.map((reg) => (
                    <button
                      key={reg.id}
                      type="button"
                      onClick={() => handleRegistryChange(reg.id)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-control px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                        selectedRegistry === reg.id
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      )}
                    >
                      <span className="truncate max-w-[140px]">{reg.name}</span>
                      {reg.id === selectedRegistry && totalRepositoriesCount > 0 && (
                        <span className="rounded-full bg-black/20 px-1.5 py-0.5 text-xs font-mono">
                          {totalRepositoriesCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Quick Search & Count Pill */}
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-control bg-secondary/80 border border-border/60 px-2 py-0.5 text-xs font-mono text-muted-foreground whitespace-nowrap">
                    {namespaceList.length} {namespaceList.length === 1 ? "namespace" : "namespaces"} available
                  </span>
                  <div className="relative w-full sm:w-60">
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={handleSearchChange}
                      className="w-full rounded-control border border-border/70 bg-secondary/50 pl-7 pr-7 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary h-8"
                      placeholder="Search repositories or filter namespaces…"
                      aria-label="Search repositories or namespaces"
                    />
                    {search ? (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[24px] min-h-[24px] flex items-center justify-center text-xs font-mono text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                        aria-label="Clear search"
                      >
                        ✕
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-5">
                {debouncedSearch ? (
                  <div className="space-y-6">
                    {/* Matching Repositories */}
                    {searchReposQuery.isLoading ? (
                      <RepoSkeleton />
                    ) : activeRepos.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-border/60">
                          <div>
                            <h2 className="text-xs font-semibold text-foreground">Matching Repositories</h2>
                            <p className="text-xs text-muted-foreground">{activeRepos.length} results found across all namespaces</p>
                          </div>
                          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                            <SelectTrigger className="w-36 rounded-control h-8 text-xs bg-secondary/50 border border-border/70" aria-label="Sort repositories">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-control">
                              <SelectItem value="tags-desc" className="text-xs">Most tags</SelectItem>
                              <SelectItem value="name-asc" className="text-xs">Name A-Z</SelectItem>
                              <SelectItem value="name-desc" className="text-xs">Name Z-A</SelectItem>
                              <SelectItem value="tags-asc" className="text-xs">Fewest tags</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <RepoTable registryId={selectedRegistry} repositories={sortedRepos} />
                      </div>
                    ) : null}

                    {/* Matching Namespaces */}
                    {filteredNamespaces.length > 0 ? (
                      <div className="space-y-3">
                        <div className="pb-2 border-b border-border/60">
                          <h2 className="text-xs font-semibold text-foreground">Matching Namespaces</h2>
                          <p className="text-xs text-muted-foreground">{filteredNamespaces.length} namespaces match your query</p>
                        </div>
                        <NamespaceList
                          namespaces={filteredNamespaces}
                          allRepositories={repositoriesQuery.data?.items ?? []}
                          totalRepositories={totalRepositoriesCount}
                          onSelect={handleNamespaceSelect}
                        />
                      </div>
                    ) : null}

                    {!searchReposQuery.isLoading && activeRepos.length === 0 && filteredNamespaces.length === 0 ? (
                      <EmptyState message="No namespaces or repositories match your search." />
                    ) : null}
                  </div>
                ) : (
                  <div>
                    {namespacesQuery.isLoading ? (
                      <NamespaceSkeleton />
                    ) : namespacesQuery.isError ? (
                      <ErrorState onRetry={() => namespacesQuery.refetch()} />
                    ) : !namespaceList.length ? (
                      <EmptyState message="No repositories found in this registry." />
                    ) : (
                      <NamespaceList
                        namespaces={namespaceList}
                        allRepositories={repositoriesQuery.data?.items ?? []}
                        totalRepositories={totalRepositoriesCount}
                        onSelect={handleNamespaceSelect}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Footer Banner */}
              <div className="flex items-center justify-between border-t border-border/70 bg-secondary/20 px-4 py-2 text-xs text-muted-foreground">
                <span className="truncate text-xs font-mono">
                  {namespaceList.length} {namespaceList.length === 1 ? "namespace" : "namespaces"} in {selectedRegistryData?.name ?? "Registry"}
                </span>
                <span className="font-mono text-xs text-muted-foreground shrink-0 hidden sm:inline">
                  {totalRepositoriesCount} {totalRepositoriesCount === 1 ? "repository" : "repositories"}
                </span>
              </div>
            </div>
          ) : (
            /* VIEW 2: REPOSITORY INVENTORY INSIDE NAMESPACE */
            <div className="rounded-panel border border-panel-border bg-card shadow-panel overflow-hidden">
              {/* Header Toolbar */}
              <div className="flex flex-col gap-3 border-b border-border/70 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                {/* Breadcrumb / Back button & Title */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToNamespaces}
                    className="h-7 rounded-control px-2 text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
                  >
                    <ChevronLeftIcon className="size-3.5" />
                    <span>Namespaces</span>
                  </Button>
                  <span className="text-muted-foreground/60 text-xs">/</span>
                  <span className="rounded-control bg-secondary/80 border border-border/70 px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
                    {selectedNamespaceValue ? `${selectedNamespaceValue}/` : "_root"}
                  </span>
                  <span className="hidden md:inline text-xs text-muted-foreground font-mono">
                    {repositoriesQuery.isLoading
                      ? "Loading repositories…"
                      : repositoriesQuery.isError
                        ? "Repository count unavailable"
                        : `(${sortedRepos.length} ${sortedRepos.length === 1 ? "repo" : "repos"})`}
                  </span>
                </div>

                {/* Inline Search & Sort */}
                <div className="flex items-center gap-2">
                  <div className="relative w-full sm:w-52">
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={handleSearchChange}
                      className="w-full rounded-control border border-border/70 bg-secondary/50 pl-7 pr-7 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary h-8"
                      placeholder={`Search in ${selectedNamespaceValue || "root"}…`}
                      aria-label="Search repositories"
                    />
                    {search ? (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[24px] min-h-[24px] flex items-center justify-center text-xs font-mono text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                        aria-label="Clear search"
                      >
                        ✕
                      </button>
                    ) : null}
                  </div>

                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                    <SelectTrigger className="w-32 sm:w-36 rounded-control h-8 text-xs bg-secondary/50 border border-border/70" aria-label="Sort repositories">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-control">
                      <SelectItem value="tags-desc" className="text-xs">Most tags</SelectItem>
                      <SelectItem value="name-asc" className="text-xs">Name A-Z</SelectItem>
                      <SelectItem value="name-desc" className="text-xs">Name Z-A</SelectItem>
                      <SelectItem value="tags-asc" className="text-xs">Fewest tags</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Table Body */}
              <div>
                {repositoriesQuery.isLoading ? (
                  <div className="p-4">
                    <RepoSkeleton />
                  </div>
                ) : repositoriesQuery.isError ? (
                  <div className="p-6">
                    <ErrorState onRetry={() => repositoriesQuery.refetch()} />
                  </div>
                ) : sortedRepos.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      message={
                        debouncedSearch
                          ? "No repositories match your search."
                          : "No repositories in this namespace."
                      }
                    />
                  </div>
                ) : (
                  <RepoTable registryId={selectedRegistry} repositories={sortedRepos} />
                )}
              </div>

              {/* Footer Banner */}
              <div className="flex items-center justify-between border-t border-border/70 bg-secondary/20 px-4 py-2.5 text-xs text-muted-foreground">
                <span className="truncate text-xs">
                  {repositoriesQuery.isLoading
                    ? "Fetching repository tags and manifests from registry…"
                    : repositoriesQuery.isError
                      ? "Unable to retrieve repository manifest list."
                      : `${sortedRepos.length} ${sortedRepos.length === 1 ? "repository" : "repositories"} in ${selectedNamespaceValue || "root"}`}
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToNamespaces}
                  className="h-8 text-xs font-medium px-2.5 hover:text-primary transition-colors cursor-pointer shrink-0"
                >
                  <ChevronLeftIcon className="mr-1 size-3" />
                  <span>All namespaces</span>
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
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
