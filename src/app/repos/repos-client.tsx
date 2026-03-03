"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { m, LazyMotion, domAnimation, AnimatePresence } from "framer-motion"
import { LayoutGridIcon, ListIcon, SearchIcon, PlusIcon } from "lucide-react"
import { RepoGrid } from "@/components/repository/repo-grid"
import { RepoTable } from "@/components/repository/repo-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useRegistries } from "@/hooks/use-registries"
import { useRepositories, useSearchRepositories } from "@/hooks/use-repositories"
import { useUiStore } from "@/stores/ui-store"

export function RepositoriesClient({ initialRegistry }: { initialRegistry: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const registryParam = searchParams.get("registry")

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const repoViewMode = useUiStore((state) => state.repoViewMode)
  const setRepoViewMode = useUiStore((state) => state.setRepoViewMode)

  const registriesQuery = useRegistries()

  const selectedRegistry = useMemo(() => {
    if (registryParam) return registryParam
    if (initialRegistry) return initialRegistry

    const defaultRegistry = registriesQuery.data?.find((r) => r.isDefault)
    return defaultRegistry?.id ?? registriesQuery.data?.[0]?.id ?? ""
  }, [registryParam, registriesQuery.data, initialRegistry])

  const handleRegistryChange = (id: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (id) {
      params.set("registry", id)
    } else {
      params.delete("registry")
    }
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
    setPage(1)
  }

  const repositoriesQuery = useRepositories(selectedRegistry, {
    page,
    perPage: 25,
    search: search || undefined,
  })

  const searchQuery = useSearchRepositories(selectedRegistry, search)

  const activeResult = useMemo(() => {
    if (search.trim().length > 0) {
      return searchQuery.data
    }

    return repositoriesQuery.data
  }, [repositoriesQuery.data, searchQuery.data, search])

  const items = activeResult?.items ?? []
  const meta = activeResult?.meta

  return (
    <LazyMotion features={domAnimation}>
      <m.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 max-w-[1600px] mx-auto"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Repositories</h1>
            <p className="text-muted-foreground">
              Explore and manage container images across your connected registries.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex bg-secondary/50 p-1 rounded-xl border border-border/50 backdrop-blur-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRepoViewMode("grid")}
                className={cn(
                  "h-8 px-3 rounded-lg transition-all duration-200",
                  repoViewMode === "grid" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGridIcon className="size-4 mr-2" />
                <span className="text-xs font-semibold">Grid</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRepoViewMode("table")}
                className={cn(
                  "h-8 px-3 rounded-lg transition-all duration-200",
                  repoViewMode === "table" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ListIcon className="size-4 mr-2" />
                <span className="text-xs font-semibold">Table</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative group">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              className="h-12 pl-11 bg-card/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-2xl transition-all"
              placeholder="Quick search by name or tag..."
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground p-1"
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
                      "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2",
                      isActive
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
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
                className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-primary border border-dashed border-border/50 ml-1 flex items-center gap-2"
              >
                <PlusIcon className="size-3.5" />
                <span>Connect</span>
              </Link>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!selectedRegistry ? (
            <m.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-3xl border border-dashed border-border/50 bg-card/20 p-20 text-center backdrop-blur-sm"
            >
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
            </m.div>
          ) : repositoriesQuery.isLoading || searchQuery.isLoading ? (
            <m.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <RepoGrid registryId={selectedRegistry} repositories={[]} isLoading />
            </m.div>
          ) : items.length === 0 ? (
            <m.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-3xl border border-dashed border-border/50 bg-card/20 p-20 text-center"
            >
              <p className="text-muted-foreground">No repositories found matching your search.</p>
            </m.div>
          ) : (
            <m.div
              key={`${selectedRegistry}-${repoViewMode}-${search}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {repoViewMode === "grid" ? (
                <RepoGrid
                  registryId={selectedRegistry}
                  repositories={items}
                />
              ) : (
                <div className="rounded-2xl border border-border/50 bg-card/30 overflow-hidden backdrop-blur-sm">
                  <RepoTable
                    registryId={selectedRegistry}
                    repositories={items}
                  />
                </div>
              )}
            </m.div>
          )}
        </AnimatePresence>

        {meta && meta.totalPages > 1 ? (
          <div className="flex items-center justify-end gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current: number) => Math.max(1, current - 1))}
              className="rounded-xl"
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground font-medium">
              Page {page} of {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((current: number) => current + 1)}
              className="rounded-xl"
            >
              Next
            </Button>
          </div>
        ) : null}
      </m.section>
    </LazyMotion>
  )
}
