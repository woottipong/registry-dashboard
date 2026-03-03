"use client"

import { MenuIcon, MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { useUiStore } from "@/stores/ui-store"

interface TopbarProps {
  onOpenSidebar: () => void
}

export function Topbar({ onOpenSidebar }: TopbarProps) {
  const { theme, setTheme } = useTheme()
  const setThemePreference = useUiStore((state) => state.setTheme)

  const handleThemeToggle = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    setThemePreference(newTheme)
  }

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-background">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onOpenSidebar}
            aria-label="Open menu"
          >
            <MenuIcon className="size-4" />
          </Button>

          <div className="hidden lg:block">
            <Breadcrumbs />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleThemeToggle}
          >
            <SunIcon className="size-4 scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
            <MoonIcon className="absolute size-4 scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
          </Button>
        </div>
      </div>
    </header>
  )
}
