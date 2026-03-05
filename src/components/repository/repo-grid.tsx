"use client"

import { RepoCard } from "@/components/repository/repo-card"
import type { Repository } from "@/types/registry"

interface RepoGridProps {
  registryId: string
  repositories: Repository[]
  isLoading?: boolean
}

export function RepoGrid({ registryId, repositories, isLoading = false }: RepoGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-64 animate-pulse rounded-3xl border border-border/50 bg-card/50 shadow-sm" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {repositories.map((repository) => (
        <div key={repository.fullName}>
          <RepoCard
            registryId={registryId}
            repository={repository}
          />
        </div>
      ))}
    </div>
  )
}
