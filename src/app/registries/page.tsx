"use client"

import Link from "next/link"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { RegistryCard } from "@/components/registry/registry-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useRegistries, useDeleteRegistry, useSetDefaultRegistry } from "@/hooks/use-registries"

export default function RegistriesPage() {
  const { data: registries = [], isLoading } = useRegistries()
  const deleteRegistry = useDeleteRegistry()
  const setDefaultRegistry = useSetDefaultRegistry()

  const handleDeleted = (id: string) => {
    deleteRegistry.mutate(id, {
      onError: (error) => toast.error(error.message),
      onSuccess: () => toast.success("Registry removed"),
    })
  }

  const handleSetDefault = (id: string) => {
    const registry = registries.find((item) => item.id === id)
    if (!registry) return

    setDefaultRegistry.mutate(
      { id, registry },
      {
        onError: (error) => toast.error(error.message),
        onSuccess: () => toast.success("Default registry updated"),
      },
    )
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Registries</h1>
          <p className="text-sm text-muted-foreground">Manage your connected container registries.</p>
        </div>
        <Button asChild>
          <Link href="/registries/new">
            <PlusIcon className="size-4" />
            Add Registry
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48 w-full rounded-card" />
          <Skeleton className="h-48 w-full rounded-card" />
        </div>
      ) : registries.length === 0 ? (
        <div className="rounded-card border border-dashed p-8 text-center">
          <h2 className="text-lg font-medium">No registries connected</h2>
          <p className="mt-1 text-sm text-muted-foreground">Connect your first registry to get started.</p>
          <Button className="mt-4" asChild>
            <Link href="/registries/new">Add Registry</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {registries.map((registry) => (
            <RegistryCard
              key={registry.id}
              registry={registry}
              onDeleted={handleDeleted}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}
    </section>
  )
}
