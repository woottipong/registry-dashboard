"use client"

import { useEffect } from "react"
import { AlertCircleIcon, RefreshCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[GlobalError]", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-panel border border-panel-border bg-card p-8 text-center space-y-6 shadow-panel">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircleIcon className="size-7 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Something went wrong</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {error.message || "An unexpected error occurred while processing your request."}
          </p>
          {error.digest ? (
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              Error ID: {error.digest}
            </p>
          ) : null}
        </div>
        <div className="pt-2">
          <Button className="w-full rounded-control shadow-xs" onClick={reset}>
            <RefreshCwIcon className="mr-2 size-4" />
            Try again
          </Button>
        </div>
      </div>
    </div>
  )
}
