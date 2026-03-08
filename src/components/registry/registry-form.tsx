"use client"

import { useMemo } from "react"
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
import { useAddRegistry, usePingRegistry, useUpdateRegistry } from "@/hooks/use-registries"
import type { RegistryAuthType, RegistryConnection, RegistryProviderType } from "@/types/registry"

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("URL is invalid"),
  provider: z.enum(["generic", "dockerhub"]),
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
  const addRegistry = useAddRegistry()
  const updateRegistry = useUpdateRegistry()
  const pingRegistry = usePingRegistry(initialValue?.id ?? "")

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

  const loading = addRegistry.isPending || updateRegistry.isPending

  const onSubmit = (data: FormState) => {
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

    const onSuccess = () => {
      toast.success(mode === "create" ? "Registry added" : "Registry updated")
      router.push("/registries")
    }
    const onError = (error: Error) => {
      toast.error(error.message ?? "Unable to save registry")
    }

    if (mode === "create") {
      addRegistry.mutate(payload, { onSuccess, onError })
    } else if (initialValue?.id) {
      updateRegistry.mutate({ id: initialValue.id, payload }, { onSuccess, onError })
    }
  }

  const testConnection = () => {
    if (!canPing) {
      toast.info("Save the registry first, then run connection test")
      return
    }
    pingRegistry.mutate(undefined, {
      onSuccess: (data) => toast.success(`Connected (${data.latencyMs}ms)`),
      onError: (error) => toast.error(error.message ?? "Connection test failed"),
    })
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Header */}
      <div className="border-b bg-muted/30 px-6 py-5">
        <h1 className="text-lg font-semibold">
          {mode === "create" ? "Add Registry" : "Edit Registry"}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Configure connection details for your container registry.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* General Information Section */}
          <div className="space-y-5 px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">General Information</p>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Production Cluster" {...field} />
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
                      <Input placeholder="https://registry.example.com" {...field} />
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
                    <Select onValueChange={handleProviderChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="generic">Generic (Docker V2 API)</SelectItem>
                        <SelectItem value="dockerhub">Docker Hub</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-[11px]">Determines available features.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="namespace"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Default Namespace{" "}
                      <span className="font-normal text-muted-foreground">(Optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. library" {...field} />
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

          <div className="h-px bg-border" />

          {/* Authentication Section */}
          <div className="space-y-5 px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Authentication</p>

            <FormField
              control={form.control}
              name="authType"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-3 gap-3"
                    >
                      {(["none", "basic", "bearer"] as const).map((val) => (
                        <label
                          key={val}
                          htmlFor={`auth-${val}`}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${field.value === val
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                            }`}
                        >
                          <RadioGroupItem value={val} id={`auth-${val}`} className="shrink-0" />
                          <span className="font-medium">
                            {val === "none" ? "Anonymous" : val === "basic" ? "Basic Auth" : "Bearer Token"}
                          </span>
                        </label>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {currentAuthType === "basic" && (
              <div className="grid gap-4 sm:grid-cols-2 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 duration-200">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter username" {...field} />
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
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {currentAuthType === "bearer" && (
              <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 duration-200">
                <FormField
                  control={form.control}
                  name="token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bearer Token</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          className="font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between gap-3 border-t bg-muted/20 px-6 py-4">
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : mode === "create" ? "Add Registry" : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={testConnection}
              disabled={pingRegistry.isPending || !canPing}
            >
              {pingRegistry.isPending ? "Testing…" : "Test Connection"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
