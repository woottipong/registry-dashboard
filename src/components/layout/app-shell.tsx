"use client"

import { Suspense } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
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
      <div className="w-60 h-full bg-sidebar/50 border-r border-border p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-2">
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
    return <main className="min-h-screen bg-background text-foreground">{children}</main>
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <SidebarWrapper mobileOpen={sidebarOpen} onMobileOpenChange={setSidebarOpen} />

      <div className="flex min-w-0 flex-1 flex-col lg:ml-60">
        <Topbar onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
