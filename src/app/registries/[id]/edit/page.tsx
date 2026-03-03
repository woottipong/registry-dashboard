"use client"

import { useParams } from "next/navigation"
import { RegistryForm } from "@/components/registry/registry-form"
import { Skeleton } from "@/components/ui/skeleton"
import { useRegistry } from "@/hooks/use-registries"

export default function EditRegistryPage() {
  const params = useParams<{ id: string }>()
  const { data: registry, isLoading, isError } = useRegistry(params.id)

  if (isLoading) {
    return <Skeleton className="h-96 w-full max-w-3xl rounded-card" />
  }

  if (isError || !registry) {
    return <p className="text-sm text-destructive">Registry not found.</p>
  }

  return (
    <section className="max-w-3xl">
      <RegistryForm mode="edit" initialValue={registry} />
    </section>
  )
}
