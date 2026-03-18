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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  | "updated-desc"
  | "updated-asc"

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
      case "updated-desc":
        return repos.sort((a, b) => {
          if (!a.lastUpdated && !b.lastUpdated) return 0
          if (!a.lastUpdated) return 1
          if (!b.lastUpdated) return -1
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        })
      case "updated-asc":
        return repos.sort((a, b) => {
          if (!a.lastUpdated && !b.lastUpdated) return 0
          if (!a.lastUpdated) return 1
          if (!b.lastUpdated) return -1
          return new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime()
        })
      default:
        return repos
    }
  }, [filteredRepos, sortBy])

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="flex flex-col gap-2">
        {selectedNamespace !== null ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBackToNamespaces} className="w-fit">
              <ChevronLeftIcon data-icon="inline-start" />
              Namespaces
            </Button>
            <Badge variant="outline">{selectedNamespaceValue || "(root)"}</Badge>
          </div>
        ) : null}

        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            {selectedNamespace !== null
              ? selectedNamespaceValue
                ? `${selectedNamespaceValue}/`
                : "(root)"
              : "Repositories"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {selectedNamespace !== null
              ? "Browse repositories in the selected namespace."
              : "Select a namespace to browse container images."}
          </p>
        </div>
      </div>

      {!selectedRegistry ? (
        <NoRegistryState />
      ) : (
        <>
          {selectedNamespace === null ? (
            <Card className="overflow-hidden border-border/70">
              <CardHeader className="gap-2 border-b pb-4">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {registries.map((registry) => (
                      <Button
                        key={registry.id}
                        variant={selectedRegistry === registry.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleRegistryChange(registry.id)}
                        className="max-w-full"
                      >
                        <span className="truncate">{registry.name}</span>
                      </Button>
                    ))}
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/registries/new">
                        <PlusIcon data-icon="inline-start" />
                        Connect
                      </Link>
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <CardTitle>Namespaces</CardTitle>
                      <CardDescription>
                        {selectedRegistryData
                          ? `Available namespaces in ${selectedRegistryData.name}`
                          : "Available namespaces"}
                      </CardDescription>
                    </div>
                    {namespaceList.length > 0 ? (
                      <Badge variant="secondary">
                        {namespaceList.length} {namespaceList.length === 1 ? "namespace" : "namespaces"}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {namespacesQuery.isLoading ? (
                  <NamespaceSkeleton />
                ) : namespacesQuery.isError ? (
                  <ErrorState onRetry={() => namespacesQuery.refetch()} />
                ) : !namespaceList.length ? (
                  <EmptyState message="No repositories found in this registry." />
                ) : (
                  <NamespaceList namespaces={namespaceList} onSelect={handleNamespaceSelect} />
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="overflow-hidden border-border/70">
                <CardHeader className="gap-3 border-b pb-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {registries.map((registry) => (
                        <Button
                          key={registry.id}
                          variant={selectedRegistry === registry.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleRegistryChange(registry.id)}
                          className="max-w-full"
                        >
                          <span className="truncate">{registry.name}</span>
                        </Button>
                      ))}
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/registries/new">
                          <PlusIcon data-icon="inline-start" />
                          Connect
                        </Link>
                      </Button>
                    </div>

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div className="min-w-0">
                        <CardTitle>Repository List</CardTitle>
                        <CardDescription>
                          {sortedRepos.length} {sortedRepos.length === 1 ? "repository" : "repositories"} in {selectedNamespaceValue || "root"}
                        </CardDescription>
                      </div>
                      {selectedRegistryData ? (
                        <Badge variant="outline">{selectedRegistryData.name}</Badge>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                      <div className="relative flex-1">
                        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={search}
                          onChange={handleSearchChange}
                          className="pl-9"
                          placeholder={`Search in ${selectedNamespaceValue || "root"}...`}
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
                        <SelectTrigger className="w-full md:w-48" aria-label="Sort repositories">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name-asc">Name A→Z</SelectItem>
                          <SelectItem value="name-desc">Name Z→A</SelectItem>
                          <SelectItem value="tags-desc">Most Tags</SelectItem>
                          <SelectItem value="tags-asc">Fewest Tags</SelectItem>
                          <SelectItem value="updated-desc">Newest First</SelectItem>
                          <SelectItem value="updated-asc">Oldest First</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-0">
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
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </section>
  )
}

interface NamespaceListProps {
  namespaces: Namespace[]
  onSelect: (namespace: string) => void
}

function NamespaceList({ namespaces, onSelect }: NamespaceListProps) {
  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b px-2 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <span>Namespace</span>
        <span className="hidden sm:inline">Repos</span>
        <span className="sr-only">Open</span>
      </div>

      <div className="divide-y">
      {namespaces.map((namespace) => {
        const isRoot = namespace.name === ""
        const label = isRoot ? "(root)" : namespace.name

        return (
          <button
            key={namespace.name || "_root"}
            type="button"
            onClick={() => onSelect(namespace.name)}
            className="flex w-full items-center gap-3 px-2 py-3 text-left transition-colors hover:bg-muted/30"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <FolderIcon className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{label}{isRoot ? "" : "/"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {namespace.repositoryCount} {namespace.repositoryCount === 1 ? "repository" : "repositories"}
              </p>
            </div>
            <Badge variant="outline" className="hidden sm:inline-flex">
              {namespace.repositoryCount}
            </Badge>
            <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
          </button>
        )
      })}
      </div>
    </div>
  )
}

function NamespaceSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b px-2 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <span>Namespace</span>
        <span className="hidden sm:inline">Repos</span>
        <span className="sr-only">Open</span>
      </div>
      <div className="divide-y">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 px-2 py-4">
          <Skeleton className="size-9 rounded-lg" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="size-4" />
        </div>
      ))}
      </div>
    </div>
  )
}

function RepoSkeleton() {
  return (
    <div className="px-6 py-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center justify-between border-b py-4 last:border-0">
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-lg" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-28" />
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
      title="No registry connected"
      description="Connect a Docker registry to start browsing your container images."
      action={
        <Button asChild>
          <Link href="/registries/new">Add First Registry</Link>
        </Button>
      }
      className="rounded-3xl bg-card/80 p-14"
    />
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-6 py-8">
      <AppEmptyState
        icon={<SearchIcon className="size-5" />}
        title="Nothing to show"
        description={message}
        className="rounded-2xl bg-background/70"
      />
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="px-6 py-8">
      <AppEmptyState
        icon={<FolderIcon className="size-5" />}
        title="Failed to load"
        description="Unable to fetch data from the selected registry."
        action={
          <Button variant="outline" onClick={onRetry}>
            Retry
          </Button>
        }
        className="rounded-2xl bg-background/70"
      />
    </div>
  )
}
