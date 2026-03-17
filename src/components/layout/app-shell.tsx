"use client"

import { Suspense } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { ThemeBackdrop } from "@/components/layout/theme-toggle"
import { Topbar } from "@/components/layout/topbar"
import { useUiStore } from "@/stores/ui-store"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { Skeleton } from "@/components/ui/skeleton"

interface AppShellProps {
  children: React.ReactNode
}

function SidebarWrapper({ mobileOpen, onMobileOpenChange }: { mobileOpen?: boolean; onMobileOpenChange?: (open: boolean) => void }) {
  return (
    <Suspense fallback={
      <div className="h-full w-60 border-r border-border/70 bg-sidebar/80 p-4 backdrop-blur-xl">
        <Skeleton className="h-8 w-32" />
        <div className="mt-4 flex flex-col gap-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      </div>
    }>
      <Sidebar mobileOpen={mobileOpen} onMobileOpenChange={onMobileOpenChange} />
    </Suspense>
  )
}

export function AppShell({ children }: AppShellProps) {
  const sidebarOpen = useUiStore((state) => state.sidebarOpen)
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen)
  const pathname = usePathname()

  useKeyboardShortcuts()

  // Don't render the shell for login page
  if (pathname === "/login") {
    return (
      <main className="relative isolate min-h-screen bg-background text-foreground transition-colors duration-700">
        <ThemeBackdrop />
        <div className="relative z-10 min-h-screen">{children}</div>
      </main>
    )
  }

  return (
    <div className="relative isolate flex min-h-screen bg-background text-foreground transition-colors duration-700">
      <ThemeBackdrop />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.12),_transparent_32%)] dark:bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.12),_transparent_30%)]" />

      <SidebarWrapper mobileOpen={sidebarOpen} onMobileOpenChange={setSidebarOpen} />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col lg:ml-60">
        <Topbar onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:px-8 lg:py-7">{children}</main>
      </div>
    </div>
  )
}
