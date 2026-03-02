"use client"

import { useState } from "react"
import { ClipboardIcon } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { truncateDigest } from "@/lib/format"
import type { ImageManifest } from "@/types/manifest"

interface ManifestViewerProps {
  manifest: ImageManifest
}

export function ManifestViewer({ manifest }: ManifestViewerProps) {
  const [raw, setRaw] = useState(false)

  const formatted = JSON.stringify(manifest, null, 2)

  function copyManifest() {
    void navigator.clipboard.writeText(formatted)
    toast.success("Manifest copied to clipboard")
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline">{manifest.mediaType}</Badge>
          <span className="font-mono text-xs text-muted-foreground">
            {truncateDigest(manifest.digest, 8)}
          </span>
          <span className="text-xs text-muted-foreground">v{manifest.schemaVersion}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRaw((prev) => !prev)}
          >
            {raw ? "Formatted" : "Raw"}
          </Button>
          <Button variant="ghost" size="sm" onClick={copyManifest}>
            <ClipboardIcon className="size-3.5" />
            Copy
          </Button>
        </div>
      </div>

      <pre className="overflow-x-auto rounded-card border bg-muted/40 p-4 font-mono text-xs leading-relaxed">
        {raw ? JSON.stringify(manifest) : formatted}
      </pre>
    </div>
  )
}
