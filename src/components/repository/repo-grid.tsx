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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-card border bg-muted/40" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {repositories.map((repository) => (
        <RepoCard key={repository.fullName} registryId={registryId} repository={repository} />
      ))}
    </div>
  )
}
