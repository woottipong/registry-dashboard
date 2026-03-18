"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowRightIcon,
  PlusIcon,
  SearchIcon,
  ServerIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { EmptyState } from "@/components/empty-state"
import { RegistryCard } from "@/components/registry/registry-card"
import { RegistryLoadingGrid } from "@/components/registry/registry-loading-grid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRegistriesState } from "@/hooks/use-registries-state"
import type { RegistryConnection } from "@/types/registry"

interface ModernRegistriesPageProps {
  initialRegistries?: RegistryConnection[]
}

export function ModernRegistriesPage({ initialRegistries }: ModernRegistriesPageProps = {}) {
  const {
    registries,
    isLoading,
    isError,
    handleDelete,
    handleSetDefault,
    isEmpty,
  } = useRegistriesState({ initialRegistries })

  const router = useRouter()
  const [search, setSearch] = useState("")

  const filteredRegistries = useMemo(() => {
    const searchTerm = search.trim().toLowerCase()

    return registries.filter((registry) => {
      const matchesSearch =
        searchTerm.length === 0
          ? true
          : [
              registry.name,
              registry.url,
              registry.namespace ?? "",
              registry.provider,
              registry.authType,
            ]
              .join(" ")
              .toLowerCase()
              .includes(searchTerm)

      return matchesSearch
    })
  }, [registries, search])

  function handleAddRegistry() {
    router.push("/registries/new")
  }

  function handleDeleteRegistry(registry: RegistryConnection) {
    handleDelete(registry.id)
    toast.success(`Removed ${registry.name}`)
  }

  function handleSetDefaultRegistry(registry: RegistryConnection) {
    handleSetDefault(registry.id)
    toast.success(`${registry.name} is now the default registry`)
  }

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">Registries</h1>
          <p className="text-sm text-muted-foreground">
            Manage registry connections and defaults.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href="/repos">
              Browse repositories
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
          <Button onClick={handleAddRegistry}>
            <PlusIcon data-icon="inline-start" />
            Add Registry
          </Button>
        </div>
      </div>

      {!isEmpty ? (
        <div className="rounded-xl border border-border/70 bg-card/85 px-5 py-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur-sm">
          <div className="relative max-w-xl">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 pl-9"
              placeholder="Search registries..."
              aria-label="Search registries"
            />
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <RegistryLoadingGrid />
      ) : isError ? (
        <EmptyState
          icon={<ServerIcon className="size-5" />}
          title="Failed to load registries"
          description="We couldn't load your registry connections. Try refreshing the page."
          action={
            <Button variant="outline" onClick={() => router.refresh()}>
              Try again
            </Button>
          }
          className="rounded-3xl bg-card/80 p-14"
        />
      ) : isEmpty ? (
        <EmptyState
          icon={<ServerIcon className="size-5" />}
          title="No registries connected"
          description="Add your first registry to start browsing repositories, verifying connectivity, and managing tags from one place."
          action={
            <Button onClick={handleAddRegistry}>
              <PlusIcon data-icon="inline-start" />
              Add Registry
            </Button>
          }
          className="rounded-3xl bg-card/80 p-14"
        />
      ) : filteredRegistries.length === 0 ? (
        <EmptyState
          icon={<SearchIcon className="size-5" />}
          title="No registries match these filters"
          description="Try a different search term."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setSearch("")
              }}
            >
              Clear search
            </Button>
          }
          className="rounded-3xl bg-card/80 p-14"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredRegistries.map((registry) => (
              <RegistryCard
                key={registry.id}
                registry={registry}
                onDelete={() => handleDeleteRegistry(registry)}
                onSetDefault={() => handleSetDefaultRegistry(registry)}
              />
            ))}
        </div>
      )}
    </section>
  )
}
