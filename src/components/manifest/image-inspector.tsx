"use client"

import React, { useCallback, useMemo, useSyncExternalStore } from "react"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import {
  AlertTriangleIcon,
  ChevronLeftIcon,
  CalendarIcon,
  ClipboardIcon,
  CpuIcon,
  HardDriveIcon,
  HistoryIcon,
  LayersIcon,
  RefreshCwIcon,
  SettingsIcon,
} from "lucide-react"
import Link from "next/link"
import { copyToClipboard } from "@/lib/clipboard"
import { EmptyState as AppEmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import dynamic from "next/dynamic"
import { LayerListSkeleton, ManifestSkeleton } from "@/components/skeletons"

const ConfigInspector = dynamic(
  () => import("@/components/manifest/config-inspector").then((m) => m.ConfigInspector),
  { loading: () => <ManifestSkeleton /> },
)
const HistoryTimeline = dynamic(
  () => import("@/components/manifest/history-timeline").then((m) => m.HistoryTimeline),
  { loading: () => <ManifestSkeleton /> },
)
const LayerList = dynamic(
  () => import("@/components/manifest/layer-list").then((m) => m.LayerList),
  { loading: () => <LayerListSkeleton /> },
)
const ManifestViewer = dynamic(
  () => import("@/components/manifest/manifest-viewer").then((m) => m.ManifestViewer),
  { loading: () => <ManifestSkeleton /> },
)
import { formatBytes, formatDate, generatePullCommand, registryHostFromUrl, truncateDigest } from "@/lib/format"
import { useManifest } from "@/hooks/use-manifest"

interface ImageInspectorProps {
  registryId: string
  repoName: string
  tag: string
  registryName?: string
  registryUrl?: string
}

// Main component wrapped with error boundary
const ImageInspectorWithBoundary = React.memo((props: ImageInspectorProps) => (
  <ErrorBoundary>
    <ImageInspector {...props} />
  </ErrorBoundary>
))

ImageInspectorWithBoundary.displayName = 'ImageInspectorWithBoundary'

export { ImageInspectorWithBoundary as ImageInspector }

function ImageInspector({ registryId, repoName, tag, registryName, registryUrl }: ImageInspectorProps) {
  const isHydrated = useHydrated()
  const parentRepoUrl = `/repos/${registryId}/${repoName}`
  const { data, isLoading, isError, error, refetch } = useManifest(registryId, repoName, tag)

  // Memoize expensive computations
  const pullCommand = useMemo(() =>
    generatePullCommand({
      registry: registryUrl ? registryHostFromUrl(registryUrl) : undefined,
      repository: repoName,
      tag,
    }),
    [repoName, tag, registryUrl]
  )

  const truncatedDigest = useMemo(() =>
    data ? truncateDigest(data.manifest.digest, 12) : '',
    [data]
  )

  const platform = useMemo(() =>
    data?.config?.os && data?.config?.architecture
      ? `${data.config.os}/${data.config.architecture}`
      : '—',
    [data]
  )

  // Memoize event handlers
  const copyPullCommand = useCallback(() => {
    void copyToClipboard(pullCommand, "Pull command copied to clipboard")
  }, [pullCommand])

  if (isLoading) {
    return (
      <ImageInspectorLoading detailed={isHydrated} />
    )
  }

  if (isError || !data) {
    return (
      <AppEmptyState
        icon={<AlertTriangleIcon className="size-5" />}
        title="Failed to load image"
        description={error?.message ?? "Unable to fetch image manifest."}
        action={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => void refetch()}>
              <RefreshCwIcon data-icon="inline-start" />
              Retry
            </Button>
            <Button variant="ghost" asChild>
              <Link href={parentRepoUrl}>Back</Link>
            </Button>
          </div>
        }
        className="rounded-panel bg-background/70"
      />
    )
  }

  const { manifest, config } = data

  return (
    <section className="mx-auto flex w-full max-w-page flex-col gap-5 pt-2 sm:pt-4">
      <div className="flex flex-col gap-3 pb-1">
        {/* Breadcrumb / Tag Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground -ml-1 gap-1"
          >
            <Link href={parentRepoUrl}>
              <ChevronLeftIcon className="size-3.5" />
              <span>Tags</span>
            </Link>
          </Button>
          <span className="text-muted-foreground/40">/</span>
          {registryName ? (
            <span className="inline-flex items-center rounded-control border border-panel-border bg-secondary/30 px-2 py-0.5 text-xs text-muted-foreground">
              {registryName}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5 rounded-control border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-mono font-semibold text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            {tag}
          </span>
          <span className="inline-flex items-center rounded-control border border-panel-border bg-secondary/30 px-2 py-0.5 font-mono text-xs text-muted-foreground">
            {truncatedDigest}
          </span>
        </div>

        {/* Title and Pull Action */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-mono">
              {repoName}
            </h1>
            <p className="text-xs text-muted-foreground">
              Inspect layers, configuration, history, and raw manifest data.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={copyPullCommand}
            className="rounded-control border-panel-border bg-secondary/30 px-3 text-xs font-mono shadow-xs gap-1.5 hover:bg-secondary/60 hover:text-foreground text-foreground w-fit shrink-0"
          >
            <ClipboardIcon className="size-3.5 text-muted-foreground" />
            <span>Copy Pull Command</span>
          </Button>
        </div>

        {/* Compact Metadata Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 rounded-panel border border-panel-border bg-card/60 divide-y sm:divide-y-0 sm:divide-x divide-panel-border shadow-panel overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex size-7 items-center justify-center rounded-control bg-secondary/50 text-muted-foreground shrink-0 border border-panel-border/50">
              <CpuIcon className="size-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Platform</div>
              <div className="text-xs font-mono font-medium text-foreground truncate">{platform}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex size-7 items-center justify-center rounded-control bg-secondary/50 text-muted-foreground shrink-0 border border-panel-border/50">
              <HardDriveIcon className="size-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Total Size</div>
              <div className="text-xs font-mono font-medium text-foreground">
                {formatBytes(manifest.totalSize)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex size-7 items-center justify-center rounded-control bg-secondary/50 text-muted-foreground shrink-0 border border-panel-border/50">
              <LayersIcon className="size-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Layers</div>
              <div className="text-xs font-mono font-medium text-foreground">{manifest.layers.length} layers</div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex size-7 items-center justify-center rounded-control bg-secondary/50 text-muted-foreground shrink-0 border border-panel-border/50">
              <CalendarIcon className="size-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Created</div>
              <div className="text-xs font-mono font-medium text-foreground truncate" title={config?.created ? formatDate(config.created) : undefined}>
                {config?.created ? formatDate(config.created) : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-panel p-5 sm:p-7 shadow-panel border border-panel-border bg-card">
        <div className="pb-4">
          <h2 className="text-base font-semibold tracking-tight">Manifest Workspace</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Review layers, configuration, history, and raw manifest data.</p>
        </div>
        <div>
          <Tabs defaultValue="layers">
            <TabsList variant="line" className="grid w-full grid-cols-4 sm:max-w-md">
              <TabsTrigger value="layers">Layers</TabsTrigger>
              <TabsTrigger value="config">Config</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="raw">Raw</TabsTrigger>
            </TabsList>

            <TabsContent value="layers" className="mt-3">
              <LayerList layers={manifest.layers} />
            </TabsContent>

            <TabsContent value="config" className="mt-3">
              {config ? (
                <ConfigInspector config={config} />
              ) : (
                <AppEmptyState
                  icon={<SettingsIcon className="size-5" />}
                  title="Config not available"
                  className="rounded-lg bg-background/70"
                />
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-3">
              {config?.history?.length ? (
                <HistoryTimeline history={config.history} />
              ) : (
                <AppEmptyState
                  icon={<HistoryIcon className="size-5" />}
                  title="No history"
                  className="rounded-lg bg-background/70"
                />
              )}
            </TabsContent>

            <TabsContent value="raw" className="mt-3">
              <ManifestViewer manifest={manifest} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  )
}

const subscribeHydration = () => () => undefined
const getClientHydrationSnapshot = () => true
const getServerHydrationSnapshot = () => false

function useHydrated() {
  return useSyncExternalStore(
    subscribeHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  )
}

function ImageInspectorLoading({ detailed }: { detailed: boolean }) {
  return (
    <div className="mx-auto w-full max-w-page space-y-4 pt-2 sm:pt-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-7 w-60" />
      </div>
      <Skeleton className="h-14 w-full rounded-panel" />
      <div className="rounded-panel border border-panel-border bg-card p-5">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-3">
          {detailed ? (
            <>
              <div className="grid h-9 w-full grid-cols-4 gap-1 rounded-md bg-muted p-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 rounded-md bg-background/70" />
                ))}
              </div>
              <LayerListSkeleton />
            </>
          ) : (
            <>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full rounded-panel" />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
