"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangleIcon, ArrowLeftIcon, RefreshCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ReposErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ReposError({ error, reset }: ReposErrorProps) {
  useEffect(() => {
    console.error("[ReposError]", error)
  }, [error])

  const isAuthError = error.message.includes("401") || error.message.toLowerCase().includes("auth")
  const isNotFound = error.message.includes("404")
  const isRateLimited = error.message.includes("429") || error.message.toLowerCase().includes("rate limit")

  function getContextualMessage() {
    if (isAuthError) return "Authentication failed. Check your registry credentials."
    if (isNotFound) return "Repository not found. It may have been deleted or moved."
    if (isRateLimited) return "Rate limit exceeded. Wait a moment before trying again."
    return error.message || "Failed to load repository data."
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-10">
        <AlertTriangleIcon className="mx-auto size-10 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold">Failed to load repository</h2>
        <p className="mt-2 text-sm text-muted-foreground">{getContextualMessage()}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/repos">
              <ArrowLeftIcon className="mr-2 size-4" />
              Back to repos
            </Link>
          </Button>
          <Button onClick={reset}>
            <RefreshCwIcon className="mr-2 size-4" />
            Try again
          </Button>
        </div>
      </div>
    </div>
  )
}
