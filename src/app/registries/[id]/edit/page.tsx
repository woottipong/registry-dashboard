"use client"

import { useParams } from "next/navigation"
import { RegistryForm } from "@/components/registry/registry-form"
import { Skeleton } from "@/components/ui/skeleton"
import { useRegistry } from "@/hooks/use-registries"

export default function EditRegistryPage() {
  const params = useParams<{ id: string }>()
  const { data: registry, isLoading, isError } = useRegistry(params.id)

  if (isLoading) {
    return <Skeleton className="mx-auto h-[42rem] w-full max-w-6xl rounded-[26px]" />
  }

  if (isError || !registry) {
    return <p className="mx-auto max-w-6xl text-sm text-destructive">Registry not found.</p>
  }

  return (
    <section className="mx-auto max-w-6xl">
      <RegistryForm mode="edit" initialValue={registry} />
    </section>
  )
}
