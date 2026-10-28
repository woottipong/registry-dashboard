"use client"

import { useState, useRef, useEffect } from "react"
import { CheckIcon, ClipboardIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PullCommandProps {
  commands: { label: string; command: string }[]
  className?: string
}

export function PullCommand({ commands, className }: PullCommandProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  function copy(command: string, index: number) {
    void navigator.clipboard.writeText(command).then(() => {
      setCopiedIndex(index)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopiedIndex(null), 2000)
    })
  }

  return (
    <div className={cn("space-y-3", className)}>
      {commands.map(({ label, command }, index) => (
        <div key={label} className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <div className="flex items-center gap-3 rounded-2xl bg-secondary/50 px-4 py-2.5">
            <code className="flex-1 overflow-x-auto font-mono text-xs text-foreground selection:bg-primary/20">{command}</code>
            <Button
              variant="secondary"
              size="sm"
              className="h-7 shrink-0 rounded-full px-3 text-xs font-medium bg-card text-foreground shadow-2xs hover:bg-black/5 dark:hover:bg-white/10"
              onClick={() => copy(command, index)}
              aria-label="Copy to clipboard"
            >
              {copiedIndex === index ? (
                <>
                  <CheckIcon className="size-3 text-[#1D8838] dark:text-[#30D158]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <ClipboardIcon className="size-3" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
