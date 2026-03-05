"use client"

import React, { useMemo, useState, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { SearchIcon, PlusIcon } from "lucide-react"
import { RepoGroupedView } from "@/components/repository/repo-grouped-view"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useRegistries } from "@/hooks/use-registries"
import { useRepositories, useSearchRepositories } from "@/hooks/use-repositories"
import type { RegistryConnection } from "@/types/registry"

export function RepositoriesClient({ initialRegistry, initialRegistries }: { initialRegistry: string, initialRegistries: RegistryConnection[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const registryParam = searchParams.get("registry")

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [showAllRepos, setShowAllRepos] = useState(false)

  // Debounce search input to prevent excessive API calls
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      // Reset to show initial subset when search changes
      setShowAllRepos(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value)
  }, [])

  const registriesQuery = useRegistries({
    initialData: initialRegistries,
  })

  const selectedRegistry = useMemo(() => {
    if (registryParam) return registryParam
    return initialRegistry
  }, [registryParam, initialRegistry])

  const handleRegistryChange = (id: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (id) {
      params.set("registry", id)
    } else {
      params.delete("registry")
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const repositoriesQuery = useRepositories(selectedRegistry, {
    page: 1,
    perPage: showAllRepos ? 200 : 50, // Load more when showing all repos
    search: undefined, // Don't search on main query, we'll handle search separately
  })

  const searchQuery = useSearchRepositories(selectedRegistry, debouncedSearch)

  // Smart search logic: use client-side search when we have loaded data, server-side fallback
  const activeResult = useMemo(() => {
    if (debouncedSearch.trim().length > 0) {
      // If we have loaded repositories and user is searching, try client-side search first
      const loadedRepos = repositoriesQuery.data?.items ?? []
      const hasLoadedRepos = loadedRepos.length > 0 && (showAllRepos || loadedRepos.length >= 50)

      if (hasLoadedRepos) {
        // Client-side search on loaded repositories (instant results)
        const searchTerm = debouncedSearch.toLowerCase()
        const filteredRepos = loadedRepos.filter(repo =>
          repo.name.toLowerCase().includes(searchTerm) ||
          repo.description?.toLowerCase().includes(searchTerm) ||
          repo.namespace?.toLowerCase().includes(searchTerm) ||
          `${repo.namespace}/${repo.name}`.toLowerCase().includes(searchTerm)
        )

        return {
          items: filteredRepos,
          meta: {
            page: 1,
            perPage: filteredRepos.length,
            total: filteredRepos.length,
          }
        }
      } else {
        // Fall back to server-side search when we don't have enough loaded data
        return searchQuery.data
      }
    }

    // No search - return main repositories
    return repositoriesQuery.data
  }, [repositoriesQuery.data, searchQuery.data, debouncedSearch, showAllRepos])

  // Determine if we're using client-side or server-side search
  const isClientSideSearch = useMemo(() => {
    return debouncedSearch.trim().length > 0 &&
           (repositoriesQuery.data?.items ?? []).length > 0 &&
           (showAllRepos || (repositoriesQuery.data?.items ?? []).length >= 50)
  }, [debouncedSearch, repositoriesQuery.data, showAllRepos])

  const items = activeResult?.items ?? []

  // Progressive loading: show initial subset or all repos
  const displayedRepos = showAllRepos ? items : items.slice(0, 12) // Show first 12 initially
  const hasMoreRepos = items.length > 12 && !showAllRepos
  const totalRepos = activeResult?.meta?.total ?? 0

  return (
    <section className="space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Repositories</h1>
          <p className="text-muted-foreground">
            Explore and manage container images across your connected registries.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative group">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            value={search}
            onChange={handleSearchChange}
            className="h-12 pl-11 bg-card/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-2xl transition-all"
            placeholder="Quick search by name or tag..."
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
      </div>

      <div className="min-h-[400px]">
        {!selectedRegistry ? (
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
        ) : repositoriesQuery.isLoading || searchQuery.isLoading ? (
          <div className="animate-in fade-in duration-300">
            <div className="rounded-lg border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm">
              <div className="p-6">
                <div className="space-y-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-8 w-8 rounded-lg bg-muted/50 animate-pulse" />
                        <div className="space-y-1 flex-1">
                          <div className="h-4 w-32 bg-muted/50 rounded animate-pulse" />
                          <div className="h-3 w-24 bg-muted/30 rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="h-4 w-12 bg-muted/50 rounded animate-pulse" />
                        <div className="h-4 w-16 bg-muted/50 rounded animate-pulse" />
                        <div className="h-6 w-16 bg-muted/50 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : repositoriesQuery.isError || searchQuery.isError ? (
          <div className="rounded-3xl border border-destructive/50 bg-destructive/5 p-20 text-center animate-in fade-in duration-300">
            <div className="mx-auto w-16 h-16 rounded-3xl bg-destructive/10 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 text-destructive">Failed to Load Repositories</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-8">
              Unable to fetch repositories from the selected registry. Please try again or contact support if the problem persists.
            </p>
            <Button
              onClick={() => {
                repositoriesQuery.refetch()
                if (debouncedSearch.trim().length > 0) {
                  searchQuery.refetch()
                }
              }}
              variant="outline"
              className="rounded-2xl"
            >
              Try Again
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/50 bg-card/20 p-20 text-center animate-in fade-in duration-300">
            <p className="text-muted-foreground">No repositories found matching your search.</p>
          </div>
        ) : (
          <div key={`${selectedRegistry}-${search}`} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <RepoGroupedView
              registryId={selectedRegistry}
              repositories={displayedRepos}
              viewMode="table"
            />

            {/* Load More Button */}
            {hasMoreRepos && (
              <div className="mt-8 flex flex-col items-center justify-center space-y-4">
                <div className="text-center text-sm text-muted-foreground">
                  Showing {displayedRepos.length} of {totalRepos} repositories
                </div>
                <Button
                  onClick={() => setShowAllRepos(true)}
                  variant="outline"
                  size="lg"
                  className="rounded-2xl px-8"
                  disabled={repositoriesQuery.isLoading}
                >
                  {repositoriesQuery.isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load All Repositories
                      <span className="ml-2 text-xs opacity-70">
                        ({totalRepos - displayedRepos.length} more)
                      </span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
