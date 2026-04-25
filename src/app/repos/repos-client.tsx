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
    <section className="mx-auto flex max-w-6xl flex-col gap-4">
      {!selectedRegistry ? (
        <NoRegistryState />
      ) : (
        <>
          <div className="flex flex-col gap-4 pb-2">
            {selectedNamespace !== null ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleBackToNamespaces} className="w-fit">
                  <ChevronLeftIcon data-icon="inline-start" />
                  Namespaces
                </Button>
                <Badge variant="outline" className="font-mono">
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

              {selectedNamespace === null ? (
                <div className="flex flex-wrap gap-2">
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
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedRegistryData ? <SummaryPill label={selectedRegistryData.name} /> : null}
              <SummaryPill
                label={
                  selectedNamespace === null
                    ? `${namespaceList.length} ${namespaceList.length === 1 ? "namespace" : "namespaces"}`
                    : `${sortedRepos.length} ${sortedRepos.length === 1 ? "repository" : "repositories"}`
                }
              />
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
            <div className="rounded-lg border border-border/70 bg-card/80">
              <div className="space-y-4 px-5 pt-5">
                <div className="space-y-1">
                  <h2 className="text-base font-semibold tracking-tight">Repository Inventory</h2>
                  <p className="text-sm text-muted-foreground">
                    {sortedRepos.length} {sortedRepos.length === 1 ? "repository" : "repositories"} in {selectedNamespaceValue || "root"}
                  </p>
                </div>

                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={handleSearchChange}
                      className="pl-9"
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
                    <SelectTrigger className="w-full md:w-52" aria-label="Sort repositories">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name-asc">Name A-Z</SelectItem>
                      <SelectItem value="name-desc">Name Z-A</SelectItem>
                      <SelectItem value="tags-desc">Most tags</SelectItem>
                      <SelectItem value="tags-asc">Fewest tags</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="pb-4">
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
    <div className="rounded-lg border border-border/70 bg-card/80">
      <div className="px-5 pt-5">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  )
}

function SummaryPill({ label }: { label: string }) {
  return (
    <span className="inline-flex h-6 items-center rounded-md border border-border/70 bg-card px-2 text-[11px] font-medium text-foreground/72">
      {label}
    </span>
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
  const maxRepos = Math.max(...sortedNamespaces.map((namespace) => namespace.repositoryCount), 1)

  return (
    <div className="space-y-3">
      {sortedNamespaces.map((namespace) => {
        const isRoot = namespace.name === ""
        const label = isRoot ? "(root)" : namespace.name
        const width = Math.max(10, Math.round((namespace.repositoryCount / maxRepos) * 100))

        return (
          <button
            key={namespace.name || "_root"}
            type="button"
            onClick={() => onSelect(namespace.name)}
            className="group flex w-full cursor-pointer flex-col gap-3 rounded-lg border border-border/70 bg-background/70 px-4 py-3 text-left transition-colors hover:bg-background"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border/70 bg-card text-muted-foreground">
                  <FolderIcon className="size-4" />
                </div>
                <p className="truncate text-sm font-semibold tracking-tight">
                  {label}{isRoot ? "" : "/"}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Repos
                  </p>
                  <p className="font-mono text-sm font-semibold text-foreground/85">
                    {namespace.repositoryCount}
                  </p>
                </div>
                <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>

            <div className="h-1.5 rounded-full bg-secondary/80">
              <div
                className="h-1.5 rounded-full bg-primary transition-all duration-500"
                style={{ width: `${width}%` }}
              />
            </div>
          </button>
        )
      })}
    </div>
  )
}

function NamespaceSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-lg border border-border/70 bg-background/70 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Skeleton className="size-9 rounded-md" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-40 max-w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-16 rounded-md" />
              <Skeleton className="size-4 rounded-sm" />
            </div>
          </div>
          <Skeleton className="mt-4 h-1.5 w-full rounded-full" />
        </div>
      ))}
    </div>
  )
}

function RepoSkeleton() {
  return (
    <div className="overflow-hidden">
      <div className="grid grid-cols-[minmax(0,1fr)_7rem] border-b border-border/70 px-5 py-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="ml-auto h-3 w-10" />
      </div>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center justify-between border-b border-border/60 px-5 py-3 last:border-0">
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-md" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48 max-w-[50vw]" />
            </div>
          </div>
          <Skeleton className="h-6 w-20 rounded-md" />
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
      className="rounded-lg bg-card/80 p-14"
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
        className="rounded-lg bg-background/70"
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
        className="rounded-lg bg-background/70"
      />
    </div>
  )
}
