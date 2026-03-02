"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { RegistryForm } from "@/components/registry/registry-form"
import type { ApiResponse } from "@/types/api"
import type { RegistryConnection } from "@/types/registry"

export default function EditRegistryPage() {
  const params = useParams<{ id: string }>()
  const [registry, setRegistry] = useState<RegistryConnection | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRegistry = async () => {
      try {
        const response = await fetch(`/api/v1/registries/${params.id}`, { cache: "no-store" })
        const payload = (await response.json()) as ApiResponse<RegistryConnection>

        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error?.message ?? "Unable to load registry")
        }

        setRegistry(payload.data)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load registry")
      } finally {
        setLoading(false)
      }
    }

    void loadRegistry()
  }, [params.id])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading registry...</p>
  }

  if (!registry) {
    return <p className="text-sm text-rose-500">Registry not found.</p>
  }

  return (
    <section className="max-w-3xl">
      <RegistryForm mode="edit" initialValue={registry} />
    </section>
  )
}
