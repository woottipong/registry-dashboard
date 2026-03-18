"use client"

import Link from "next/link"
import { useMemo } from "react"
import {
  ArrowRightIcon,
  ShieldCheckIcon,
  PlusIcon,
  ServerIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { EmptyState } from "@/components/empty-state"
import { RegistryCard } from "@/components/registry/registry-card"
import { RegistryLoadingGrid } from "@/components/registry/registry-loading-grid"
import { Button } from "@/components/ui/button"
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
  const defaultRegistry = useMemo(
    () => registries.find((registry) => registry.isDefault) ?? null,
    [registries],
  )
  const providerCount = useMemo(
    () => new Set(registries.map((registry) => registry.provider)).size,
    [registries],
  )

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
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <div className="rounded-[26px] border border-border/70 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--card)_92%,white_8%)_0%,color-mix(in_srgb,var(--background)_92%,var(--card)_8%)_100%)] px-5 py-5 shadow-[0_20px_45px_rgba(15,23,42,0.05)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/70">
            Registry Control
          </p>
          <div className="mt-3 max-w-2xl space-y-2">
            <h1 className="text-[2rem] font-semibold tracking-tight">Registries</h1>
            <p className="max-w-xl text-sm leading-5 text-muted-foreground">
              Connect private registries, set the primary source of truth, and jump straight into repositories without leaving the control surface.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Button size="sm" onClick={handleAddRegistry}>
              <PlusIcon data-icon="inline-start" />
              Add Registry
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/repos">
                Browse repositories
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="rounded-[26px] border border-border/70 bg-card/92 px-4 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">
            <ShieldCheckIcon className="size-3.5 text-primary" />
            Fleet Snapshot
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <SummaryStat label="Registries" value={String(registries.length)} />
            <SummaryStat label="Providers" value={String(providerCount)} />
            <SummaryStat label="Default" value={defaultRegistry?.name ?? "Unset"} mono={false} />
          </div>
        </div>
      </div>

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
      ) : (
        <div className="grid items-start gap-4 md:grid-cols-2">
            {registries.map((registry) => (
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

function SummaryStat({
  label,
  value,
  mono = true,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="rounded-[18px] border border-border/70 bg-background/72 px-3.5 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className={`mt-2 text-base font-semibold tracking-tight text-foreground ${mono ? "font-mono" : ""}`}>
        {value}
      </p>
    </div>
  )
}
