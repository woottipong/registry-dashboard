"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronRightIcon,
  DatabaseIcon,
  FolderGit2Icon,
  PlusIcon,
  ServerIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface SidebarProps {
  mobileOpen?: boolean
  onMobileOpenChange?: (open: boolean) => void
}

const MOCK_REGISTRIES = [
  {
    id: "dockerhub",
    name: "Docker Hub",
    status: "connected",
    repos: ["library/nginx", "library/redis", "library/alpine"],
  },
  {
    id: "local",
    name: "Local Registry",
    status: "disconnected",
    repos: ["apps/frontend", "apps/backend"],
  },
] as const

function StatusDot({ connected }: { connected: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex size-2.5 rounded-full",
        connected ? "bg-emerald-500" : "bg-rose-500",
      )}
      aria-hidden
    />
  )
}

function SidebarBody() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <ServerIcon className="size-4 text-primary" />
        <p className="text-sm font-semibold">Registries</p>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {MOCK_REGISTRIES.map((registry) => {
          const registryPath = `/registries/${registry.id}`
          const isRegistryActive = pathname.startsWith(registryPath)

          return (
            <div key={registry.id} className="space-y-1">
              <Link
                href={registryPath}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                  isRegistryActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <DatabaseIcon className="size-4" />
                <span className="truncate">{registry.name}</span>
                <StatusDot connected={registry.status === "connected"} />
              </Link>

              <div className="ml-6 space-y-1 border-l pl-2">
                {registry.repos.map((repo) => {
                  const repoPath = `/repos/${registry.id}/${repo}`
                  const isRepoActive = pathname === repoPath || pathname.startsWith(`${repoPath}/`)

                  return (
                    <Link
                      key={`${registry.id}-${repo}`}
                      href={repoPath}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
                        isRepoActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      <FolderGit2Icon className="size-3.5" />
                      <span className="truncate">{repo}</span>
                      <ChevronRightIcon className="ml-auto size-3" />
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      <div className="border-t p-3">
        <Button asChild className="w-full justify-start gap-2">
          <Link href="/registries/new">
            <PlusIcon className="size-4" />
            Add Registry
          </Link>
        </Button>
      </div>
    </div>
  )
}

export function Sidebar({ mobileOpen = false, onMobileOpenChange }: SidebarProps) {
  return (
    <>
      <aside className="hidden h-screen w-72 border-r bg-card/40 lg:block">
        <SidebarBody />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-80 p-0 lg:hidden" showCloseButton>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBody />
        </SheetContent>
      </Sheet>
    </>
  )
}
