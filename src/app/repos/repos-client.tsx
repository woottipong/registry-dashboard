"use client"

import React, { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DatabaseIcon,
  FolderIcon,
  LayersIcon,
  PlusIcon,
  SearchIcon,
  ServerIcon,
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
import { cn } from "@/lib/utils"
import type { Namespace, RegistryConnection, Repository } from "@/types/registry"

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

  const totalTagsCount = useMemo(() => {
    const items = repositoriesQuery.data?.items ?? []
    return items.reduce((sum, r) => sum + (r.tagCount ?? 0), 0)
  }, [repositoriesQuery.data])

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 pt-2 pb-10">
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

          {/* Doorlog 4-Card KPI Stat Strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {/* Card 1: Active Registry */}
            <div className="rounded-panel border border-panel-border bg-card p-3.5 sm:p-4 shadow-panel flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-medium uppercase tracking-wider">Active Registry</span>
                <ServerIcon className="size-3.5 text-primary" />
              </div>
              <div className="mt-2">
                <p className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">
                  {selectedRegistryData?.name ?? "Registry"}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono truncate">
                  {selectedRegistryData?.provider === "dockerhub" ? "Docker Hub" : "Docker Registry V2"}
                </p>
              </div>
            </div>

            {/* Card 2: Namespaces */}
            <div className="rounded-panel border border-panel-border bg-card p-3.5 sm:p-4 shadow-panel flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-medium uppercase tracking-wider">Namespaces</span>
                <LayersIcon className="size-3.5 text-primary" />
              </div>
              <div className="mt-2">
                <p className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-mono">
                  {namespacesQuery.isLoading ? "…" : namespaceList.length}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  Catalog partitions
                </p>
              </div>
            </div>

            {/* Card 3: Total Repositories */}
            <div className="rounded-panel border border-panel-border bg-card p-3.5 sm:p-4 shadow-panel flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-medium uppercase tracking-wider">Repositories</span>
                <FolderIcon className="size-3.5 text-primary" />
              </div>
              <div className="mt-2">
                <p className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-mono">
                  {repositoriesQuery.isLoading && selectedNamespace === null ? "…" : totalRepositoriesCount}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {selectedNamespace !== null ? "in active namespace" : "across all namespaces"}
                </p>
              </div>
            </div>

            {/* Card 4: Catalog Scope / Tags */}
            <div className="rounded-panel border border-panel-border bg-card p-3.5 sm:p-4 shadow-panel flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-medium uppercase tracking-wider">Catalog Scope</span>
                <DatabaseIcon className="size-3.5 text-primary" />
              </div>
              <div className="mt-2">
                <p className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate font-mono">
                  {selectedNamespace !== null ? (selectedNamespaceValue || "_root") : "Global Catalog"}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {totalTagsCount > 0 ? `${totalTagsCount} tags indexed` : "Namespace-first load"}
                </p>
              </div>
            </div>
          </div>

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
                        <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px] font-mono">
                          {totalRepositoriesCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Quick Search & Count Pill */}
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-control bg-secondary/80 border border-border/60 px-2 py-0.5 text-[10px] font-mono text-muted-foreground whitespace-nowrap">
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
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
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
                            <p className="text-[11px] text-muted-foreground">{activeRepos.length} results found across all namespaces</p>
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
                          <p className="text-[11px] text-muted-foreground">{filteredNamespaces.length} namespaces match your query</p>
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
              <div className="flex items-center justify-between border-t border-border/70 bg-secondary/20 px-4 py-2.5 text-xs text-muted-foreground">
                <span className="truncate text-[11px]">
                  {`Available namespaces in ${selectedRegistryData?.name ?? "Registry"}. Click any partition to browse repositories and tags.`}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground shrink-0 hidden sm:inline">
                  {totalRepositoriesCount} repositories cataloged
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
                  <span className="hidden md:inline text-[11px] text-muted-foreground font-mono">
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
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
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
                <span className="truncate text-[11px]">
                  {repositoriesQuery.isLoading
                    ? "Fetching repository tags and manifests from registry…"
                    : repositoriesQuery.isError
                      ? "Unable to retrieve repository manifest list."
                      : `${sortedRepos.length} ${sortedRepos.length === 1 ? "repository" : "repositories"} in ${selectedNamespaceValue || "root"} · Click any row to inspect tags and manifests.`}
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToNamespaces}
                  className="h-6 text-[11px] font-mono px-2 hover:text-primary transition-colors cursor-pointer shrink-0"
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

