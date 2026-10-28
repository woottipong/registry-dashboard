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
        <div className="flex flex-col gap-3 pb-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-36 rounded-lg" />
            <Skeleton className="h-4 w-80 max-w-full rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#18181B] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="p-6 sm:p-7 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <Skeleton className="size-7 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-3 w-72 max-w-full rounded-md" />
                </div>
              </div>
              <div className="grid gap-4 pt-1 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="h-3.5 w-24 rounded-md" />
                    <Skeleton className="h-9 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-black/[0.06] dark:border-white/[0.06]" />

            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <Skeleton className="size-7 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-3 w-80 max-w-full rounded-md" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 pt-1">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="size-4 rounded-full" />
                        <Skeleton className="h-3.5 w-20 rounded-md" />
                      </div>
                      <Skeleton className="size-3.5 rounded-sm" />
                    </div>
                    <Skeleton className="h-3 w-28 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-black/[0.06] dark:border-white/[0.08] bg-black/[0.015] dark:bg-white/[0.02] px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Skeleton className="h-3.5 w-64 max-w-full rounded-md" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-16 rounded-full" />
              <Skeleton className="h-8 w-28 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
