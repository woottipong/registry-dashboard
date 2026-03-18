import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function RegistryLoadingGrid() {
  return (
    <div className="grid items-start gap-5 md:grid-cols-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card
          key={index}
          className="overflow-hidden rounded-[24px] border-border/70 gap-0 bg-card/95 py-0"
        >
          <CardHeader className="gap-4 px-5 pb-4 pt-5">
            <div className="flex items-start gap-4">
              <div className="flex flex-1 flex-col gap-3">
                <Skeleton className="h-5 w-20 rounded-full" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-28 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="size-8 rounded-full" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Skeleton className="h-10 rounded-[16px]" />
              <Skeleton className="h-10 rounded-[16px]" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-5 pb-4 pt-0">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-14 w-full rounded-[18px]" />
            <Skeleton className="h-16 w-full rounded-[20px]" />
          </CardContent>
          <CardContent className="px-5 pb-5 pt-0">
            <Skeleton className="h-10 w-full rounded-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
