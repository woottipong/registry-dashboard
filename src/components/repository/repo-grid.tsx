"use client"

import { motion } from "framer-motion"
import { RepoCard } from "@/components/repository/repo-card"
import type { Repository } from "@/types/registry"

interface RepoGridProps {
  registryId: string
  repositories: Repository[]
  isLoading?: boolean
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
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
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4"
    >
      {repositories.map((repository) => (
        <motion.div key={repository.fullName} variants={item}>
          <RepoCard
            registryId={registryId}
            repository={repository}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}
