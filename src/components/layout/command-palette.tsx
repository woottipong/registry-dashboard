"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  ClockIcon,
  DatabaseIcon,
  FolderGit2Icon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { useRegistries } from "@/hooks/use-registries"
import { useSearchRepositories } from "@/hooks/use-repositories"
import { useCommandPalette } from "@/hooks/use-command-palette"

export function CommandPalette() {
  const router = useRouter()
  const { open, setOpen, close, query, debouncedQuery, setQuery, history, submitSearch, clearHistory } =
    useCommandPalette()

  const registriesQuery = useRegistries()
  const [selectedRegistryId, setSelectedRegistryId] = useState("")
  const registries = registriesQuery.data ?? []
  const searchRegistry = registries.find((registry) => registry.id === selectedRegistryId)
    ?? registries.find((registry) => registry.isDefault)
    ?? registries[0]
  const canSearch = Boolean(searchRegistry?.capabilities?.canSearch)
  const reposQuery = useSearchRepositories(canSearch ? searchRegistry?.id ?? "" : "", open ? debouncedQuery : "")

  function navigate(href: string) {
    router.push(href)
    close()
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} showCloseButton={false}>
      <CommandInput
        placeholder={canSearch ? "Search repositories, registries, or actions…" : "Search registries or actions…"}
        value={query}
        onValueChange={setQuery}
      />

      {/* Registry Pill Scoper */}
      {searchRegistry && registries.length > 0 ? (
        <div className="border-b border-border/50 bg-secondary/15 px-3 py-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">Search Scope</span>
            {/* Hidden native select for accessibility and testing support */}
            <label htmlFor="command-search-registry" className="sr-only">Repository search</label>
            <select
              id="command-search-registry"
              aria-label="Repository search"
              value={searchRegistry.id}
              onChange={(event) => setSelectedRegistryId(event.target.value)}
              className="sr-only"
            >
              {registries.map((registry) => (
                <option key={registry.id} value={registry.id}>{registry.name}</option>
              ))}
            </select>
            <span className="text-[10px] text-muted-foreground/60">
              {canSearch ? "Catalog search enabled" : "Namespace browse only"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {registries.map((registry) => {
              const isSelected = registry.id === searchRegistry.id
              return (
                <button
                  key={registry.id}
                  type="button"
                  onClick={() => setSelectedRegistryId(registry.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-all select-none",
                    isSelected
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground border border-panel-border/50",
                  )}
                >
                  <span className={cn("size-1.5 rounded-full", isSelected ? "bg-white" : "bg-emerald-400")} />
                  <span>{registry.name}</span>
                </button>
              )
            })}
          </div>

          {!canSearch ? (
            <p className="text-[11px] text-amber-400/90 pt-0.5">
              This registry does not support repository search. Browse by namespace instead.
            </p>
          ) : null}
        </div>
      ) : null}

      <CommandList>
        <CommandEmpty>{canSearch && (query !== debouncedQuery || reposQuery.isFetching) ? "Searching…" : reposQuery.isError ? "Repository search failed. Try again." : "No results found."}</CommandEmpty>

        {/* Recent searches */}
        {history.length > 0 && !query ? (
          <>
            <CommandGroup heading="Recent">
              {history.map((item) => (
                <CommandItem key={item} onSelect={() => submitSearch(item)}>
                  <ClockIcon className="size-4 text-muted-foreground" />
                  {item}
                </CommandItem>
              ))}
              <CommandItem
                onSelect={clearHistory}
                className="text-muted-foreground"
              >
                <Trash2Icon className="size-4" />
                Clear history
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
          </>
        ) : null}

        {/* Registries */}
        {registriesQuery.data?.length ? (
          <>
            <CommandGroup heading="Registries">
              {registriesQuery.data.map((registry) => (
                <CommandItem
                  key={registry.id}
                  onSelect={() => navigate(`/registries/${registry.id}/edit`)}
                >
                  <DatabaseIcon className="size-4 text-muted-foreground" />
                  {registry.name}
                  <span className="ml-auto text-xs text-muted-foreground">{registry.url}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        ) : null}

        {/* Repositories */}
        {canSearch && query === debouncedQuery && reposQuery.data?.items.length ? (
          <>
            <CommandGroup heading={`Repositories · ${searchRegistry?.name}`}>
              {reposQuery.data.items.slice(0, 8).map((repo) => (
                <CommandItem
                  key={repo.fullName}
                  value={repo.fullName}
                  onSelect={() => {
                    submitSearch(repo.fullName)
                    navigate(`/repos/${searchRegistry?.id}/${repo.fullName}`)
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderGit2Icon className="size-4 text-muted-foreground shrink-0" />
                    <span className="font-mono text-xs truncate">{repo.fullName}</span>
                  </div>
                  {repo.tagCount !== undefined ? (
                    <span className="rounded-full border border-panel-border bg-secondary/50 px-2 py-0.5 text-[10px] font-mono text-muted-foreground shrink-0">
                      {repo.tagCount} {repo.tagCount === 1 ? "tag" : "tags"}
                    </span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        ) : null}

        {/* Actions */}
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => navigate("/registries/new")}>
            <PlusIcon className="size-4 text-muted-foreground" />
            Add Registry
          </CommandItem>
          <CommandItem onSelect={() => navigate("/repos")}>
            <FolderGit2Icon className="size-4 text-muted-foreground" />
            Browse Repositories
          </CommandItem>
        </CommandGroup>
      </CommandList>

      {/* Hotkey Footer */}
      <div className="flex items-center justify-between border-t border-border/50 bg-secondary/20 px-3.5 py-2 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="rounded-control bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-foreground border border-border/60">↑↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded-control bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-foreground border border-border/60">↵</kbd>
            Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded-control bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-foreground border border-border/60">esc</kbd>
            Close
          </span>
        </div>
        {searchRegistry ? (
          <span className="text-[10px] text-muted-foreground/70 font-mono">
            {searchRegistry.name}
          </span>
        ) : null}
      </div>
    </CommandDialog>
  )
}
