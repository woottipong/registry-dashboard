"use client"

import { useMemo } from "react"
import { formatBytes, truncateDigest } from "@/lib/format"
import type { ManifestBlobReference } from "@/types/manifest"

interface LayerListProps {
  layers: ManifestBlobReference[]
}

export function LayerList({ layers }: LayerListProps) {
  const totalSize = useMemo(() => layers.reduce((sum, layer) => sum + layer.size, 0), [layers])
  const maxSize = useMemo(() => Math.max(...layers.map((l) => l.size), 1), [layers])

  return (
    <div className="space-y-1">
      <div className="mb-3 grid grid-cols-[2rem_minmax(0,1fr)_auto] gap-3 px-3 sm:grid-cols-[2rem_minmax(0,1fr)_6rem_10rem] text-xs font-medium text-muted-foreground">
        <span>#</span>
        <span>Digest</span>
        <span className="text-right">Size</span>
        <span className="hidden sm:block">Media Type</span>
      </div>

      {layers.map((layer, index) => {
        const widthPct = totalSize > 0 ? (layer.size / maxSize) * 100 : 0

        return (
          <div
            key={`${layer.digest}-${index}`}
            className="relative overflow-hidden rounded-control bg-secondary/20 px-3 py-3"
          >
            <div
              className="absolute inset-y-0 left-0 bg-primary/8"
              style={{ width: `${widthPct}%` }}
            />
            <div className="relative grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 text-xs sm:grid-cols-[2rem_minmax(0,1fr)_6rem_10rem]">
              <span className="font-mono text-muted-foreground">{index + 1}</span>
              <span className="min-w-0 truncate font-mono text-muted-foreground" title={layer.digest}>
                {truncateDigest(layer.digest, 12)}
              </span>
              <span className="text-right tabular-nums">{formatBytes(layer.size)}</span>
              <span className="col-span-2 col-start-2 break-all text-muted-foreground sm:col-auto sm:truncate">{layer.mediaType}</span>
            </div>
          </div>
        )
      })}

      <div className="flex justify-end pt-4 text-sm font-medium">
        Total: {formatBytes(totalSize)}
      </div>
    </div>
  )
}
