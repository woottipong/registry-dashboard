"use client"

import { useState } from "react"
import { ChevronDownIcon, ChevronRightIcon, ClipboardIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ImageConfig } from "@/types/manifest"

interface SectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function Section({ title, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-lg border border-border/70 bg-card/70">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium hover:bg-muted/40"
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? (
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
        )}
        {title}
      </button>

      {open ? <div className="border-t px-4 py-3">{children}</div> : null}
    </div>
  )
}

interface CopyableValueProps {
  value: string
}

function CopyableValue({ value }: CopyableValueProps) {
  function copy() {
    void navigator.clipboard.writeText(value)
    toast.success("Copied to clipboard")
  }

  return (
    <div className="group flex items-center gap-1">
      <span className={cn("font-mono text-xs break-all")}>{value}</span>
      <Button
        variant="ghost"
        size="icon"
        className="size-5 shrink-0 opacity-0 group-hover:opacity-100"
        onClick={copy}
      >
        <ClipboardIcon className="size-3" />
        <span className="sr-only">Copy</span>
      </Button>
    </div>
  )
}

interface ConfigInspectorProps {
  config: ImageConfig
}

export function ConfigInspector({ config }: ConfigInspectorProps) {
  const runtime = config.config

  return (
    <div className="space-y-2">
      <Section title="Environment Variables">
        {runtime.Env?.length ? (
          <ul className="space-y-1">
            {runtime.Env.map((env) => (
              <li key={env}>
                <CopyableValue value={env} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">None</p>
        )}
      </Section>

      <Section title="Entrypoint / CMD">
        <div className="space-y-2">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Entrypoint</p>
            {runtime.Entrypoint?.length ? (
              <CopyableValue value={runtime.Entrypoint.join(" ")} />
            ) : (
              <span className="text-xs text-muted-foreground">None</span>
            )}
          </div>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">CMD</p>
            {runtime.Cmd?.length ? (
              <CopyableValue value={runtime.Cmd.join(" ")} />
            ) : (
              <span className="text-xs text-muted-foreground">None</span>
            )}
          </div>
        </div>
      </Section>

      <Section title="Labels" defaultOpen={false}>
        {runtime.Labels && Object.keys(runtime.Labels).length > 0 ? (
          <dl className="space-y-1">
            {Object.entries(runtime.Labels).map(([key, value]) => (
              <div key={key} className="grid grid-cols-[1fr_2fr] gap-2 text-xs">
                <dt className="font-mono text-muted-foreground">{key}</dt>
                <dd>
                  <CopyableValue value={value} />
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-xs text-muted-foreground">None</p>
        )}
      </Section>

      <Section title="Exposed Ports" defaultOpen={false}>
        {runtime.ExposedPorts && Object.keys(runtime.ExposedPorts).length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {Object.keys(runtime.ExposedPorts).map((port) => (
              <li key={port} className="font-mono text-xs">
                {port}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">None</p>
        )}
      </Section>

      <Section title="Volumes" defaultOpen={false}>
        {runtime.Volumes && Object.keys(runtime.Volumes).length > 0 ? (
          <ul className="space-y-1">
            {Object.keys(runtime.Volumes).map((vol) => (
              <li key={vol}>
                <CopyableValue value={vol} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">None</p>
        )}
      </Section>

      <Section title="Working Directory / User" defaultOpen={false}>
        <div className="space-y-2">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Working Dir</p>
            {runtime.WorkingDir ? (
              <CopyableValue value={runtime.WorkingDir} />
            ) : (
              <span className="text-xs text-muted-foreground">None</span>
            )}
          </div>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">User</p>
            {runtime.User ? (
              <CopyableValue value={runtime.User} />
            ) : (
              <span className="text-xs text-muted-foreground">None (root)</span>
            )}
          </div>
        </div>
      </Section>
    </div>
  )
}
