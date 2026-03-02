"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ApiResponse } from "@/types/api"
import type { RegistryAuthType, RegistryConnection, RegistryProviderType } from "@/types/registry"

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("URL is invalid"),
  provider: z.enum(["generic", "dockerhub", "ghcr", "ecr", "gcr", "acr"]),
  authType: z.enum(["none", "basic", "bearer"]),
  username: z.string().optional(),
  password: z.string().optional(),
  token: z.string().optional(),
  namespace: z.string().optional(),
})

type FormState = z.infer<typeof schema>

interface RegistryFormProps {
  mode: "create" | "edit"
  initialValue?: RegistryConnection
}

export function RegistryForm({ mode, initialValue }: RegistryFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [state, setState] = useState<FormState>({
    name: initialValue?.name ?? "",
    url: initialValue?.url ?? "",
    provider: initialValue?.provider ?? "generic",
    authType: initialValue?.authType ?? "none",
    username: initialValue?.credentials?.username ?? "",
    password: initialValue?.credentials?.password ?? "",
    token: initialValue?.credentials?.token ?? "",
    namespace: initialValue?.namespace ?? "",
  })

  const canPing = useMemo(() => Boolean(initialValue?.id), [initialValue?.id])

  const onChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }))
  }

  const applyDockerHubPreset = () => {
    setState((prev) => ({
      ...prev,
      url: "https://registry-1.docker.io",
      provider: "dockerhub",
      authType: "basic",
      namespace: prev.namespace || "library",
    }))
  }

  const submit = async () => {
    const parsed = schema.safeParse(state)
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      setErrors({
        name: fieldErrors.name?.[0],
        url: fieldErrors.url?.[0],
      })
      return
    }

    setErrors({})
    setLoading(true)

    const payload = {
      name: parsed.data.name,
      url: parsed.data.url,
      provider: parsed.data.provider as RegistryProviderType,
      authType: parsed.data.authType as RegistryAuthType,
      credentials:
        parsed.data.authType === "none"
          ? undefined
          : {
              username: parsed.data.username || undefined,
              password: parsed.data.password || undefined,
              token: parsed.data.token || undefined,
            },
      namespace: parsed.data.namespace || undefined,
    }

    const endpoint = mode === "create" ? "/api/v1/registries" : `/api/v1/registries/${initialValue?.id}`
    const method = mode === "create" ? "POST" : "PUT"

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = (await response.json()) as ApiResponse<RegistryConnection>

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? "Request failed")
      }

      toast.success(mode === "create" ? "Registry created" : "Registry updated")
      router.push("/registries")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save registry")
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    if (!initialValue?.id) {
      toast.info("Save the registry first, then run connection test")
      return
    }

    setTesting(true)
    try {
      const response = await fetch(`/api/v1/registries/${initialValue.id}/ping`)
      const result = (await response.json()) as ApiResponse<{ status: "ok" | "error"; latencyMs: number }>

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error?.message ?? "Connection test failed")
      }

      toast.success(`Connected (${result.data.latencyMs}ms)`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Connection test failed")
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-4 rounded-card border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">
          {mode === "create" ? "Add Registry" : "Edit Registry"}
        </h1>
        <Button type="button" variant="outline" onClick={applyDockerHubPreset}>
          Docker Hub preset
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm">Name</label>
          <Input value={state.name} onChange={(event) => onChange("name", event.target.value)} />
          {errors.name ? <p className="text-xs text-rose-500">{errors.name}</p> : null}
        </div>
        <div className="space-y-1">
          <label className="text-sm">URL</label>
          <Input value={state.url} onChange={(event) => onChange("url", event.target.value)} />
          {errors.url ? <p className="text-xs text-rose-500">{errors.url}</p> : null}
        </div>
        <div className="space-y-1">
          <label className="text-sm">Provider</label>
          <select
            className="h-9 w-full rounded-input border bg-background px-3 text-sm"
            value={state.provider}
            onChange={(event) => onChange("provider", event.target.value as RegistryProviderType)}
          >
            <option value="generic">generic</option>
            <option value="dockerhub">dockerhub</option>
            <option value="ghcr">ghcr</option>
            <option value="ecr">ecr</option>
            <option value="gcr">gcr</option>
            <option value="acr">acr</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm">Auth type</label>
          <select
            className="h-9 w-full rounded-input border bg-background px-3 text-sm"
            value={state.authType}
            onChange={(event) => onChange("authType", event.target.value as RegistryAuthType)}
          >
            <option value="none">none</option>
            <option value="basic">basic</option>
            <option value="bearer">bearer</option>
          </select>
        </div>

        {state.authType !== "none" ? (
          <>
            <div className="space-y-1">
              <label className="text-sm">Username</label>
              <Input
                value={state.username}
                onChange={(event) => onChange("username", event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Password</label>
              <Input
                type="password"
                value={state.password}
                onChange={(event) => onChange("password", event.target.value)}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm">Bearer token (optional)</label>
              <Input value={state.token} onChange={(event) => onChange("token", event.target.value)} />
            </div>
          </>
        ) : null}

        <div className="space-y-1 md:col-span-2">
          <label className="text-sm">Namespace (optional)</label>
          <Input value={state.namespace} onChange={(event) => onChange("namespace", event.target.value)} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={submit} disabled={loading}>
          {loading ? "Saving..." : mode === "create" ? "Create registry" : "Save changes"}
        </Button>
        <Button type="button" variant="outline" onClick={testConnection} disabled={testing || !canPing}>
          {testing ? "Testing..." : "Test connection"}
        </Button>
      </div>
    </div>
  )
}
