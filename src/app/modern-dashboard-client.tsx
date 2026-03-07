"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DatabaseIcon,
  FolderIcon,
  TagIcon,
} from "lucide-react"
import { ModernDashboardContainer, ModernDashboardHeader, ModernDashboardSection, ModernDashboardGrid } from "@/components/dashboard/modern-dashboard-layout"
import { StatsGrid } from "@/components/dashboard/modern-stats-cards"
import { ModernRegistryList } from "@/components/dashboard/modern-registry-list"
import { ModernTopRepos } from "@/components/dashboard/modern-top-repos"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import type { RegistryConnection } from "@/types/registry"

interface ModernDashboardClientProps {
  initialRegistries?: RegistryConnection[]
}

export function ModernDashboardClient({ initialRegistries }: ModernDashboardClientProps) {
  const { dashboardData, isLoadingRegistries, isLoadingRepos, registries } = useDashboardData({ initialRegistries })

  const { totalRepositories, totalTags, registriesWithStats, chartData } = dashboardData

  const stats = [
    {
      title: "Registries",
      value: registries.length,
      icon: DatabaseIcon,
    },
    {
      title: "Repositories",
      value: totalRepositories,
      icon: FolderIcon,
    },
    {
      title: "Tags",
      value: totalTags,
      icon: TagIcon,
    },
  ]

  // Prepare registry counts
  const repoCounts = registriesWithStats.reduce((acc, reg) => {
    acc[reg.id] = reg.repoCount
    return acc
  }, {} as Record<string, number>)

  const tagCounts = registriesWithStats.reduce((acc, reg) => {
    acc[reg.id] = reg.tagCount
    return acc
  }, {} as Record<string, number>)

  const registryNames = registriesWithStats.reduce((acc, reg) => {
    acc[reg.id] = reg.name
    return acc
  }, {} as Record<string, string>)

  const topRepos = chartData.map((repo) => ({
    ...repo,
    registryName: registryNames[repo.registryId],
  }))

  if (!isLoadingRegistries && registries.length === 0) {
    return (
      <ModernDashboardContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <DatabaseIcon className="size-16 text-muted-foreground/40 mb-6" />
          <h2 className="text-2xl font-bold text-foreground mb-3">Welcome to Registry Dashboard</h2>
          <p className="text-muted-foreground mb-8 max-w-md">
            Connect your first Docker registry to start monitoring and managing your container images.
          </p>
          <Button asChild size="lg">
            <Link href="/registries/new">
              Connect First Registry
            </Link>
          </Button>
        </div>
      </ModernDashboardContainer>
    )
  }

  return (
    <ModernDashboardContainer>
      <ModernDashboardHeader
        title="Registry Dashboard"
        description="Monitor and manage your container registries"
      />

      {/* Stats Overview */}
      <StatsGrid stats={stats} isLoading={isLoadingRegistries} />

      {/* Main Content Grid */}
      <ModernDashboardGrid>
        {/* Active Connections */}
        <ModernDashboardSection
          title="Active Connections"
          description="Connected registries and their status"
          icon={DatabaseIcon}
          className="rounded-2xl border border-border/50 bg-card/30 p-6"
        >
          <ModernRegistryList
            registries={registries}
            repoCounts={repoCounts}
            tagCounts={tagCounts}
            isLoading={isLoadingRegistries}
          />
        </ModernDashboardSection>

        {/* Top Repositories */}
        <ModernDashboardSection
          title="Top Repositories"
          description="Repositories with the most tags"
          icon={FolderIcon}
          className="rounded-2xl border border-border/50 bg-card/30 p-6"
        >
          <ModernTopRepos
            repos={topRepos}
            isLoading={isLoadingRegistries || isLoadingRepos}
          />
        </ModernDashboardSection>
      </ModernDashboardGrid>

    </ModernDashboardContainer>
  )
}
