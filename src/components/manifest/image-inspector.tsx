"use client"

import React, { Suspense, useCallback, useMemo } from "react"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CalendarIcon,
  ClipboardIcon,
  CodeIcon,
  CpuIcon,
  HardDriveIcon,
  HistoryIcon,
  LayersIcon,
  RefreshCwIcon,
  SettingsIcon,
  TagIcon,
  TerminalIcon
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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
import { formatBytes, formatDate, generatePullCommand, truncateDigest } from "@/lib/format"
import { useManifest } from "@/hooks/use-manifest"

interface ImageInspectorProps {
  registryId: string
  repoName: string
  tag: string
  registryName?: string
}

const defaultProps: Partial<ImageInspectorProps> = {
  registryName: undefined,
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

// Error boundary component
class ImageInspectorErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ImageInspector error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="p-6 rounded-full bg-destructive/10 mb-6">
            <AlertTriangleIcon className="size-12 text-destructive" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Something went wrong</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            An unexpected error occurred while loading the image inspector.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCwIcon className="mr-2 size-4" />
            Reload Page
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

function ImageInspector({ registryId, repoName, tag, registryName }: ImageInspectorProps) {
  const router = useRouter()
  const { data, isLoading, isError, error } = useManifest(registryId, repoName, tag)

  // Memoize expensive computations
  const pullCommand = useMemo(() =>
    generatePullCommand({ repository: repoName, tag }),
    [repoName, tag]
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
      <div className="space-y-8">
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
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="p-6 rounded-full bg-destructive/10 mb-6">
          <AlertTriangleIcon className="size-12 text-destructive" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Failed to Load Image</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          {error?.message ?? "Unable to fetch image manifest. Please try again."}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCwIcon className="mr-2 size-4" />
            Retry
          </Button>
          <Button variant="ghost" onClick={handleBack}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const { manifest, config } = data

  return (
    <section className="space-y-6">
      {/* Compact Hero Section */}
      <div className="relative rounded-xl bg-gradient-to-br from-primary/5 via-primary/3 to-primary/10 border border-primary/20 p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <TagIcon className="size-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">{repoName}</h1>
                <p className="text-sm text-muted-foreground">Image Inspection</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default" className="px-2 py-0.5 text-xs">
                <TagIcon className="mr-1 size-3" />
                {tag}
              </Badge>
              {registryName && (
                <Badge variant="outline" className="text-xs">{registryName}</Badge>
              )}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CodeIcon className="size-3" />
                <span className="font-mono">{truncatedDigest}</span>
              </div>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={handleBack} className="shrink-0">
            <ArrowLeftIcon className="mr-1 size-3" />
            Back
          </Button>
        </div>
      </div>

      {/* Compact Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

      {/* Compact Pull Command */}
      <div className="bg-muted/30 rounded-lg border p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <TerminalIcon className="size-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">Pull Command</span>
          </div>
          <Button size="sm" onClick={copyPullCommand} className="h-7 px-2">
            <ClipboardIcon className="size-3" />
          </Button>
        </div>
        <div className="bg-background rounded p-3 font-mono text-sm border overflow-x-auto">
          {pullCommand}
        </div>
      </div>

      {/* Compact Tabs */}
      <Tabs defaultValue="layers" className="mt-6">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-0.5 rounded-lg h-9">
          <TabsTrigger value="layers" className="rounded-md data-[state=active]:bg-background gap-1 text-xs h-7">
            <LayersIcon className="size-3.5" />
            <span className="hidden sm:inline">Layers</span>
            <span className="sm:hidden ml-1">{manifest.layers.length}</span>
          </TabsTrigger>
          <TabsTrigger value="config" className="rounded-md data-[state=active]:bg-background gap-1 text-xs h-7">
            <SettingsIcon className="size-3.5" />
            <span className="hidden sm:inline">Config</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-md data-[state=active]:bg-background gap-1 text-xs h-7">
            <HistoryIcon className="size-3.5" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
          <TabsTrigger value="raw" className="rounded-md data-[state=active]:bg-background gap-1 text-xs h-7">
            <CodeIcon className="size-3.5" />
            <span className="hidden sm:inline">Raw</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="layers" className="mt-3">
          <LayerList layers={manifest.layers} />
        </TabsContent>

        <TabsContent value="config" className="mt-3">
          {config ? (
            <ConfigInspector config={config} />
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <SettingsIcon className="size-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Config not available</p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-3">
          {config?.history?.length ? (
            <HistoryTimeline history={config.history} />
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <HistoryIcon className="size-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No history</p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="raw" className="mt-3">
          <ManifestViewer manifest={manifest} />
        </TabsContent>
      </Tabs>
    </section>
  )
}

// Main component wrapped with error boundary
const ImageInspectorWithBoundary = React.memo((props: ImageInspectorProps) => (
  <ErrorBoundary>
    <ImageInspector {...props} />
  </ErrorBoundary>
))

ImageInspectorWithBoundary.displayName = 'ImageInspectorWithBoundary'

export { ImageInspectorWithBoundary as ImageInspector }
