"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { RegistryCard } from "@/components/registry/registry-card"
import { Button } from "@/components/ui/button"
import type { ApiResponse } from "@/types/api"
import type { RegistryConnection } from "@/types/registry"

export default function RegistriesPage() {
  const [registries, setRegistries] = useState<RegistryConnection[]>([])
  const [loading, setLoading] = useState(true)

  const loadRegistries = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/v1/registries", { cache: "no-store" })
      const payload = (await response.json()) as ApiResponse<RegistryConnection[]>

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error?.message ?? "Unable to load registries")
      }

      setRegistries(payload.data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load registries")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRegistries()
  }, [])

  const handleDeleted = (id: string) => {
    setRegistries((prev) => prev.filter((item) => item.id !== id))
  }

  const handleSetDefault = async (id: string) => {
    const selected = registries.find((item) => item.id === id)
    if (!selected) return

    try {
      const response = await fetch(`/api/v1/registries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selected.name,
          url: selected.url,
          provider: selected.provider,
          authType: selected.authType,
          credentials: selected.credentials,
          namespace: selected.namespace,
          isDefault: true,
        }),
      })

      const payload = (await response.json()) as ApiResponse<RegistryConnection>
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? "Unable to set default")
      }

      setRegistries((prev) =>
        prev.map((item) => ({
          ...item,
          isDefault: item.id === id,
        })),
      )
      toast.success("Default registry updated")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to set default")
    }
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

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading registries...</p>
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
