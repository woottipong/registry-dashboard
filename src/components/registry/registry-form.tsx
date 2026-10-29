"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import * as z from "zod"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  GlobeIcon,
  KeyRoundIcon,
  Loader2Icon,
  LockKeyholeIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
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
      onSuccess: (data) => {
        if (data.status === "ok") toast.success(`Connected (${data.latencyMs}ms)`)
        else toast.error("Unable to reach registry")
      },
      onError: (error) => toast.error(error.message ?? "Connection test failed"),
    })
  }

  const authOptions = [
    {
      value: "none",
      label: "Anonymous",
      note: "Public pull access",
      icon: GlobeIcon,
    },
    {
      value: "basic",
      label: "Basic Auth",
      note: "Username + password / PAT",
      icon: UserIcon,
    },
    {
      value: "bearer",
      label: "Bearer Token",
      note: "Token-based access",
      icon: ShieldCheckIcon,
    },
  ] as const

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 pb-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {mode === "create"
              ? "Add Registry"
              : "Edit Registry"}
          </h1>
          <p className="max-w-2xl text-xs sm:text-sm text-muted-foreground">
            {"Configure the endpoint, provider, and credentials used by the dashboard."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="rounded-control shadow-xs text-xs h-8 px-3.5 gap-1.5" asChild>
            <Link href="/registries">
              <ArrowLeftIcon className="size-3.5" />
              <span>{"All registries"}</span>
            </Link>
          </Button>
          {canPing ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-control shadow-xs text-xs h-8 px-3.5 gap-1.5"
              onClick={testConnection}
              disabled={pingRegistry.isPending}
            >
              {pingRegistry.isPending ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <ShieldCheckIcon className="size-3.5 text-primary" />
              )}
              <span>{pingRegistry.isPending ? "Testing saved connection…" : "Test saved connection"}</span>
            </Button>
          ) : null}
        </div>
      </div>

      {/* Main Unified Bento Card */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
          <div className="rounded-panel bg-card border border-panel-border shadow-panel overflow-hidden">
            <div className="p-6 sm:p-7 space-y-6">
              {/* Section 1: Connection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <GlobeIcon className="size-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold tracking-tight text-foreground">
                      {"Connection"}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {"Name and route registry traffic through the server-side proxy."}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 pt-1">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">{"Name"}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={"e.g. Production Cluster"}
                            className="h-9 rounded-control text-sm"
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
                        <FormLabel className="text-xs font-medium">{"Endpoint URL"}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={"https://registry.example.com"}
                            className="h-9 rounded-control text-sm"
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
                        <FormLabel className="text-xs font-medium">{"Provider Type"}</FormLabel>
                        <Select onValueChange={handleProviderChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9 w-full rounded-control text-sm">
                              <SelectValue placeholder="Select a provider" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="generic">Generic (Docker V2 API)</SelectItem>
                            <SelectItem value="dockerhub">Docker Hub</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="namespace"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">
                          {"Default Namespace"}{" "}
                          <span className="font-normal text-muted-foreground ml-1 text-xs">
                            ({"Optional"})
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={"e.g. library"}
                            className="h-9 rounded-control text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Subtle Divider */}
              <div className="border-t border-white/[0.06]" />

              {/* Section 2: Authentication */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <KeyRoundIcon className="size-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold tracking-tight text-foreground">
                      {"Authentication"}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {"Credentials stay server-side and are never exposed to the browser."}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-1">
                  <FormField
                    control={form.control}
                    name="authType"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid gap-3 sm:grid-cols-3"
                          >
                            {authOptions.map((option) => {
                              const isSelected = field.value === option.value
                              const Icon = option.icon
                              return (
                                <label
                                  key={option.value}
                                  htmlFor={`auth-${option.value}`}
                                  className={cn(
                                    "relative flex cursor-pointer flex-col justify-between rounded-control border p-3.5 transition-all select-none",
                                    isSelected
                                      ? "border-primary/50 shadow-xs ring-1 ring-primary/20 bg-primary/[0.08]"
                                      : "border-border/60 bg-muted/20 hover:border-primary/30 hover:bg-muted/40",
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                      <RadioGroupItem
                                        value={option.value}
                                        id={`auth-${option.value}`}
                                        className="size-4 shrink-0"
                                      />
                                      <span className="text-xs font-semibold text-foreground tracking-tight">
                                        {option.label}
                                      </span>
                                    </div>
                                    <Icon
                                      className={cn(
                                        "size-3.5 shrink-0 transition-colors",
                                        isSelected ? "text-primary" : "text-muted-foreground/60",
                                      )}
                                    />
                                  </div>
                                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{option.note}</p>
                                </label>
                              )
                            })}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {currentAuthType === "basic" ? (
                    <div className="grid gap-4 pt-1 sm:grid-cols-2 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 duration-150">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium">{"Username"}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={"Enter username"}
                                className="h-9 rounded-control text-sm"
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
                            <FormLabel className="text-xs font-medium">{"Password / PAT"}</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder={"••••••••"}
                                className="h-9 rounded-control text-sm"
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
                    <div className="pt-1 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 duration-150">
                      <FormField
                        control={form.control}
                        name="token"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium">{"Bearer Token"}</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder={"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
                                className="h-9 rounded-control font-mono text-xs"
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
            </div>

            {/* Integrated Action Dock */}
            <div className="border-t px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 border-white/[0.08] bg-white/[0.02]">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <LockKeyholeIcon className="size-3.5 text-primary shrink-0" />
                <span>{"AES-256-GCM encrypted and stored safely on server"}</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-control text-xs font-medium h-8 px-4"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  {"Cancel"}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-control shadow-xs text-xs font-medium h-8 px-4 gap-1.5"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : mode === "create" ? (
                    <PlusIcon className="size-3.5" />
                  ) : (
                    <ArrowRightIcon className="size-3.5" />
                  )}
                  <span>
                    {loading
                      ? "Saving…"
                      : mode === "create"
                        ? "Add Registry"
                        : "Save Changes"}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
