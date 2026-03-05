"use client"

import React, { useMemo, useState, useCallback } from "react"
import Link from "next/link"
import { useDebounce } from "@/hooks/use-debounce"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { SearchIcon, PlusIcon, FolderIcon, ChevronLeftIcon, ChevronRightIcon, BoxIcon } from "lucide-react"
import { RepoTable } from "@/components/repository/repo-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useRegistries } from "@/hooks/use-registries"
import { useRepositories } from "@/hooks/use-repositories"
import { useNamespaces } from "@/hooks/use-namespaces"
import type { RegistryConnection } from "@/types/registry"

export function RepositoriesClient({ initialRegistry, initialRegistries }: { initialRegistry: string, initialRegistries: RegistryConnection[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const registryParam = searchParams.get("registry")
  const namespaceParam = searchParams.get("namespace")

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search)

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value)
  }, [])

  const registriesQuery = useRegistries({ initialData: initialRegistries })

  const selectedRegistry = useMemo(() => {
    return registryParam ?? initialRegistry
  }, [registryParam, initialRegistry])

  // namespaceParam=null means no namespace selected (overview)
  // namespaceParam='_root' means root-level repos (namespace='')
  // namespaceParam='foo' means namespace 'foo'
  const selectedNamespace = namespaceParam ?? null
  const selectedNamespaceValue = selectedNamespace === '_root' ? '' : (selectedNamespace ?? undefined)

  const handleRegistryChange = (id: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (id) {
      params.set("registry", id)
    } else {
      params.delete("registry")
    }
    params.delete("namespace")
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleNamespaceSelect = useCallback((namespace: string) => {
    const params = new URLSearchParams(searchParams.toString())
    // Use '_root' as URL sentinel for empty-string (root-level) namespace
    params.set("namespace", namespace === '' ? '_root' : namespace)
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  const handleBackToNamespaces = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("namespace")
    setSearch("")
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  // Step 1: Load namespaces overview (catalog names only — no tag fetches)
  const namespacesQuery = useNamespaces(selectedRegistry)

  // Step 2: Load repos only when a namespace is selected
  const repositoriesQuery = useRepositories(selectedRegistry, {
    page: 1,
    perPage: 500,
    namespace: selectedNamespace !== null ? selectedNamespaceValue : undefined,
  })

  // Client-side search within loaded repos
  const filteredRepos = useMemo(() => {
    const repos = repositoriesQuery.data?.items ?? []
    if (!debouncedSearch.trim()) return repos
    const term = debouncedSearch.toLowerCase()
    return repos.filter(repo =>
      repo.name.toLowerCase().includes(term) ||
      repo.fullName?.toLowerCase().includes(term)
    )
  }, [repositoriesQuery.data, debouncedSearch])

  return (
    <section className="space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          {selectedNamespace !== null ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToNamespaces}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeftIcon className="size-4" />
                Namespaces
              </button>
              <span className="text-muted-foreground/40">/</span>
              <span className="text-sm font-medium">{selectedNamespaceValue || '(root)'}</span>
            </div>
          ) : null}
          <h1 className="text-3xl font-bold tracking-tight">
            {selectedNamespace !== null ? (selectedNamespaceValue ? `${selectedNamespaceValue}/` : '(root)') : "Repositories"}
          </h1>
          <p className="text-muted-foreground">
            {selectedNamespace !== null
              ? `Repositories in ${selectedNamespaceValue ? `namespace ${selectedNamespaceValue}` : 'root'}`
              : "Select a namespace to browse container images."}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      {selectedNamespace !== null ? (
        /* Namespace detail — search only */
        <div className="relative group">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            value={search}
            onChange={handleSearchChange}
            className="h-12 pl-11 bg-card/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-2xl transition-all"
            placeholder={`Search in ${selectedNamespaceValue || 'root'}...`}
            aria-label="Search repositories"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground p-1"
              aria-label="Clear search"
            >
              Clear
            </button>
          )}
        </div>
      ) : (
        /* Namespace overview — registry selector */
        <div className="flex overflow-x-auto pb-2 sm:pb-0 scrollbar-none gap-2 min-w-0">
          <div className="flex bg-card/30 p-1 rounded-2xl border border-border/50">
            {registriesQuery.data?.map((registry) => {
              const isActive = selectedRegistry === registry.id
              return (
                <button
                  key={registry.id}
                  onClick={() => handleRegistryChange(registry.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 cursor-pointer",
                    isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                  aria-label={`Select ${registry.name} registry`}
                  aria-pressed={isActive}
                >
                  <div className={cn(
                    "size-2 rounded-full",
                    isActive ? "bg-white animate-pulse" : "bg-muted-foreground/30"
                  )} />
                  {registry.name}
                </button>
              )
            })}
            <Link
              href="/registries/new"
              className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-primary border border-dashed border-border/50 ml-1 flex items-center gap-2 cursor-pointer"
            >
              <PlusIcon className="size-3.5" />
              <span>Connect</span>
            </Link>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="min-h-[400px]">
        {!selectedRegistry ? (
          <NoRegistryState />
        ) : selectedNamespace === null ? (
          /* Namespace overview */
          namespacesQuery.isLoading ? (
            <NamespaceSkeleton />
          ) : namespacesQuery.isError ? (
            <ErrorState onRetry={() => namespacesQuery.refetch()} />
          ) : !namespacesQuery.data?.length ? (
            <EmptyState message="No repositories found in this registry." />
          ) : (
            <NamespaceGrid
              namespaces={namespacesQuery.data}
              onSelect={handleNamespaceSelect}
            />
          )
        ) : (
          /* Namespace detail — repos */
          repositoriesQuery.isLoading ? (
            <RepoSkeleton />
          ) : repositoriesQuery.isError ? (
            <ErrorState onRetry={() => repositoriesQuery.refetch()} />
          ) : filteredRepos.length === 0 ? (
            <EmptyState message={debouncedSearch ? "No repositories match your search." : "No repositories in this namespace."} />
          ) : (
            <div key={`${selectedRegistry}-${selectedNamespaceValue}`} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="rounded-2xl border border-border/50 bg-card/30 overflow-hidden backdrop-blur-sm">
                <RepoTable registryId={selectedRegistry} repositories={filteredRepos} />
              </div>
            </div>
          )
        )}
      </div>
    </section>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NamespaceGrid({ namespaces, onSelect }: { namespaces: { name: string; repositoryCount: number }[], onSelect: (ns: string) => void }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/30 overflow-hidden backdrop-blur-sm animate-in fade-in duration-300">
      <div className="divide-y divide-border/40">
        {namespaces.map((ns) => (
          <button
            key={ns.name}
            type="button"
            onClick={() => onSelect(ns.name)}
            className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors text-left group"
          >
            <div className="flex-shrink-0 size-8 rounded-lg bg-primary/8 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
              <FolderIcon className="size-4 text-primary/70" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                {ns.name}/
              </p>
            </div>

            <div className="flex-shrink-0 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
              {ns.repositoryCount} {ns.repositoryCount === 1 ? "repo" : "repos"}
            </div>

            <ChevronRightIcon className="flex-shrink-0 size-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
          </button>
        ))}
      </div>
    </div>
  )
}

function NamespaceSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/30 overflow-hidden animate-in fade-in duration-300">
      <div className="divide-y divide-border/40">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5">
            <div className="size-8 rounded-lg bg-muted/50 animate-pulse flex-shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-muted/50 rounded animate-pulse" />
            </div>
            <div className="h-5 w-14 bg-muted/30 rounded-full animate-pulse" />
            <div className="size-4 bg-muted/30 rounded animate-pulse flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

function RepoSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/30 overflow-hidden animate-in fade-in duration-300">
      <div className="p-6 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-8 w-8 rounded-lg bg-muted/50 animate-pulse" />
              <div className="space-y-1 flex-1">
                <div className="h-4 w-32 bg-muted/50 rounded animate-pulse" />
                <div className="h-3 w-24 bg-muted/30 rounded animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="h-4 w-12 bg-muted/50 rounded animate-pulse" />
              <div className="h-4 w-16 bg-muted/50 rounded animate-pulse" />
              <div className="h-6 w-16 bg-muted/50 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function NoRegistryState() {
  return (
    <div className="rounded-3xl border border-dashed border-border/50 bg-card/20 p-20 text-center backdrop-blur-sm animate-in fade-in duration-300">
      <div className="mx-auto w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
        <PlusIcon className="size-8 text-primary" />
      </div>
      <h3 className="text-xl font-bold mb-2">No Registry Connected</h3>
      <p className="text-muted-foreground max-w-xs mx-auto mb-8">
        Connect a Docker registry to start browsing your container images.
      </p>
      <Button asChild size="lg" className="rounded-2xl px-8 shadow-xl shadow-primary/20">
        <Link href="/registries/new">Add First Registry</Link>
      </Button>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border/50 bg-card/20 p-20 text-center animate-in fade-in duration-300">
      <div className="mx-auto w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
        <BoxIcon className="size-6 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-3xl border border-destructive/50 bg-destructive/5 p-20 text-center animate-in fade-in duration-300">
      <h3 className="text-xl font-bold mb-2 text-destructive">Failed to Load</h3>
      <p className="text-muted-foreground max-w-sm mx-auto mb-8">
        Unable to fetch data from the registry. Please try again.
      </p>
      <Button onClick={onRetry} variant="outline" className="rounded-2xl">
        Try Again
      </Button>
    </div>
  )
}
