"use client"

import { cn } from "@/lib/utils"

type ConnectionState = "connected" | "checking" | "error"

interface ConnectionStatusProps {
  state: ConnectionState | null
  latencyMs?: number | null
}

const stateStyle: Record<ConnectionState, string> = {
  connected: "bg-emerald-500",
  checking: "bg-amber-400 animate-pulse",
  error: "bg-rose-500",
}

export function ConnectionStatus({ state, latencyMs }: ConnectionStatusProps) {
  if (!state) {
    return null
  }

  const statusLabel =
    state === "connected" ? "Live" : state === "error" ? "Needs attention" : "Testing"

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/72 px-2.5 py-1 text-foreground/85">
        <span className={cn("inline-flex size-2 rounded-full", stateStyle[state])} aria-hidden />
        <span className="font-medium">{statusLabel}</span>
        {typeof latencyMs === "number" ? (
          <span className="text-muted-foreground">{latencyMs}ms</span>
        ) : null}
      </span>
    </div>
  )
}
