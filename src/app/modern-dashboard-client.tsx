"use client"

import Link from "next/link"
import { DatabaseIcon, FolderIcon, TagIcon } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import type { RegistryConnection } from "@/types/registry"

interface ModernDashboardClientProps {
  initialRegistries?: RegistryConnection[]
}

export function ModernDashboardClient({ initialRegistries }: ModernDashboardClientProps) {
  const { dashboardData, isLoadingRegistries, isLoadingRepos, registries } = useDashboardData({
    initialRegistries,
  })

  const { totalRepositories, totalTags, registriesWithStats, chartData } = dashboardData

  if (!isLoadingRegistries && registries.length === 0) {
    return (
      <section className="mx-auto flex max-w-6xl flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your connected registries.
          </p>
        </div>
        <EmptyState
          icon={<DatabaseIcon className="size-5" />}
          title="No registries connected"
          description="Connect your first registry to start browsing repositories and image tags."
          action={
            <Button asChild>
              <Link href="/registries/new">Connect Registry</Link>
            </Button>
          }
        />
      </section>
    )
  }

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Registries, repositories, and tags at a glance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Registries"
          value={registries.length}
          description="Connected endpoints"
          icon={<DatabaseIcon className="size-5 text-muted-foreground" />}
          isLoading={isLoadingRegistries}
        />
        <StatCard
          title="Repositories"
          value={totalRepositories}
          description="Repositories found"
          icon={<FolderIcon className="size-5 text-muted-foreground" />}
          isLoading={isLoadingRegistries || isLoadingRepos}
        />
        <StatCard
          title="Tags"
          value={totalTags}
          description="Tags counted"
          icon={<TagIcon className="size-5 text-muted-foreground" />}
          isLoading={isLoadingRegistries || isLoadingRepos}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden border-border/70">
          <CardHeader className="gap-1 border-b pb-4">
            <CardTitle>Registry Summary</CardTitle>
            <CardDescription>Inventory by registry.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-4">
            {isLoadingRegistries ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between rounded-xl border p-4">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))
            ) : (
              registriesWithStats.map((registry) => (
                <Link
                  key={registry.id}
                  href={`/repos?registry=${registry.id}`}
                  className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background/70 p-4 transition-colors hover:bg-muted/40 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{registry.name}</p>
                      {registry.isDefault ? <Badge>Default</Badge> : null}
                      <Badge variant="secondary">{registry.provider}</Badge>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{registry.url}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <Badge variant="outline">{registry.repoCount} repos</Badge>
                    <Badge variant="outline">{registry.tagCount} tags</Badge>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border/70">
          <CardHeader className="gap-1 border-b pb-4">
            <CardTitle>Top Repositories</CardTitle>
            <CardDescription>Most-tagged repositories.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-4">
            {isLoadingRegistries || isLoadingRepos ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between rounded-xl border p-3">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))
            ) : chartData.length === 0 ? (
              <EmptyState
                icon={<FolderIcon className="size-5" />}
                title="No repository data yet"
                description="Repository statistics will appear here after registries finish loading."
              />
            ) : (
              chartData.map((repo) => {
                const registry = registriesWithStats.find((item) => item.id === repo.registryId)
                return (
                  <Link
                    key={`${repo.registryId}-${repo.name}`}
                    href={`/repos/${repo.registryId}/${repo.name}`}
                    className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background/70 p-3 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex flex-col gap-1">
                      <p className="truncate font-medium">{repo.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{registry?.name ?? repo.registryId}</p>
                    </div>
                    <Badge variant="outline" className="w-fit">
                      {repo.tagCount} tags
                    </Badge>
                  </Link>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

interface StatCardProps {
  title: string
  value: number
  description: string
  icon: React.ReactNode
  isLoading: boolean
}

function StatCard({ title, value, description, icon, isLoading }: StatCardProps) {
  return (
    <Card className="overflow-hidden border-border/70">
      <CardHeader className="gap-1">
        <div className="flex items-center justify-between gap-3">
          <CardDescription>{title}</CardDescription>
          {icon}
        </div>
        <CardTitle className="text-3xl">{isLoading ? <Skeleton className="h-8 w-16" /> : value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
