"use client"

import { ClipboardIcon, CpuIcon, HardDriveIcon, LayersIcon, TagIcon } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfigInspector } from "@/components/manifest/config-inspector"
import { HistoryTimeline } from "@/components/manifest/history-timeline"
import { LayerList } from "@/components/manifest/layer-list"
import { ManifestViewer } from "@/components/manifest/manifest-viewer"
import { formatBytes, formatDate, generatePullCommand, truncateDigest } from "@/lib/format"
import { useManifest } from "@/hooks/use-manifest"

interface ImageInspectorProps {
  registryId: string
  repoName: string
  tag: string
  registryName?: string
}

export function ImageInspector({ registryId, repoName, tag, registryName }: ImageInspectorProps) {
  const { data, isLoading, isError, error } = useManifest(registryId, repoName, tag)

  function copyPullCommand() {
    const cmd = generatePullCommand({ repository: repoName, tag })
    void navigator.clipboard.writeText(cmd)
    toast.success("Pull command copied")
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-72 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="rounded-card border border-destructive/30 bg-destructive/10 p-6 text-center">
        <p className="text-sm text-destructive">{error?.message ?? "Failed to load image"}</p>
      </div>
    )
  }

  const { manifest, config } = data
  const pullCommand = generatePullCommand({ repository: repoName, tag })

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{repoName}</h1>
          <Badge variant="outline">
            <TagIcon className="mr-1 size-3" />
            {tag}
          </Badge>
          {registryName ? <Badge variant="secondary">{registryName}</Badge> : null}
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {config ? (
            <>
              <span className="flex items-center gap-1.5">
                <CpuIcon className="size-3.5" />
                {config.os}/{config.architecture}
              </span>
              {config.created ? <span>Created {formatDate(config.created)}</span> : null}
            </>
          ) : null}
          <span className="flex items-center gap-1.5">
            <HardDriveIcon className="size-3.5" />
            {formatBytes(manifest.totalSize)}
          </span>
          <span className="flex items-center gap-1.5">
            <LayersIcon className="size-3.5" />
            {manifest.layers.length} layers
          </span>
        </div>

        <div className="flex items-center gap-2 rounded-card border bg-muted/40 px-4 py-2.5">
          <code className="flex-1 overflow-x-auto font-mono text-sm">{pullCommand}</code>
          <Button variant="ghost" size="sm" onClick={copyPullCommand}>
            <ClipboardIcon className="size-3.5" />
            Copy
          </Button>
        </div>

        <p className="font-mono text-xs text-muted-foreground">
          Digest: {truncateDigest(manifest.digest, 16)}
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="layers">Layers ({manifest.layers.length})</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="raw">Raw Manifest</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Architecture", value: config?.architecture ?? "—" },
              { label: "OS", value: config?.os ?? "—" },
              { label: "Created", value: config?.created ? formatDate(config.created) : "—" },
              { label: "Total Size", value: formatBytes(manifest.totalSize) },
              { label: "Layers", value: String(manifest.layers.length) },
              { label: "Schema Version", value: String(manifest.schemaVersion) },
              { label: "Media Type", value: manifest.mediaType },
              { label: "Digest", value: truncateDigest(manifest.digest, 16) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-card border bg-card px-4 py-3">
                <dt className="mb-1 text-xs text-muted-foreground">{label}</dt>
                <dd className="font-mono text-sm">{value}</dd>
              </div>
            ))}
          </dl>
        </TabsContent>

        <TabsContent value="layers" className="mt-4">
          <LayerList layers={manifest.layers} />
        </TabsContent>

        <TabsContent value="config" className="mt-4">
          {config ? (
            <ConfigInspector config={config} />
          ) : (
            <p className="text-sm text-muted-foreground">Config blob not available.</p>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {config?.history?.length ? (
            <HistoryTimeline history={config.history} />
          ) : (
            <p className="text-sm text-muted-foreground">No history available.</p>
          )}
        </TabsContent>

        <TabsContent value="raw" className="mt-4">
          <ManifestViewer manifest={manifest} />
        </TabsContent>
      </Tabs>
    </section>
  )
}
