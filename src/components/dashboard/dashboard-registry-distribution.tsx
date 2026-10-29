"use client"

import { ServerIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export interface DashboardRegistryDistributionProps {
  registriesWithStats: Array<{ id: string; name: string; repoCount: number }>
  totalRepositories: number
  isLoadingRegistries: boolean
  failedRegistryNames?: string[]
}

export function DashboardRegistryDistribution({
  registriesWithStats,
  totalRepositories,
  isLoadingRegistries,
  failedRegistryNames = [],
}: DashboardRegistryDistributionProps) {
  return (
    <div className="rounded-panel border border-panel-border bg-card p-4 shadow-panel shrink-0">
      <div className="flex items-center justify-between pb-3 border-b border-border/70">
        <div className="flex items-center gap-2">
          <ServerIcon className="size-3.5 text-primary" />
          <h2 className="text-xs font-semibold text-foreground">
            {"Registry distribution"}
          </h2>
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          {"by repositories"}
        </span>
      </div>

      <div className="mt-3.5 flex flex-col gap-3">
        {isLoadingRegistries ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-7 w-full rounded-control" />
          ))
        ) : registriesWithStats.length === 0 ? (
          <p className="text-xs text-muted-foreground">No registries connected yet.</p>
        ) : (
          registriesWithStats.map((reg) => {
            const sharePercentage =
              totalRepositories > 0
                ? Math.round((reg.repoCount / totalRepositories) * 100)
                : 0

            return (
              <div key={reg.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground truncate max-w-[150px]">
                    {reg.name}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {`${reg.repoCount} of ${totalRepositories} · ${sharePercentage}%`}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={sharePercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Repository share for ${reg.name}`}
                  className="h-1.5 w-full rounded-full bg-secondary overflow-hidden"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${Math.max(sharePercentage, 4)}%` }}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>

      {failedRegistryNames.length > 0 ? (
        <p className="mt-3.5 pt-3 border-t border-border/50 text-xs text-amber-400/90 leading-relaxed font-mono">
          {`Warning: ${failedRegistryNames.length} endpoint${failedRegistryNames.length > 1 ? "s" : ""} unreachable (${failedRegistryNames.join(", ")}).`}
        </p>
      ) : registriesWithStats.length === 0 ? (
        <p className="mt-3.5 pt-3 border-t border-border/50 text-xs text-muted-foreground leading-relaxed">
          {"No registry endpoints configured."}
        </p>
      ) : (
        <p className="mt-3.5 pt-3 border-t border-border/50 text-xs text-muted-foreground leading-relaxed">
          {`${registriesWithStats.length} connected registry endpoint${registriesWithStats.length > 1 ? "s" : ""} active.`}
        </p>
      )}
    </div>
  )
}

