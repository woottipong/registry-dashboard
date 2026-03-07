"use client"

import { PlusIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  ModernRegistryCard,
  RegistryLoading,
  RegistryEmpty,
  RegistryError,
  RegistrySummary,
} from "@/components/registry/registry-ui-components"
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
    registryStatuses,
    isEmpty,
  } = useRegistriesState({ initialRegistries })

  const router = useRouter()
  const defaultRegistry = registries.find((r) => r.isDefault)

  const handleAddRegistry = () => {
    router.push("/registries/new")
  }

  return (
    <section className="flex flex-col gap-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Registries</h1>
          <RegistrySummary total={registries.length} defaultRegistry={defaultRegistry} />
        </div>

        <Button onClick={handleAddRegistry}>
          <PlusIcon data-icon="inline-start" />
          Add Registry
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <RegistryLoading count={4} />
      ) : isError ? (
        <RegistryError onRetry={() => router.refresh()} />
      ) : isEmpty ? (
        <RegistryEmpty onAddRegistry={handleAddRegistry} />
      ) : (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {registries.map((registry) => (
            <ModernRegistryCard
              key={registry.id}
              registry={registry}
              status={registryStatuses[registry.id]?.status ?? "checking"}
              latencyMs={registryStatuses[registry.id]?.latencyMs}
              onEdit={() => {
                router.push(`/registries/${registry.id}/edit`)
              }}
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
