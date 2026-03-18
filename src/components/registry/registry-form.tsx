"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  LockKeyholeIcon,
  PlusIcon,
  ServerIcon,
  ShieldCheckIcon,
} from "lucide-react"
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
import { cn } from "@/lib/utils"
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

  const canPing = Boolean(initialValue?.id)
  const currentAuthType = useWatch({
    control: form.control,
    name: "authType",
  })

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
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_320px]">
        <div className="rounded-[26px] border border-border/70 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--card)_92%,white_8%)_0%,color-mix(in_srgb,var(--background)_92%,var(--card)_8%)_100%)] px-5 py-5 shadow-[0_20px_45px_rgba(15,23,42,0.05)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/70">
            {mode === "create" ? "Registry Setup" : "Registry Maintenance"}
          </p>
          <div className="mt-3 space-y-2">
            <h1 className="text-[2rem] font-semibold tracking-tight">
              {mode === "create" ? "Add Registry" : "Edit Registry"}
            </h1>
            <p className="max-w-2xl text-sm leading-5 text-muted-foreground">
              Configure connection details, authentication, and default namespace so this registry behaves consistently across the dashboard.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Button size="sm" asChild>
              <Link href="/registries">
                <ArrowLeftIcon data-icon="inline-start" />
                Back to Registries
              </Link>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={testConnection}
              disabled={pingRegistry.isPending || !canPing}
            >
              <ShieldCheckIcon data-icon="inline-start" />
              {pingRegistry.isPending ? "Testing…" : "Test Connection"}
            </Button>
          </div>
        </div>

        <div className="rounded-[26px] border border-border/70 bg-card/92 px-4 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">
            <ServerIcon className="size-3.5 text-primary" />
            Form Snapshot
          </div>
          <div className="mt-3 grid gap-2">
            <FormSummaryStat
              label="Mode"
              value={mode === "create" ? "New registry" : "Update registry"}
              mono={false}
            />
            <FormSummaryStat label="Provider" value={form.getValues("provider")} />
            <FormSummaryStat
              label="Authentication"
              value={currentAuthType === "none" ? "Anonymous" : currentAuthType === "basic" ? "Basic Auth" : "Bearer Token"}
              mono={false}
            />
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="rounded-[24px] border border-border/70 bg-card/95 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.04)]">
            <SectionIntro
              eyebrow="Connection Details"
              title="General Information"
              description="Name the registry, define the endpoint, and choose the provider behavior."
            />

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Production Cluster"
                        className="h-10 rounded-xl border-border/70 bg-background/78"
                        {...field}
                      />
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
                      <Input
                        placeholder="https://registry.example.com"
                        className="h-10 rounded-xl border-border/70 bg-background/78"
                        {...field}
                      />
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
                        <SelectTrigger className="h-10 w-full rounded-xl border-border/70 bg-background/78">
                          <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="generic">Generic (Docker V2 API)</SelectItem>
                        <SelectItem value="dockerhub">Docker Hub</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-[11px]">
                      Determines feature support and default behavior.
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
                    <FormLabel>
                      Default Namespace{" "}
                      <span className="font-normal text-muted-foreground">(Optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. library"
                        className="h-10 rounded-xl border-border/70 bg-background/78"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-[11px]">
                      Used when pushing or pulling without an explicit namespace.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="rounded-[24px] border border-border/70 bg-card/95 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.04)]">
            <SectionIntro
              eyebrow="Access Policy"
              title="Authentication"
              description="Choose how this registry should be accessed from the dashboard."
            />

            <div className="mt-5 space-y-5">
              <FormField
                control={form.control}
                name="authType"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid gap-3 md:grid-cols-3"
                      >
                        {([
                          { value: "none", label: "Anonymous", note: "Public pull access" },
                          { value: "basic", label: "Basic Auth", note: "Username + password" },
                          { value: "bearer", label: "Bearer Token", note: "Token-based access" },
                        ] as const).map((option) => (
                          <label
                            key={option.value}
                            htmlFor={`auth-${option.value}`}
                            className={cn(
                              "flex min-h-24 cursor-pointer flex-col justify-between rounded-[18px] border px-4 py-4 transition-colors",
                              field.value === option.value
                                ? "border-primary/40 bg-primary/6 text-foreground"
                                : "border-border/70 bg-background/72 text-muted-foreground hover:border-primary/25 hover:text-foreground",
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value={option.value} id={`auth-${option.value}`} className="shrink-0" />
                              <span className="font-medium">{option.label}</span>
                            </div>
                            <p className="mt-3 pl-7 text-sm text-muted-foreground">{option.note}</p>
                          </label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {currentAuthType === "basic" ? (
                <div className="grid gap-4 sm:grid-cols-2 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 duration-200">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter username"
                            className="h-10 rounded-xl border-border/70 bg-background/78"
                            {...field}
                          />
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
                          <Input
                            type="password"
                            placeholder="••••••••"
                            className="h-10 rounded-xl border-border/70 bg-background/78"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : null}

              {currentAuthType === "bearer" ? (
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
                            className="h-10 rounded-xl border-border/70 bg-background/78 font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-[24px] border border-border/70 bg-card/95 px-5 py-4 shadow-[0_16px_36px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LockKeyholeIcon className="size-4 text-primary" />
              <span>Credentials are stored server-side and never exposed to the browser.</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="ghost" onClick={() => router.back()} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {mode === "create" ? <PlusIcon data-icon="inline-start" /> : <ArrowRightIcon data-icon="inline-start" />}
                {loading ? "Saving…" : mode === "create" ? "Add Registry" : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/70">
        {eyebrow}
      </p>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function FormSummaryStat({
  label,
  value,
  mono = true,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="rounded-[18px] border border-border/70 bg-background/72 px-3.5 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className={`mt-2 text-base font-semibold tracking-tight text-foreground ${mono ? "font-mono" : ""}`}>
        {value}
      </p>
    </div>
  )
}
