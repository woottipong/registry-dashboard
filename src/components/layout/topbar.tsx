"use client"

import { MenuIcon, MoonIcon, SearchIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { useUiStore } from "@/stores/ui-store"
import { useCommandPalette } from "@/hooks/use-command-palette"

interface TopbarProps {
  onOpenSidebar: () => void
}

export function Topbar({ onOpenSidebar }: TopbarProps) {
  const { theme, setTheme } = useTheme()
  const setThemePreference = useUiStore((state) => state.setTheme)
  const { setOpen: openPalette } = useCommandPalette()

  const handleThemeToggle = () => {
    // Toggle strictly between light and dark to keep it minimal
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    setThemePreference(newTheme)
  }

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-background">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3 w-1/3">
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

        <div className="flex-1 flex justify-center max-w-sm w-full">
          <button
            onClick={() => openPalette(true)}
            className="flex h-9 w-full max-w-sm items-center gap-2 rounded-md border border-border bg-muted/30 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <SearchIcon className="size-3.5" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        </div>

        <div className="flex items-center justify-end w-1/3 gap-2">
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
