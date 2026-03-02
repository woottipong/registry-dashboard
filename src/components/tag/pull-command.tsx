"use client"

import { useState } from "react"
import { CheckIcon, ClipboardIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PullCommandProps {
  commands: { label: string; command: string }[]
  className?: string
}

export function PullCommand({ commands, className }: PullCommandProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  function copy(command: string, index: number) {
    void navigator.clipboard.writeText(command).then(() => {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    })
  }

  return (
    <div className={cn("space-y-2", className)}>
      {commands.map(({ label, command }, index) => (
        <div key={label} className="space-y-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
            <code className="flex-1 overflow-x-auto font-mono text-sm">{command}</code>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              onClick={() => copy(command, index)}
              aria-label="Copy to clipboard"
            >
              {copiedIndex === index ? (
                <CheckIcon className="size-3.5 text-emerald-500" />
              ) : (
                <ClipboardIcon className="size-3.5" />
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
