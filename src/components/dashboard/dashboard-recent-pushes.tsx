"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRightIcon,
  CheckIcon,
  CopyIcon,
  TagIcon,
  UploadIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

export interface RecentPushedItem {
  id: string
  repository: string
  tag: string
  registryName: string
  user?: string
  timestamp: string
  pullCommand: string
  href: string
}

export interface DashboardRecentPushesProps {
  recentPushedImages: RecentPushedItem[]
  isMounted: boolean
  copiedCommandId: string | null
  onCopyCommand: (cmd: string, id: string) => void
}

export function DashboardRecentPushes({
  recentPushedImages,
  isMounted,
  copiedCommandId,
  onCopyCommand,
}: DashboardRecentPushesProps) {
  const router = useRouter()

  const safeFormatDate = (dateInput?: string | null): string => {
    if (!dateInput) return "Indexed in catalog"
    try {
      return formatDate(dateInput)
    } catch {
      return "Indexed in catalog"
    }
  }

  const formatRelativeTime = (dateInput?: string | null): string => {
    if (!dateInput) return "catalog"
    try {
      const formatted = formatDate(dateInput).split(" (")[0] || ""
      return formatted
        .replace(" seconds ago", "s ago")
        .replace(" second ago", "s ago")
        .replace(" minutes ago", "m ago")
        .replace(" minute ago", "m ago")
        .replace(" hours ago", "h ago")
        .replace(" hour ago", "h ago")
        .replace(" days ago", "d ago")
        .replace(" day ago", "d ago")
        .replace(" months ago", "mo ago")
        .replace(" month ago", "mo ago") || formatted
    } catch {
      return "catalog"
    }
  }

  return (
    <div className="rounded-panel border border-panel-border bg-card shadow-panel overflow-hidden flex flex-col justify-between flex-1">
      <div className="flex flex-col flex-1">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
          <div className="flex items-center gap-2">
            <UploadIcon className="size-3.5 text-primary" />
            <h2 className="text-xs font-semibold text-foreground">
              {"Recent pushed images"}
            </h2>
          </div>
          {!isMounted ? (
            <Skeleton className="h-5 w-16 rounded-control" />
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-control bg-secondary/80 border border-border/70 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              {"5 latest"}
            </span>
          )}
        </div>

        {/* Items List */}
        <div
          className={cn(
            "divide-y divide-border/40 px-4 flex flex-col flex-1 py-1",
            recentPushedImages.length >= 4 ? "justify-between" : "justify-start gap-1",
          )}
        >
          {!isMounted ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="py-2.5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-32 rounded-control" />
                  <Skeleton className="h-3 w-14 rounded-control" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-24 rounded-control" />
                  <Skeleton className="h-3 w-10 rounded-control" />
                </div>
              </div>
            ))
          ) : recentPushedImages.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground flex-1 flex items-center justify-center">
              {"No pushed images recorded yet."}
            </div>
          ) : (
            recentPushedImages.map((item) => (
              <div
                key={item.id}
                tabIndex={0}
                role="button"
                onClick={() => router.push(item.href)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    router.push(item.href)
                  }
                }}
                className="group flex flex-col gap-1 py-2 px-1.5 -mx-1.5 rounded-control transition-colors hover:bg-secondary/40 focus:bg-secondary/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 cursor-pointer"
              >
                {/* Top line: Repo name + Tag badge + Time */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Link
                      href={item.href}
                      onClick={(e) => e.stopPropagation()}
                      className="font-mono text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate max-w-[190px] hover:underline focus-visible:outline-none focus-visible:underline"
                      title={item.repository}
                    >
                      {item.repository}
                    </Link>
                    <span className="inline-flex items-center gap-1 rounded-control bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.2 font-mono text-[10px] font-medium shrink-0">
                      <TagIcon className="size-2.5" />
                      <span className="truncate max-w-[80px]">{item.tag}</span>
                    </span>
                  </div>
                  <span
                    className="font-mono text-[10px] text-muted-foreground shrink-0"
                    suppressHydrationWarning
                    title={safeFormatDate(item.timestamp)}
                  >
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </div>

                {/* Bottom line: Endpoint & actor + Quick Actions */}
                <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground font-mono">
                  <span className="truncate max-w-[170px]">
                    {item.registryName}
                    {item.user ? ` · ${item.user}` : ""}
                  </span>

                  <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onCopyCommand(item.pullCommand, item.id)
                      }}
                      className="p-1.5 rounded-control text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                      title={`Copy: ${item.pullCommand}`}
                      aria-label={`Copy pull command for ${item.repository}`}
                    >
                      {copiedCommandId === item.id ? (
                        <CheckIcon className="size-3 text-success" />
                      ) : (
                        <CopyIcon className="size-3" />
                      )}
                    </button>
                    <Link
                      href={item.href}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-control text-muted-foreground group-hover:text-primary hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      title={`Inspect ${item.repository}:${item.tag}`}
                      aria-label={`Inspect ${item.repository}:${item.tag}`}
                    >
                      <ArrowRightIcon className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer summary - aligned with Left Table footer banner */}
      <div className="flex items-center justify-between border-t border-border/70 bg-secondary/20 px-4 py-2.5 text-xs text-muted-foreground mt-auto">
        <span className="font-mono text-[11px]">{"Push telemetry feed"}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[11px] font-mono px-2 hover:text-primary transition-colors cursor-pointer"
          asChild
        >
          <Link href="/repos">
            <span>{"View all repos"}</span>
            <ArrowRightIcon className="ml-1 size-3" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

