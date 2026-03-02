"use client"

import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { ImageConfigHistory } from "@/types/manifest"

interface HistoryTimelineProps {
  history: ImageConfigHistory[]
}

type CommandType = "RUN" | "COPY" | "ADD" | "OTHER"

function getCommandType(createdBy: string): CommandType {
  const upper = createdBy.toUpperCase()
  if (upper.includes("/BIN/SH -C #(NOP) COPY") || upper.startsWith("COPY ")) return "COPY"
  if (upper.includes("/BIN/SH -C #(NOP) ADD") || upper.startsWith("ADD ")) return "ADD"
  if (upper.includes("/BIN/SH -C") || upper.startsWith("RUN ")) return "RUN"
  return "OTHER"
}

function formatCommand(createdBy: string): string {
  // Strip the shell wrapper `/bin/sh -c #(nop)` or `/bin/sh -c`
  return createdBy
    .replace(/^\/bin\/sh -c #\(nop\)\s*/i, "")
    .replace(/^\/bin\/sh -c\s*/i, "RUN ")
    .trim()
}

const commandStyles: Record<CommandType, string> = {
  RUN: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  COPY: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  ADD: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  OTHER: "bg-muted text-muted-foreground border-border",
}

interface HistoryEntryProps {
  entry: ImageConfigHistory
  index: number
  isLast: boolean
}

function HistoryEntry({ entry, index, isLast }: HistoryEntryProps) {
  const commandType = entry.created_by ? getCommandType(entry.created_by) : "OTHER"
  const command = entry.created_by ? formatCommand(entry.created_by) : "(no command)"

  return (
    <div className="relative flex gap-4">
      {/* Timeline line */}
      {!isLast ? (
        <div className="absolute top-8 left-[1.1875rem] h-full w-px bg-border" />
      ) : null}

      {/* Step indicator */}
      <div
        className={cn(
          "relative mt-1.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-mono font-medium",
          entry.empty_layer ? "bg-muted text-muted-foreground" : commandStyles[commandType],
        )}
      >
        {index + 1}
      </div>

      <div className="min-w-0 flex-1 pb-6">
        <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-md border bg-muted/40 px-3 py-2 font-mono text-xs leading-relaxed">
          {command}
        </pre>
        <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {entry.created ? <span>{formatDate(entry.created)}</span> : null}
          {entry.empty_layer ? (
            <span className="italic">empty layer</span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function HistoryTimeline({ history }: HistoryTimelineProps) {
  if (history.length === 0) {
    return <p className="text-sm text-muted-foreground">No history available.</p>
  }

  return (
    <div className="space-y-0">
      {history.map((entry, index) => (
        <HistoryEntry
          key={index}
          entry={entry}
          index={index}
          isLast={index === history.length - 1}
        />
      ))}
    </div>
  )
}
