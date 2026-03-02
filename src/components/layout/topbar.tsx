"use client"

import { MenuIcon, MoonIcon, SearchIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { useUiStore } from "@/stores/ui-store"
import { useCommandPalette } from "@/hooks/use-command-palette"

interface TopbarProps {
  onOpenSidebar: () => void
}

export function Topbar({ onOpenSidebar }: TopbarProps) {
  const { setTheme } = useTheme()
  const setThemePreference = useUiStore((state) => state.setTheme)
  const { setOpen: openPalette } = useCommandPalette()

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    setTheme(theme)
    setThemePreference(theme)
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-sm">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onOpenSidebar}
          aria-label="Open menu"
        >
          <MenuIcon className="size-5" />
        </Button>

        <div className="flex min-w-40 items-center gap-2">
          <div className="rounded-card bg-primary/15 p-1.5 text-primary">
            <MoonIcon className="size-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Registry UI</p>
            <p className="text-xs text-muted-foreground">Container image explorer</p>
          </div>
        </div>

        <Separator orientation="vertical" className="mx-1 hidden h-6 md:block" />

        <div className="min-w-0 flex-1">
          <Breadcrumbs />
        </div>

        <Button
          variant="outline"
          className="hidden gap-2 md:inline-flex"
          type="button"
          onClick={() => openPalette(true)}
        >
          <SearchIcon className="size-4" />
          Search
          <span className="rounded-sm border px-1.5 py-0.5 text-xs text-muted-foreground">
            ⌘K
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Toggle theme">
              <SunIcon className="size-4 scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
              <MoonIcon className="absolute size-4 scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleThemeChange("light")}>Light</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleThemeChange("dark")}>Dark</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleThemeChange("system")}>System</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
