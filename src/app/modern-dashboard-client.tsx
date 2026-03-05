"use client"

import { motion } from "framer-motion"
import {
  DatabaseIcon,
  FolderIcon,
  TagIcon,
  HardDriveIcon,
  ActivityIcon
} from "lucide-react"
import { ModernDashboardContainer, ModernDashboardHeader, ModernDashboardSection, ModernDashboardGrid } from "@/components/dashboard/modern-dashboard-layout"
import { StatsGrid } from "@/components/dashboard/modern-stats-cards"
import { ModernRegistryList } from "@/components/dashboard/modern-registry-list"
import { ModernActivityFeed } from "@/components/dashboard/modern-activity-feed"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { useActivity } from "@/contexts/activity-context"

export function ModernDashboardClient() {
  const { dashboardData, isLoadingRegistries, isLoadingRepos, registries } = useDashboardData()
  const { activities } = useActivity()

  const { totalRepositories, totalTags, totalSizeBytes, chartData, registriesWithStats } = dashboardData

  // Prepare stats for the modern stats grid
  const stats = [
    {
      title: "Registries",
      value: registries.length,
      icon: DatabaseIcon,
      trend: { value: 12, isPositive: true }
    },
    {
      title: "Repositories",
      value: totalRepositories,
      icon: FolderIcon,
      trend: { value: 8, isPositive: true }
    },
    {
      title: "Tags",
      value: totalTags,
      icon: TagIcon,
      trend: { value: 5, isPositive: false }
    },
    {
      title: "Storage",
      value: `${(totalSizeBytes / (1024 * 1024 * 1024)).toFixed(1)}GB`,
      icon: HardDriveIcon,
      trend: { value: 3, isPositive: true }
    }
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

  if (!isLoadingRegistries && registries.length === 0) {
    return (
      <ModernDashboardContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <DatabaseIcon className="w-16 h-16 text-muted-foreground/40 mb-6" />
          <h2 className="text-2xl font-bold text-foreground mb-3">Welcome to Registry Dashboard</h2>
          <p className="text-muted-foreground mb-8 max-w-md">
            Connect your first Docker registry to start monitoring and managing your container images.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Connect First Registry
          </motion.button>
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
      <ModernDashboardSection title="Overview">
        <StatsGrid stats={stats} isLoading={isLoadingRegistries} />
      </ModernDashboardSection>

      {/* Main Content Grid */}
      <ModernDashboardGrid>
        {/* Active Connections */}
        <ModernDashboardSection
          title="Active Connections"
          description="Connected registries and their status"
          icon={DatabaseIcon}
        >
          <ModernRegistryList
            registries={registries}
            repoCounts={repoCounts}
            tagCounts={tagCounts}
            isLoading={isLoadingRegistries}
          />
        </ModernDashboardSection>

        {/* Recent Activity */}
        <ModernDashboardSection
          title="Recent Activity"
          description="Latest registry operations and events"
          icon={ActivityIcon}
        >
          <ModernActivityFeed
            activities={activities}
            isLoading={isLoadingRegistries}
            maxItems={8}
          />
        </ModernDashboardSection>
      </ModernDashboardGrid>

    </ModernDashboardContainer>
  )
}
