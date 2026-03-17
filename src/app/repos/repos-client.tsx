"use client"

import React, { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  BoxIcon,
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
import type { RegistryConnection } from "@/types/registry"

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

  const selectedRegistry = useMemo(() => registryParam ?? initialRegistry, [registryParam, initialRegistry])
  const selectedNamespace = namespaceParam ?? null
  const selectedNamespaceValue =
    selectedNamespace === "_root" ? "" : (selectedNamespace ?? undefined)

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

  const filteredRepos = useMemo(() => {
    const repos = repositoriesQuery.data?.items ?? []
    if (!debouncedSearch.trim()) return repos
    const term = debouncedSearch.toLowerCase()
    return repos.filter(
      (repo) =>
        repo.name.toLowerCase().includes(term) || repo.fullName?.toLowerCase().includes(term),
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
    <section className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        {selectedNamespace !== null ? (
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBackToNamespaces}>
              <ChevronLeftIcon data-icon="inline-start" />
              Namespaces
            </Button>
            <Badge variant="outline">{selectedNamespaceValue || "(root)"}</Badge>
          </div>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight">
          {selectedNamespace !== null
            ? selectedNamespaceValue
              ? `${selectedNamespaceValue}/`
              : "(root)"
            : "Repositories"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {selectedNamespace !== null
            ? `Repositories in ${selectedNamespaceValue ? `namespace ${selectedNamespaceValue}` : "root"}`
            : "Select a namespace to browse container images."}
        </p>
      </div>

      {selectedNamespace !== null ? (
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-center">
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
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
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-wrap gap-2 pt-6">
            {registriesQuery.data?.map((registry) => (
              <Button
                key={registry.id}
                variant={selectedRegistry === registry.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleRegistryChange(registry.id)}
              >
                {registry.name}
              </Button>
            ))}
            <Button variant="outline" size="sm" asChild>
              <Link href="/registries/new">
                <PlusIcon data-icon="inline-start" />
                Connect
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="min-h-[400px]">
        {!selectedRegistry ? (
          <NoRegistryState />
        ) : selectedNamespace === null ? (
          namespacesQuery.isLoading ? (
            <NamespaceSkeleton />
          ) : namespacesQuery.isError ? (
            <ErrorState onRetry={() => namespacesQuery.refetch()} />
          ) : !namespacesQuery.data?.length ? (
            <EmptyState message="No repositories found in this registry." />
          ) : (
            <NamespaceGrid namespaces={namespacesQuery.data} onSelect={handleNamespaceSelect} />
          )
        ) : repositoriesQuery.isLoading ? (
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
          <Card key={`${selectedRegistry}-${selectedNamespaceValue}`}>
            <CardHeader className="gap-1 border-b">
              <CardTitle>Repository List</CardTitle>
              <CardDescription>
                {sortedRepos.length} {sortedRepos.length === 1 ? "repository" : "repositories"} loaded
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <RepoTable registryId={selectedRegistry} repositories={sortedRepos} />
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  )
}

function NamespaceGrid({
  namespaces,
  onSelect,
}: {
  namespaces: { name: string; repositoryCount: number }[]
  onSelect: (ns: string) => void
}) {
  return (
    <Card>
      <CardContent className="px-0">
        <div className="divide-y">
          {namespaces.map((namespace) => (
            <button
              key={namespace.name}
              type="button"
              onClick={() => onSelect(namespace.name)}
              className="flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                <FolderIcon className="size-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="truncate text-sm font-medium">{namespace.name}/</p>
              </div>
              <Badge variant="outline">
                {namespace.repositoryCount} {namespace.repositoryCount === 1 ? "repo" : "repos"}
              </Badge>
              <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function NamespaceSkeleton() {
  return (
    <Card>
      <CardContent className="px-0">
        <div className="divide-y">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 px-6 py-4">
              <Skeleton className="size-8 rounded-md" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="size-4" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function RepoSkeleton() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between border-b py-3 last:border-0">
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-md" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
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
    />
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <AppEmptyState icon={<BoxIcon className="size-5" />} title="Nothing to show" description={message} />
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <AppEmptyState
      title="Failed to load"
      description="Unable to fetch data from the registry. Please try again."
      action={
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      }
    />
  )
}
