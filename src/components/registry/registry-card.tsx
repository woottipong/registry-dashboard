"use client"

import Link from "next/link"
import { useState } from "react"
import { CheckIcon, PencilIcon, RefreshCwIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ConnectionStatus } from "@/components/registry/connection-status"
import { usePingRegistry } from "@/hooks/use-registries"
import type { RegistryConnection } from "@/types/registry"

interface RegistryCardProps {
  registry: RegistryConnection
  onDelete: (id: string) => void
  onSetDefault: (id: string) => void
}

export function RegistryCard({ registry, onDelete, onSetDefault }: RegistryCardProps) {
  const [checkedAt, setCheckedAt] = useState<string | null>(null)
  const ping = usePingRegistry(registry.id)

  const status = ping.data?.status === "ok" ? "connected" : ping.isError ? "error" : "checking"
  const latencyMs = ping.data?.latencyMs ?? null

  const runPing = () => {
    ping.mutate(undefined, {
      onSuccess: () => setCheckedAt(new Date().toISOString()),
      onError: (error) => {
        setCheckedAt(new Date().toISOString())
        toast.error(error.message)
      },
    })
  }

  const rateLimitPercent =
    registry.rateLimit?.limit && registry.rateLimit.remaining !== null
      ? Math.max(0, Math.min(100, (registry.rateLimit.remaining / registry.rateLimit.limit) * 100))
      : null

  return (
    <Card className="gap-4">
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{registry.name}</CardTitle>
            <CardDescription className="mt-1 text-xs">{registry.url}</CardDescription>
          </div>
          {registry.isDefault ? <Badge>Default</Badge> : null}
        </div>

        <ConnectionStatus state={status} latencyMs={latencyMs} checkedAt={checkedAt} />
      </CardHeader>

      <CardContent className="flex flex-col gap-3 text-xs">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{registry.provider}</Badge>
          {registry.capabilities?.canDelete ? <Badge variant="outline">Can Delete</Badge> : null}
          {registry.capabilities?.canSearch ? <Badge variant="outline">Search</Badge> : null}
          {registry.capabilities?.hasRateLimit ? <Badge variant="outline">Rate Limited</Badge> : null}
        </div>

        {typeof rateLimitPercent === "number" ? (
          <div className="flex flex-col gap-1">
            <p className="text-muted-foreground">Rate limit usage</p>
            <div className="h-2 rounded-full bg-secondary">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${rateLimitPercent}%` }} />
            </div>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={runPing}>
          <RefreshCwIcon data-icon="inline-start" />
          Test
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/registries/${registry.id}/edit`}>
            <PencilIcon data-icon="inline-start" />
            Edit
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={() => onSetDefault(registry.id)}>
          <CheckIcon data-icon="inline-start" />
          Default
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(registry.id)}>
          <Trash2Icon data-icon="inline-start" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  )
}
