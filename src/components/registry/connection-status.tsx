"use client"

import { cn } from "@/lib/utils"

type ConnectionState = "connected" | "checking" | "error"

interface ConnectionStatusProps {
  state: ConnectionState
  latencyMs?: number | null
  checkedAt?: string | null
}

const stateStyle: Record<ConnectionState, string> = {
  connected: "bg-emerald-500",
  checking: "bg-amber-400 animate-pulse",
  error: "bg-rose-500",
}

export function ConnectionStatus({ state, latencyMs, checkedAt }: ConnectionStatusProps) {
  const timestamp = checkedAt ? new Date(checkedAt).toLocaleString() : "Not checked"

  return (
    <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
      <span className={cn("inline-flex size-2.5 rounded-full", stateStyle[state])} aria-hidden />
      <span>{state}</span>
      {typeof latencyMs === "number" ? <span>{latencyMs}ms</span> : null}
      <span>•</span>
      <span>{timestamp}</span>
    </div>
  )
}
