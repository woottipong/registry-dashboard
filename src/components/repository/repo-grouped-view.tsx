"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRightIcon } from "lucide-react"
import { RepoTable } from "./repo-table"
import { RepoGrid } from "./repo-grid"
import type { Repository } from "@/types/registry"
import { cn } from "@/lib/utils"

interface RepoGroupedViewProps {
  registryId: string
  repositories: Repository[]
  viewMode: "grid" | "table"
}

export function RepoGroupedView({ registryId, repositories, viewMode }: RepoGroupedViewProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  // Group repositories by namespace
  const groupedRepos = useMemo(() => {
    const groups: Record<string, Repository[]> = {}
    
    repositories.forEach((repo) => {
      // For images without namespace (e.g., library/nginx or just nginx), we use "library" or root
      const namespace = repo.namespace || "root"
      if (!groups[namespace]) {
        groups[namespace] = []
      }
      groups[namespace].push(repo)
    })
    
    // Sort namespaces alphabetically
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [repositories])

  const toggleGroup = (namespace: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [namespace]: !prev[namespace]
    }))
  }

  // If there's only one group or no namespace concept at all, we might want to just expand it by default
  // For now, we start completely collapsed to match requirements
  useMemo(() => {
    const initialExpanded: Record<string, boolean> = {}
    groupedRepos.forEach(([namespace]) => {
      initialExpanded[namespace] = false
    })
    setExpandedGroups(initialExpanded)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupedRepos.length]) // Only run when the number of groups changes

  if (repositories.length === 0) return null

  return (
    <div className="space-y-4">
      {groupedRepos.map(([namespace, repos]) => {
        const isExpanded = expandedGroups[namespace] ?? true
        const totalTags = repos.reduce((sum, r) => sum + (r.tagCount ?? 0), 0)

        return (
          <div key={namespace} className="rounded-2xl border border-border/50 bg-card/30 overflow-hidden backdrop-blur-sm">
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(namespace)}
              className="w-full flex items-center justify-between px-6 py-4 bg-background hover:bg-muted/50 transition-colors text-left border-b border-border/50"
            >
              <div className="flex items-center gap-4">
                <motion.div
                  initial={false}
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-primary"
                >
                  <ChevronRightIcon className="size-6 stroke-[3]" />
                </motion.div>
                <span className="font-medium text-foreground">
                  {namespace === "root" ? "/" : `${namespace}/`}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground pr-2">
                <span>{totalTags} images</span>
                <ChevronRightIcon className="size-4 opacity-50" />
              </div>
            </button>

            {/* Group Content */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className={cn(
                    "p-4 border-t border-border/50 bg-background/30",
                    viewMode === "grid" ? "" : "p-0"
                  )}>
                    {viewMode === "grid" ? (
                      <RepoGrid registryId={registryId} repositories={repos} />
                    ) : (
                      <RepoTable registryId={registryId} repositories={repos} />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
