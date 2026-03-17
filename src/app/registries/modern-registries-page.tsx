"use client"

import { PlusIcon, ServerIcon, StarIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { EmptyState } from "@/components/empty-state"
import { RegistryCard } from "@/components/registry/registry-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
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
  const defaultRegistry = registries.find((r) => r.isDefault)

  const handleAddRegistry = () => {
    router.push("/registries/new")
  }

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">Registries</h1>
          <p className="text-sm text-muted-foreground">
            Manage connections to your container registries.
          </p>
        </div>

        <Button onClick={handleAddRegistry} className="w-full sm:w-auto">
          <PlusIcon data-icon="inline-start" />
          Add Registry
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="gap-1">
            <CardDescription>Total registries</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <ServerIcon className="size-5 text-muted-foreground" />
              {registries.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="gap-1">
            <CardDescription>Default registry</CardDescription>
            <CardTitle className="flex items-center gap-2 text-xl">
              <StarIcon className="size-5 text-muted-foreground" />
              <span className="truncate">{defaultRegistry?.name ?? "Not set"}</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="gap-1">
            <CardDescription>Providers</CardDescription>
            <CardTitle className="text-xl">
              {new Set(registries.map((registry) => registry.provider)).size || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="gap-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
          ))}
        </div>
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
        />
      ) : isEmpty ? (
        <EmptyState
          icon={<ServerIcon className="size-5" />}
          title="No registries connected"
          description="Add your first registry to start browsing repositories and tags."
          action={
            <Button onClick={handleAddRegistry}>
              <PlusIcon data-icon="inline-start" />
              Add Registry
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {registries.map((registry) => (
            <RegistryCard
              key={registry.id}
              registry={registry}
              onDelete={() => {
                handleDelete(registry.id)
                toast.success("Registry removed")
              }}
              onSetDefault={() => {
                handleSetDefault(registry.id)
                toast.success("Default registry updated")
              }}
            />
          ))}
        </div>
      )}
    </section>
  )
}
