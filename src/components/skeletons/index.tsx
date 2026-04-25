import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function RegistryCardSkeleton() {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-56" />
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-14" />
        <Skeleton className="h-8 w-20" />
      </CardFooter>
    </Card>
  )
}

export function RepoCardSkeleton() {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="col-span-2 h-3 w-36" />
      </CardContent>
    </Card>
  )
}

const TAG_COLS = 6

export function TagTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {Array.from({ length: TAG_COLS }).map((_, i) => (
            <TableHead key={i}>
              <Skeleton className="h-4 w-16" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-24 font-mono" /></TableCell>
            <TableCell><Skeleton className="h-4 w-32 font-mono" /></TableCell>
            <TableCell><Skeleton className="h-4 w-14" /></TableCell>
            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-7 w-24" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function ManifestSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-48 rounded-full" />
        <Skeleton className="h-5 w-32 rounded-full" />
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  )
}

export function LayerListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-1">
      <div className="mb-3 grid grid-cols-[2rem_1fr_6rem_10rem] gap-3 px-3 text-xs">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="ml-auto h-4 w-10" />
        <Skeleton className="h-4 w-20" />
      </div>

      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="relative overflow-hidden rounded-md border border-border/70 bg-card px-3 py-2"
        >
          <Skeleton
            className="absolute inset-y-0 left-0 rounded-none bg-primary/8"
            style={{ width: `${Math.max(18, 82 - index * 9)}%` }}
          />
          <div className="relative grid grid-cols-[2rem_1fr_6rem_10rem] items-center gap-3 text-xs">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32 font-mono" />
            <Skeleton className="ml-auto h-4 w-14" />
            <Skeleton className="h-4 w-32 max-w-full" />
          </div>
        </div>
      ))}

      <div className="flex justify-end border-t border-border/70 pt-2">
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  )
}

export function StatsCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <Skeleton className="size-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-16" />
        </div>
      </CardContent>
    </Card>
  )
}
