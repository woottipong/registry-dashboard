"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeftIcon, ServerOffIcon } from "lucide-react"
import { RegistryForm } from "@/components/registry/registry-form"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useRegistry } from "@/hooks/use-registries"

export default function EditRegistryPage() {
  const params = useParams<{ id: string }>()
  const { data: registry, isLoading, isError } = useRegistry(params.id)

  if (isLoading) {
    return <RegistryFormSkeleton />
  }

  if (isError || !registry) {
    return (
      <section className="mx-auto max-w-4xl">
        <div className="rounded-panel border border-panel-border bg-card p-12 text-center shadow-panel space-y-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-control bg-secondary text-muted-foreground border border-border/70">
            <ServerOffIcon className="size-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Registry connection not found</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              The requested registry ID may have been deleted or does not exist.
            </p>
          </div>
          <Button variant="outline" size="sm" className="rounded-control shadow-xs text-xs gap-1.5 h-8 px-3.5" asChild>
            <Link href="/registries">
              <ArrowLeftIcon className="size-3.5" />
              <span>Back to registries</span>
            </Link>
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-4xl">
      <RegistryForm mode="edit" initialValue={registry} />
    </section>
  )
}

function RegistryFormSkeleton() {
  return (
    <section className="mx-auto max-w-4xl">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 pb-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-36 rounded-md" />
            <Skeleton className="h-4 w-80 max-w-full rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 rounded-control" />
            <Skeleton className="h-8 w-20 rounded-control" />
          </div>
        </div>

        <div className="rounded-panel border border-panel-border shadow-panel overflow-hidden bg-card">
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
                    <Skeleton className="h-9 w-full rounded-control" />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border/40" />

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
                  <div key={index} className="rounded-control border border-border/60 bg-muted/20 p-3.5 space-y-2">
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

          <div className="border-t px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-panel-border bg-secondary/20">
            <Skeleton className="h-3.5 w-64 max-w-full rounded-md" />
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Skeleton className="h-8 w-16 rounded-control flex-1 sm:flex-initial" />
              <Skeleton className="h-8 w-28 rounded-control flex-1 sm:flex-initial" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
