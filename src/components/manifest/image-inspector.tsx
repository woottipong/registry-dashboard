"use client"

import React, { useCallback, useMemo } from "react"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CalendarIcon,
  ClipboardIcon,
  CpuIcon,
  HardDriveIcon,
  HistoryIcon,
  LayersIcon,
  RefreshCwIcon,
  SettingsIcon,
  TerminalIcon
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { EmptyState as AppEmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import dynamic from "next/dynamic"
import { ManifestSkeleton } from "@/components/skeletons"

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
  { loading: () => <ManifestSkeleton /> },
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
  iconColor: string
}

const MetricCard = React.memo(({ icon: Icon, label, value, iconColor }: MetricCardProps) => (
  <div className="bg-card rounded-lg p-3 border">
    <div className="flex items-center gap-1.5 mb-1">
      <Icon className={`size-3.5 ${iconColor}`} />
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
    <div className="font-semibold text-xs">{value}</div>
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
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="animate-pulse">
          <div className="h-32 bg-muted/50 rounded-2xl mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted/50 rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-muted/50 rounded-xl"></div>
        </div>
      </div>
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
        className="rounded-2xl bg-background/70"
      />
    )
  }

  const { manifest, config } = data

  return (
    <section className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{tag}</Badge>
          {registryName ? <Badge variant="outline">{registryName}</Badge> : null}
          <Badge variant="outline" className="font-mono">{truncatedDigest}</Badge>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold tracking-tight">{repoName}</h1>
            <p className="text-sm text-muted-foreground">Image inspection.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleBack} className="w-fit">
            <ArrowLeftIcon data-icon="inline-start" />
            Back
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-border/70">
        <CardHeader className="gap-3 border-b pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>Image Summary</CardTitle>
              <CardDescription>Manifest details and pull command.</CardDescription>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <MetricCard
                icon={CpuIcon}
                label="PLATFORM"
                value={platform}
                iconColor="text-blue-500"
              />
              <MetricCard
                icon={HardDriveIcon}
                label="SIZE"
                value={formatBytes(manifest.totalSize)}
                iconColor="text-green-500"
              />
              <MetricCard
                icon={LayersIcon}
                label="LAYERS"
                value={manifest.layers.length.toString()}
                iconColor="text-purple-500"
              />
              <MetricCard
                icon={CalendarIcon}
                label="CREATED"
                value={config?.created ? formatDate(config.created) : '—'}
                iconColor="text-orange-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="rounded-lg border bg-background p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TerminalIcon className="size-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">Pull Command</span>
              </div>
              <Button size="sm" onClick={copyPullCommand} className="h-7 px-2">
                <ClipboardIcon className="size-3" />
              </Button>
            </div>
            <div className="overflow-x-auto rounded border bg-muted/30 p-3 font-mono text-sm">
              {pullCommand}
            </div>
          </div>

          <Tabs defaultValue="layers" className="mt-4">
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
                  className="rounded-2xl bg-background/70"
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
                  className="rounded-2xl bg-background/70"
                />
              )}
            </TabsContent>

            <TabsContent value="raw" className="mt-3">
              <ManifestViewer manifest={manifest} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  )
}
