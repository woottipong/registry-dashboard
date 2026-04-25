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
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { EmptyState as AppEmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
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

// Extract MetricCard component
interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}

const MetricCard = React.memo(({ icon: Icon, label, value }: MetricCardProps) => (
  <div className="rounded-lg border border-border/70 bg-card/80 px-3.5 py-3">
    <div className="mb-1 flex items-center gap-1.5">
      <Icon className="size-3.5 text-muted-foreground" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
    </div>
    <div className="text-sm font-semibold tracking-tight">{value}</div>
  </div>
))

MetricCard.displayName = 'MetricCard'

// Main component wrapped with error boundary
const ImageInspectorWithBoundary = React.memo((props: ImageInspectorProps) => (
  <ErrorBoundary>
    <ImageInspector {...props} />
  </ErrorBoundary>
))

ImageInspectorWithBoundary.displayName = 'ImageInspectorWithBoundary'

export { ImageInspectorWithBoundary as ImageInspector }

function ImageInspector({ registryId, repoName, tag, registryName, registryUrl }: ImageInspectorProps) {
  const router = useRouter()
  const isHydrated = useHydrated()
  const { data, isLoading, isError, error } = useManifest(registryId, repoName, tag)

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
    void navigator.clipboard.writeText(pullCommand)
    toast.success("Pull command copied to clipboard")
  }, [pullCommand])

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

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
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCwIcon data-icon="inline-start" />
              Retry
            </Button>
            <Button variant="ghost" onClick={handleBack}>Back</Button>
          </div>
        }
        className="rounded-lg bg-background/70"
      />
    )
  }

  const { manifest, config } = data

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="flex flex-col gap-4 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleBack} className="w-fit">
            <ChevronLeftIcon data-icon="inline-start" />
            Tags
          </Button>
          {registryName ? <Badge variant="outline">{registryName}</Badge> : null}
          <Badge>{tag}</Badge>
          <Badge variant="outline" className="font-mono">{truncatedDigest}</Badge>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{repoName}</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Inspect layers, configuration, history, and raw manifest data.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={copyPullCommand} className="w-fit">
            <ClipboardIcon data-icon="inline-start" />
            Copy Pull Command
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricCard
            icon={CpuIcon}
            label="PLATFORM"
            value={platform}
          />
          <MetricCard
            icon={HardDriveIcon}
            label="SIZE"
            value={formatBytes(manifest.totalSize)}
          />
          <MetricCard
            icon={LayersIcon}
            label="LAYERS"
            value={manifest.layers.length.toString()}
          />
          <MetricCard
            icon={CalendarIcon}
            label="CREATED"
            value={config?.created ? formatDate(config.created) : '—'}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border/70 bg-card/80">
        <div className="px-5 pt-5">
          <h2 className="text-base font-semibold tracking-tight">Manifest Workspace</h2>
          <p className="mt-1 text-sm text-muted-foreground">Review layers, configuration, history, and raw manifest data.</p>
        </div>
        <div className="px-5 pb-5 pt-5">
          <Tabs defaultValue="layers">
            <TabsList className="grid w-full grid-cols-4">
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
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="rounded-lg border border-border/70 bg-card/80">
        <div className="gap-3 p-4 pb-0">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-28 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
        <div className="p-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <div className="mt-4 space-y-3">
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
                <Skeleton className="h-64 w-full rounded-xl" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
