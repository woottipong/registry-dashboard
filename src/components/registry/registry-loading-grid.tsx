import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function RegistryLoadingGrid() {
  return (
    <div className="grid items-start gap-3 xl:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card
          key={index}
          className="h-auto self-start overflow-hidden rounded-lg border-border/70 bg-card/95 py-0 shadow-sm gap-0"
        >
          <CardHeader className="gap-3 px-4 pb-3 pt-4">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-[13px] w-48" />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
              <Skeleton className="size-8 rounded-full" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Skeleton className="h-9 rounded-lg" />
              <Skeleton className="h-9 rounded-lg" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 px-4 pb-3 pt-0">
            <Skeleton className="h-[4.25rem] rounded-lg" />
            <Skeleton className="h-[4.75rem] rounded-lg" />
          </CardContent>
          <CardContent className="px-4 pb-4 pt-0">
            <Skeleton className="h-9 w-full rounded-md" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
