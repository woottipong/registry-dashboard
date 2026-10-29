"use client"

import Link from "next/link"
import {
  ArrowRightIcon,
  ClockIcon,
  DatabaseIcon,
  FolderIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { useActivity } from "@/contexts/activity-context"
import { useCommandPalette } from "@/hooks/use-command-palette"
import { useMounted } from "@/hooks/use-mounted"
import type { RegistryConnection } from "@/types/registry"

interface ModernDashboardClientProps {
  initialRegistries?: RegistryConnection[]
}

export function ModernDashboardClient({ initialRegistries }: ModernDashboardClientProps) {
  const { dashboardData, isLoadingRegistries, isLoadingRepos, registries, isRegistryError, failedRegistryIds, hasIncompleteData, hasUnknownTagCounts, retry } = useDashboardData({
    initialRegistries,
  })
  const { activities, isLoading: isLoadingActivity } = useActivity()
  const isMounted = useMounted()
  const { setOpen: setSearchOpen } = useCommandPalette()

  const { totalRepositories, totalTags, registriesWithStats, chartData } = dashboardData
  const providerCount = new Set(registriesWithStats.map((registry) => registry.provider)).size

  // Empty dashboard: Single stage CTA tile
  if (!isLoadingRegistries && !isRegistryError && registries.length === 0) {
    return (
      <section className="mx-auto flex max-w-5xl flex-col items-center justify-center py-10">
        <div className="w-full max-w-2xl rounded-panel bg-card p-8 sm:p-12 text-center shadow-panel">
          <DatabaseIcon className="mx-auto mb-6 size-10 text-muted-foreground" aria-hidden />

          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl text-foreground">
            {"Add registry"}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {"Container registries, repositories, and tag telemetry."}
          </p>

          <div className="mt-8 flex justify-center">
            <Button size="lg" className="rounded-control px-8 font-medium" asChild>
              <Link href="/registries/new">
                <PlusIcon data-icon="inline-start" className="mr-1 size-4" />
                {"Add registry"}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    )
  }

  const summary = [
    { label: "Registries", value: isRegistryError && registries.length === 0 ? null : registries.length, href: "/registries", loading: isLoadingRegistries },
    { label: "Repositories", value: isRegistryError || (registries.length > 0 && failedRegistryIds.length === registries.length) ? null : totalRepositories, href: "/repos", loading: isLoadingRegistries || isLoadingRepos },
    { label: "Tags", value: isRegistryError || failedRegistryIds.length > 0 || hasUnknownTagCounts ? null : totalTags, href: "/repos", loading: isLoadingRegistries || isLoadingRepos },
    { label: "Providers", value: isRegistryError && registries.length === 0 ? null : providerCount, href: "/registries", loading: isLoadingRegistries },
  ]

  return (
    <section className="mx-auto w-full max-w-page pb-10 pt-4 sm:pt-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Registry overview</h1><p className="mt-2 text-sm text-muted-foreground sm:text-base">Find a repository, then inspect its tags and images.</p></div>
        <Button className="h-11 px-4" asChild><Link href="/repos">Browse repositories<ArrowRightIcon className="size-4" /></Link></Button>
      </header>
      {(isRegistryError || failedRegistryIds.length > 0) && <div role="alert" className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-control bg-destructive/10 px-4 py-3 text-sm"><p>Some registry data could not be loaded. Counts may be incomplete.</p><Button size="sm" variant="outline" onClick={retry}>Try again</Button></div>}
      <dl className="mt-7 grid grid-cols-2 gap-x-8 gap-y-3 border-b border-border pb-5 text-sm text-muted-foreground sm:flex sm:flex-wrap">
        {summary.map(({label,value,href,loading}) => <div key={label} className="flex items-baseline gap-2"><dd><Link href={href} className="rounded-sm text-xl font-medium tabular-nums text-foreground hover:text-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{loading ? <Skeleton className="h-6 w-8" /> : value === null ? "—" : value.toLocaleString()}<span className="sr-only"> {label.toLowerCase()}</span></Link></dd><dt>{label.toLowerCase()}</dt></div>)}
      </dl>
      <section aria-label="Registry inventory" className="py-5">
        {isLoadingRegistries ? <Skeleton className="h-14 w-full" /> : registriesWithStats.map((registry) => <div key={registry.id} className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-2 sm:flex sm:gap-4"><DatabaseIcon className="size-5 shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1"><Link href={`/repos?registry=${registry.id}`} className="rounded-sm text-base font-semibold hover:text-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{registry.name}</Link><p className="mt-1 truncate text-xs text-muted-foreground">{registry.provider === "dockerhub" ? "Docker Hub" : "Registry V2"}{registry.isDefault ? " · Default registry" : ""}</p></div><div className="col-start-2 row-start-2 text-xs text-muted-foreground sm:ml-auto sm:text-right"><span>{isLoadingRepos || failedRegistryIds.includes(registry.id) ? "—" : registry.repoCount} repos</span><span className="ml-3">{isLoadingRepos || failedRegistryIds.includes(registry.id) || registry.tagCount === null ? "—" : registry.tagCount} tags</span></div><Button variant="outline" size="sm" className="col-start-3 row-span-2 row-start-1" asChild><Link href={`/registries/${registry.id}/edit`}>Manage</Link></Button></div>)}
      </section>
      <section aria-labelledby="overview-repositories" className="rounded-panel bg-card p-4 shadow-panel ring-1 ring-inset ring-panel-border sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="overview-repositories" className="text-xl font-medium tracking-tight">Top repositories</h2><Link href="/repos" className="rounded-sm text-sm text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">View all repositories →</Link></div>
        <div className="my-4 flex flex-col gap-3 sm:flex-row"><Button variant="outline" onClick={() => setSearchOpen(true)} className="h-11 flex-1 justify-start text-muted-foreground"><SearchIcon className="size-4" /><span className="truncate">Search repositories, registries, or actions…</span></Button><Button variant="outline" className="h-11" asChild><Link href="/repos">Browse namespaces</Link></Button></div>
        <div className="grid grid-cols-[minmax(0,1fr)_3rem_1.5rem] gap-3 border-y border-border/70 px-3 py-3 text-xs text-muted-foreground sm:grid-cols-[minmax(0,1fr)_12rem_4rem_1.5rem]"><span>Repository</span><span className="hidden sm:block">Registry</span><span className="text-right">Tags</span><span /></div>
        {isLoadingRegistries || isLoadingRepos ? Array.from({length:5}).map((_,index)=><Skeleton key={index} className="my-3 h-14 w-full" />) : chartData.length === 0 ? <p className="py-10 text-sm text-muted-foreground">No repository ranking data available yet.</p> : chartData.slice(0,5).map((repo)=>{
          const registry = registriesWithStats.find((item)=>item.id===repo.registryId)
          return <Link key={`${repo.registryId}-${repo.name}`} href={`/repos/${repo.registryId}/${repo.name}`} className="group grid min-h-16 grid-cols-[minmax(0,1fr)_3rem_1.5rem] items-center gap-3 border-b border-border/60 px-3 py-4 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:grid-cols-[minmax(0,1fr)_12rem_4rem_1.5rem]"><span className="flex min-w-0 items-center gap-3"><FolderIcon className="size-4 shrink-0 text-muted-foreground group-hover:text-link group-focus-visible:text-link" /><span className="truncate text-sm font-medium group-hover:text-link group-focus-visible:text-link sm:text-base">{repo.name}</span></span><span className="hidden truncate text-sm text-muted-foreground sm:block">{registry?.name ?? repo.registryId}</span><span className="text-right text-sm tabular-nums">{repo.tagCount}</span><ArrowRightIcon className="size-4 text-muted-foreground group-hover:text-link group-focus-visible:text-link" /></Link>
        })}
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Ranked by available tag counts in loaded repositories.{hasIncompleteData && " Some registry data is incomplete."}{hasUnknownTagCounts && " Some providers do not supply tag counts."}</p>
      </section>
      <section aria-labelledby="overview-activity" className="mt-9">
        <h2 id="overview-activity" className="flex items-center gap-2 text-base font-medium"><ClockIcon className="size-4 text-muted-foreground" />Recent activity</h2>
        <div className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">{!isMounted || isLoadingActivity ? Array.from({length:3}).map((_,index)=><Skeleton key={index} className="h-10 w-full" />) : activities.length===0 ? <p className="text-sm text-muted-foreground">No recent activity recorded yet.</p> : activities.slice(0,6).map((item)=><div key={item.id} className="min-w-0"><div className="flex justify-between gap-3 text-xs text-muted-foreground"><span className="capitalize">{item.type}</span><time dateTime={item.timestamp}>{new Date(item.timestamp).toLocaleTimeString("en",{hour:"2-digit",minute:"2-digit"})}</time></div><p className="mt-1 truncate text-sm">{item.repository}{item.tag && <span className="text-muted-foreground"> : {item.tag}</span>}</p></div>)}</div>
      </section>
    </section>
  )
}
