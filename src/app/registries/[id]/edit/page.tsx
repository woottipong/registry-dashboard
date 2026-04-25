"use client"

import { useParams } from "next/navigation"
import { RegistryForm } from "@/components/registry/registry-form"
import { Skeleton } from "@/components/ui/skeleton"
import { useRegistry } from "@/hooks/use-registries"

export default function EditRegistryPage() {
  const params = useParams<{ id: string }>()
  const { data: registry, isLoading, isError } = useRegistry(params.id)

  if (isLoading) {
    return <RegistryFormSkeleton />
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

function RegistryFormSkeleton() {
  return (
    <section className="mx-auto max-w-6xl">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <div className="flex flex-col gap-3 pb-2 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>
        </div>

        <div className="rounded-lg border border-border/70 bg-card/95 shadow-sm">
          <div className="px-4 pt-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-3 w-72 max-w-full" />
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 rounded-md" />
              </div>
            ))}
          </div>

          <div className="px-4 pb-3 pt-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-2 h-3 w-80 max-w-full" />
          </div>
          <div className="space-y-4 p-4 pt-0">
            <div className="grid gap-2 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-lg border border-border/70 bg-background/72 px-3 py-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-4 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="ml-7 mt-2 h-3 w-28" />
                </div>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 rounded-md" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card/95 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-4 w-96 max-w-full" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-20 rounded-md" />
            <Skeleton className="h-9 w-32 rounded-md" />
          </div>
        </div>
      </div>
    </section>
  )
}
