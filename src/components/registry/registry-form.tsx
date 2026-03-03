"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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

  const form = useForm<FormState>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialValue?.name ?? "",
      url: initialValue?.url ?? "",
      provider: initialValue?.provider ?? "generic",
      authType: initialValue?.authType ?? "none",
      username: initialValue?.credentials?.username ?? "",
      password: initialValue?.credentials?.password ?? "",
      token: initialValue?.credentials?.token ?? "",
      namespace: initialValue?.namespace ?? "",
    },
  })

  const canPing = useMemo(() => Boolean(initialValue?.id), [initialValue?.id])
  const currentAuthType = form.watch("authType")

  const handleProviderChange = (value: string) => {
    form.setValue("provider", value as RegistryProviderType)
    
    if (value === "dockerhub") {
      form.setValue("url", "https://registry-1.docker.io")
      form.setValue("authType", "basic")
      if (!form.getValues("namespace")) {
        form.setValue("namespace", "library")
      }
    }
  }

  const onSubmit = async (data: FormState) => {
    setLoading(true)

    const payload = {
      name: data.name,
      url: data.url,
      provider: data.provider as RegistryProviderType,
      authType: data.authType as RegistryAuthType,
      credentials:
        data.authType === "none"
          ? undefined
          : {
              username: data.username || undefined,
              password: data.password || undefined,
              token: data.token || undefined,
            },
      namespace: data.namespace || undefined,
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
    <div className="space-y-6 rounded-card border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">
            {mode === "create" ? "Add Registry" : "Edit Registry"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure connection details for your container registry.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* General Information Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium leading-none text-foreground">General Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Production Cluster" className="w-full" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://registry.example.com" className="w-full" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <Select
                      onValueChange={handleProviderChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="generic">Generic (Docker V2 API)</SelectItem>
                        <SelectItem value="dockerhub">Docker Hub</SelectItem>
                        <SelectItem value="ghcr" disabled>GitHub Container Registry (Soon)</SelectItem>
                        <SelectItem value="ecr" disabled>Amazon ECR (Soon)</SelectItem>
                        <SelectItem value="gcr" disabled>Google Container Registry (Soon)</SelectItem>
                        <SelectItem value="acr" disabled>Azure Container Registry (Soon)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-[11px]">
                      Determines available features.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="namespace"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Namespace <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. library" className="w-full" {...field} />
                    </FormControl>
                    <FormDescription className="text-[11px]">
                      Used when pushing/pulling images without a namespace.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="h-px w-full bg-border" />

          {/* Authentication Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium leading-none text-foreground">Authentication</h2>
            <div className="rounded-card border bg-muted/20 p-5 space-y-5">
              <FormField
                control={form.control}
                name="authType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col sm:flex-row gap-4 sm:gap-6"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="none" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">None (Anonymous)</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="basic" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">Basic Auth</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="bearer" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">Bearer Token</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {currentAuthType === "basic" && (
                <div className="grid gap-4 sm:grid-cols-2 pt-2 animate-in fade-in zoom-in-95 duration-200">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter username" className="w-full bg-background" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password / PAT</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" className="w-full bg-background" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {currentAuthType === "bearer" && (
                <div className="pt-2 animate-in fade-in zoom-in-95 duration-200">
                  <FormField
                    control={form.control}
                    name="token"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bearer Token</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." className="w-full bg-background font-mono text-sm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border">
            <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto">
              {loading ? "Saving..." : mode === "create" ? "Add Registry" : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={testConnection} disabled={testing || !canPing} className="w-full sm:w-auto">
              {testing ? "Testing..." : "Test Connection"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