interface NamespaceListProps {
  namespaces: Namespace[]
  allRepositories: Repository[]
  totalRepositories: number
  onSelect: (namespace: string) => void
}

function NamespaceList({
  namespaces,
  allRepositories,
  totalRepositories,
  onSelect,
}: NamespaceListProps) {
  const sortedNamespaces = useMemo(() => {
    return [...namespaces].sort((a, b) => {
      if (b.repositoryCount !== a.repositoryCount) {
        return b.repositoryCount - a.repositoryCount
      }
      return a.name.localeCompare(b.name)
    })
  }, [namespaces])

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sortedNamespaces.map((namespace) => {
        const isRoot = namespace.name === ""
        const label = isRoot ? "(root)" : namespace.name

        // Find repositories belonging to this namespace
        const nsRepos = allRepositories.filter((repo) => {
          if (isRoot) {
            return !repo.namespace || repo.namespace === "_root" || repo.namespace === "root"
          }
          return repo.namespace === namespace.name || repo.fullName.startsWith(`${namespace.name}/`)
        })

        const sampleRepos = nsRepos.slice(0, 3)
        const remainingCount = Math.max(namespace.repositoryCount - sampleRepos.length, 0)
        const sharePercentage =
          totalRepositories > 0
            ? Math.round((namespace.repositoryCount / totalRepositories) * 100)
            : 0

        return (
          <button
            key={namespace.name || "_root"}
            type="button"
            onClick={() => onSelect(namespace.name)}
            className="group flex flex-col justify-between gap-3 w-full cursor-pointer rounded-control border border-border/70 bg-secondary/25 p-4 text-left transition-all duration-150 hover:bg-secondary/50 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
          >
            {/* Top row: Icon + Name + Badge + Arrow */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-control bg-secondary text-muted-foreground group-hover:text-primary transition-colors">
                  <FolderIcon className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors font-mono">
                    {label}{isRoot ? "" : "/"}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {isRoot ? "Root namespace partition" : "Namespace partition"}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <span className="inline-flex items-center rounded-control bg-secondary/80 border border-border/60 px-2 py-0.5 font-mono text-[11px] font-medium text-foreground">
                  {namespace.repositoryCount} <span className="text-muted-foreground ml-1">repos</span>
                </span>
                <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>
            </div>

            {/* Middle & Volume Distribution */}
            <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
              {sampleRepos.length > 0 ? (
                <div className="flex flex-wrap gap-1 min-h-[22px] items-center">
                  {sampleRepos.map((r) => (
                    <span
                      key={r.fullName}
                      className="inline-flex items-center rounded-control bg-background/60 border border-border/50 px-1.5 py-0.2 font-mono text-[10px] text-muted-foreground group-hover:text-foreground truncate max-w-[130px]"
                      title={r.name}
                    >
                      {r.name}
                    </span>
                  ))}
                  {remainingCount > 0 ? (
                    <span className="font-mono text-[10px] text-muted-foreground/70">
                      +{remainingCount} more
                    </span>
                  ) : null}
                </div>
              ) : (
                <div className="flex items-center justify-between text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">
                  <span className="font-mono text-[10px]">Partition volume</span>
                  <span className="font-mono text-[10px] text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                    <span>Inspect</span>
                    <ArrowRightIcon className="size-2.5" />
                  </span>
                </div>
              )}

              {/* Share volume bar */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                  <span>{sharePercentage}% of registry</span>
                  <span>{namespace.repositoryCount} {namespace.repositoryCount === 1 ? "repo" : "repos"}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/80 transition-all duration-300"
                    style={{ width: `${Math.max(sharePercentage, 8)}%` }}
                  />
                </div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function NamespaceSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex flex-col justify-between gap-3 rounded-control border border-border/60 bg-secondary/20 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-7 rounded-control" />
              <div className="space-y-1">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </div>
            <Skeleton className="h-5 w-14 rounded-control" />
          </div>
          <div className="pt-2 border-t border-border/40 space-y-1.5">
            <Skeleton className="h-4 w-3/4 rounded-control" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

function RepoSkeleton() {
  return (
    <div className="overflow-hidden space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center justify-between rounded-control bg-secondary/20 p-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-6 rounded-control" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-2.5 w-48 max-w-[50vw]" />
            </div>
          </div>
          <Skeleton className="h-5 w-16 rounded-control" />
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
