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
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex flex-col gap-3 pb-2 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-36 rounded-lg" />
            <Skeleton className="h-4 w-80 max-w-full rounded-md" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-9 w-20 rounded-full" />
          </div>
        </div>

        <div className="rounded-[28px] border-0 bg-card p-6 shadow-xs">
          <div>
            <Skeleton className="h-5 w-28 rounded-md" />
            <Skeleton className="mt-2 h-3.5 w-72 max-w-full rounded-md" />
          </div>
          <div className="grid gap-4 pt-6 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>

          <div className="pb-3 pt-6">
            <Skeleton className="h-5 w-32 rounded-md" />
            <Skeleton className="mt-2 h-3.5 w-80 max-w-full rounded-md" />
          </div>
          <div className="space-y-4 pt-1">
            <div className="grid gap-3 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-border/60 bg-secondary/30 p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-4 rounded-full" />
                    <Skeleton className="h-4 w-24 rounded-md" />
                  </div>
                  <Skeleton className="ml-7 mt-2 h-3 w-28 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-[24px] border-0 bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-4 w-72 max-w-full rounded-md" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-20 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-full" />
          </div>
        </div>
      </div>
    </section>
  )
}
