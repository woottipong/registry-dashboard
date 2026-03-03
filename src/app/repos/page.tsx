"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { LayoutGridIcon, ListIcon, SearchIcon } from "lucide-react"
import { RepoGrid } from "@/components/repository/repo-grid"
import { RepoTable } from "@/components/repository/repo-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRegistries } from "@/hooks/use-registries"
import { useRepositories, useSearchRepositories } from "@/hooks/use-repositories"
import { useUiStore } from "@/stores/ui-store"

export default function RepositoriesPage() {
  const [selectedRegistry, setSelectedRegistry] = useState<string>("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const repoViewMode = useUiStore((state) => state.repoViewMode)
  const setRepoViewMode = useUiStore((state) => state.setRepoViewMode)

  const registriesQuery = useRegistries()

  useEffect(() => {
    if (selectedRegistry || !registriesQuery.data?.length) {
      return
    }

    const defaultRegistry = registriesQuery.data.find((registry) => registry.isDefault)
    setSelectedRegistry(defaultRegistry?.id ?? registriesQuery.data[0].id)
  }, [selectedRegistry, registriesQuery.data])

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
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Repositories</h1>
          <p className="text-sm text-muted-foreground">Browse image repositories across registries.</p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-input border bg-card p-1">
          <Button
            variant={repoViewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setRepoViewMode("grid")}
          >
            <LayoutGridIcon className="size-4" />
          </Button>
          <Button
            variant={repoViewMode === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => setRepoViewMode("table")}
          >
            <ListIcon className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[220px_1fr]">
        <select
          className="h-10 rounded-input border bg-background px-3 text-sm"
          value={selectedRegistry}
          onChange={(event) => {
            setSelectedRegistry(event.target.value)
            setPage(1)
          }}
        >
          <option value="">Select registry</option>
          {registriesQuery.data?.map((registry) => (
            <option key={registry.id} value={registry.id}>
              {registry.name}
            </option>
          ))}
        </select>

        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            className="pl-8"
            placeholder="Search repositories"
          />
        </div>
      </div>

      {!selectedRegistry ? (
        <div className="rounded-card border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No registries available yet.</p>
          <Button asChild className="mt-4">
            <Link href="/registries/new">Add Registry</Link>
          </Button>
        </div>
      ) : repositoriesQuery.isLoading || searchQuery.isLoading ? (
        <RepoGrid registryId={selectedRegistry} repositories={[]} isLoading />
      ) : items.length === 0 ? (
        <div className="rounded-card border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No repositories found.</p>
        </div>
      ) : repoViewMode === "grid" ? (
        <RepoGrid
          registryId={selectedRegistry}
          repositories={items}
        />
      ) : (
        <RepoTable
          registryId={selectedRegistry}
          repositories={items}
        />
      )}

      {meta && meta.totalPages > 1 ? (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current: number) => Math.max(1, current - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} / {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((current: number) => current + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </section>
  )
}
