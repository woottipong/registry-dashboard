import { Skeleton } from "@/components/ui/skeleton"

export function RegistryLoadingGrid() {
  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col justify-between gap-4 rounded-control border border-border/70 bg-secondary/20 p-4"
        >
          {/* Top Header Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <Skeleton className="size-8 rounded-control shrink-0" />
              <div className="min-w-0 space-y-1.5">
                <Skeleton className="h-4 w-32 rounded-sm" />
                <Skeleton className="h-3 w-40 rounded-sm" />
              </div>
            </div>
            <Skeleton className="size-8 rounded-control shrink-0" />
          </div>

          {/* Badges Strip */}
          <div className="flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-1">
            <Skeleton className="h-5 w-20 rounded-control" />
            <Skeleton className="h-5 w-24 rounded-control" />
            <Skeleton className="h-5 w-24 rounded-control" />
            <Skeleton className="h-5 w-16 rounded-control" />
          </div>

          {/* Capabilities Row */}
          <div className="flex items-center justify-between pt-1">
            <Skeleton className="h-3 w-20 rounded-sm" />
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-14 rounded-control" />
              <Skeleton className="h-4 w-14 rounded-control" />
              <Skeleton className="h-4 w-14 rounded-control" />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-border/40 pt-2">
            <Skeleton className="h-8 w-16 rounded-control" />
            <Skeleton className="h-8 w-36 rounded-control" />
          </div>
        </div>
      ))}
    </div>
  )
}

