"use client"

import { Suspense } from "react"
import { MenuIcon, MoonIcon, SunIcon, LogOutIcon, UserIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { useUiStore } from "@/stores/ui-store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface TopbarProps {
  onOpenSidebar: () => void
}

export function Topbar({ onOpenSidebar }: TopbarProps) {
  const { theme, setTheme } = useTheme()
  const setThemePreference = useUiStore((state) => state.setTheme)
  const router = useRouter()

  const handleThemeToggle = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    setThemePreference(newTheme)
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", headers: { "X-Requested-With": "XMLHttpRequest" } })
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/60 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-primary/5"
            onClick={onOpenSidebar}
            aria-label="Open menu"
          >
            <MenuIcon className="size-5" />
          </Button>

          <div className="hidden lg:block">
            <Suspense fallback={null}>
              <Breadcrumbs />
            </Suspense>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-8 w-[1px] bg-border mx-2" />

          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            className="h-10 w-10 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-300 relative overflow-hidden group"
            onClick={handleThemeToggle}
          >
            <div className="relative h-5 w-5">
              <SunIcon className="absolute inset-0 size-5 scale-100 rotate-0 transition-all duration-500 group-hover:rotate-90 dark:scale-0 dark:-rotate-90" />
              <MoonIcon className="absolute inset-0 size-5 scale-0 rotate-90 transition-all duration-500 dark:scale-100 dark:rotate-0 group-hover:rotate-[360deg]" />
            </div>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="User menu"
                className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-accent p-[1px] hidden sm:flex"
              >
                <div className="h-full w-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                  <UserIcon className="size-4 text-primary" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Admin User</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    Logged in
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOutIcon className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
