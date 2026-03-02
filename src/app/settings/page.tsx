"use client"

import { useTheme } from "next-themes"
import { MonitorIcon, MoonIcon, SunIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useUiStore } from "@/stores/ui-store"
import { useQueryClient } from "@tanstack/react-query"

const THEMES = [
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "light", label: "Light", icon: SunIcon },
  { value: "system", label: "System", icon: MonitorIcon },
] as const

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const repoViewMode = useUiStore((s) => s.repoViewMode)
  const setRepoViewMode = useUiStore((s) => s.setRepoViewMode)
  const queryClient = useQueryClient()

  function clearCache() {
    queryClient.clear()
    toast.success("Cache cleared")
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage appearance and application preferences.</p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how the dashboard looks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium">Theme</p>
            <div className="flex gap-2">
              {THEMES.map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={theme === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme(value)}
                  className="gap-2"
                >
                  <Icon className="size-4" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">Repository view</p>
            <div className="flex gap-2">
              {(["grid", "table"] as const).map((mode) => (
                <Button
                  key={mode}
                  variant={repoViewMode === mode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRepoViewMode(mode)}
                  className="capitalize"
                >
                  {mode}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
          <CardDescription>Manage cached registry data.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Query cache</p>
              <p className="text-xs text-muted-foreground">
                Registry data is cached for 5 minutes. Clear to force a refresh.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={clearCache}>
              <Trash2Icon className="mr-2 size-3.5" />
              Clear cache
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <span className="font-mono">0.1.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Framework</span>
            <span>Next.js 15 (App Router)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">License</span>
            <span>MIT</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
