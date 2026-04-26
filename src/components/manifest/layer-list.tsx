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
      <div className="mb-3 grid grid-cols-[2rem_1fr_6rem_10rem] gap-3 px-3 text-xs font-medium text-muted-foreground">
        <span>#</span>
        <span>Digest</span>
        <span className="text-right">Size</span>
        <span>Media Type</span>
      </div>

      {layers.map((layer, index) => {
        const widthPct = totalSize > 0 ? (layer.size / maxSize) * 100 : 0

        return (
          <div
            key={`${layer.digest}-${index}`}
            className="relative overflow-hidden rounded-md border border-border/70 bg-card px-3 py-2"
          >
            <div
              className="absolute inset-y-0 left-0 bg-primary/8"
              style={{ width: `${widthPct}%` }}
            />
            <div className="relative grid grid-cols-[2rem_1fr_6rem_10rem] items-center gap-3 text-xs">
              <span className="font-mono text-muted-foreground">{index + 1}</span>
              <span className="font-mono text-muted-foreground">
                {truncateDigest(layer.digest, 12)}
              </span>
              <span className="text-right tabular-nums">{formatBytes(layer.size)}</span>
              <span className="truncate text-muted-foreground">{layer.mediaType}</span>
            </div>
          </div>
        )
      })}

      <div className="flex justify-end border-t pt-2 text-sm font-medium">
        Total: {formatBytes(totalSize)}
      </div>
    </div>
  )
}
