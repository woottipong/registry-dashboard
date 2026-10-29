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

      {/* Scope Bar */}
      {searchRegistry && registries.length > 0 ? (
        <div className="border-b border-border/40 bg-secondary/15 px-4 py-2">
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

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground/60 mr-1 select-none">
                {registries.length > 1 ? "Scope" : "Registry"}
              </span>
              {registries.map((registry) => {
                const isSelected = registry.id === searchRegistry.id
                return (
                  <button
                    key={registry.id}
                    type="button"
                    onClick={() => setSelectedRegistryId(registry.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-control px-2.5 py-1 text-xs font-mono transition-all select-none cursor-pointer",
                      isSelected
                        ? "bg-secondary/90 text-foreground border border-border/80 font-medium shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent",
                    )}
                  >
                    <span className={cn("size-1.5 rounded-full shrink-0", isSelected ? "bg-emerald-400" : "bg-muted-foreground/40")} />
                    <span className="truncate max-w-[160px]">{registry.name}</span>
                  </button>
                )
              })}
            </div>

            <span className="text-[10px] font-mono text-muted-foreground/50 shrink-0 hidden sm:inline">
              {canSearch ? "Catalog search enabled" : "Namespace browse only"}
            </span>
          </div>

          {!canSearch ? (
            <p className="text-[11px] text-amber-400/90 pt-1.5">
              This registry does not support repository search. Browse by namespace instead.
            </p>
          ) : null}
        </div>
      ) : null}

      <CommandList>
        <CommandEmpty>
          {canSearch && (query !== debouncedQuery || reposQuery.isFetching) ? (
            <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground font-mono">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              <span>Searching catalog…</span>
            </div>
          ) : reposQuery.isError ? (
            <div className="py-6 text-center text-xs text-destructive">
              Repository search failed. Try again.
            </div>
          ) : (
            <div className="py-8 text-center space-y-1">
              <p className="text-xs font-medium text-foreground">No results found</p>
              <p className="text-[11px] text-muted-foreground">
                No matching repositories, registries, or actions
              </p>
            </div>
          )}
        </CommandEmpty>

        {/* Recent searches */}
        {history.length > 0 && !query ? (
          <>
            <CommandGroup heading="Recent">
              {history.map((item) => (
                <CommandItem key={item} onSelect={() => submitSearch(item)} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex size-6 items-center justify-center rounded-control bg-secondary/50 text-muted-foreground border border-panel-border/40 shrink-0">
                      <ClockIcon className="size-3" />
                    </div>
                    <span className="text-xs truncate font-mono">{item}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground/40 font-mono hidden group-data-[selected=true]:inline">
                    Search ↵
                  </span>
                </CommandItem>
              ))}
              <CommandItem
                onSelect={clearHistory}
                className="text-muted-foreground hover:text-destructive text-xs"
              >
                <div className="flex size-6 items-center justify-center rounded-control bg-secondary/50 text-muted-foreground border border-panel-border/40 shrink-0">
                  <Trash2Icon className="size-3" />
                </div>
                <span>Clear search history</span>
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
                  value={`${registry.name} ${registry.url}`}
                  onSelect={() => navigate(`/registries/${registry.id}/edit`)}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex size-6 items-center justify-center rounded-control bg-secondary/50 text-primary border border-panel-border/40 shrink-0">
                      <DatabaseIcon className="size-3" />
                    </div>
                    <span className="text-xs font-medium text-foreground">{registry.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[11px] text-muted-foreground/70">{registry.url}</span>
                    <span className="text-[10px] text-muted-foreground/40 font-mono hidden group-data-[selected=true]:inline">
                      Configure ↵
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        ) : null}

        {/* Repositories */}
        {canSearch && reposQuery.data?.items.length ? (
          <>
            <CommandGroup heading={`Repositories · ${searchRegistry?.name}`}>
              {reposQuery.data.items.slice(0, 10).map((repo) => (
                <CommandItem
                  key={repo.fullName}
                  value={repo.fullName}
                  onSelect={() => {
                    submitSearch(repo.fullName)
                    navigate(`/repos/${searchRegistry?.id}/${repo.fullName}`)
                  }}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex size-6 items-center justify-center rounded-control bg-secondary/50 text-muted-foreground border border-panel-border/40 shrink-0">
                      <FolderGit2Icon className="size-3 text-muted-foreground" />
                    </div>
                    <span className="font-mono text-xs truncate text-foreground">{repo.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {repo.tagCount !== undefined ? (
                      <span className="rounded-control border border-panel-border/60 bg-secondary/40 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                        {repo.tagCount} {repo.tagCount === 1 ? "tag" : "tags"}
                      </span>
                    ) : null}
                    <span className="text-[10px] text-muted-foreground/40 font-mono hidden group-data-[selected=true]:inline">
                      Open ↵
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        ) : null}

        {/* Actions */}
        <CommandGroup heading="Actions">
          <CommandItem
            value="add registry create new endpoint"
            onSelect={() => navigate("/registries/new")}
            className="flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex size-6 items-center justify-center rounded-control bg-secondary/50 text-muted-foreground border border-panel-border/40 shrink-0">
                <PlusIcon className="size-3 text-muted-foreground" />
              </div>
              <span className="text-xs font-medium text-foreground">Add Registry</span>
            </div>
            <span className="text-[10px] text-muted-foreground/40 font-mono hidden group-data-[selected=true]:inline">
              Create ↵
            </span>
          </CommandItem>
          <CommandItem
            value="browse repositories explorer list images"
            onSelect={() => navigate("/repos")}
            className="flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex size-6 items-center justify-center rounded-control bg-secondary/50 text-muted-foreground border border-panel-border/40 shrink-0">
                <FolderGit2Icon className="size-3 text-muted-foreground" />
              </div>
              <span className="text-xs font-medium text-foreground">Browse Repositories</span>
            </div>
            <span className="text-[10px] text-muted-foreground/40 font-mono hidden group-data-[selected=true]:inline">
              Explore ↵
            </span>
          </CommandItem>
        </CommandGroup>
      </CommandList>

      {/* Hotkey Footer */}
      <div className="flex items-center justify-between border-t border-border/40 bg-secondary/15 px-4 py-2.5 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <kbd className="rounded-control bg-secondary/80 border border-border/70 px-1.5 py-0.5 font-mono text-[10px] text-foreground">↑↓</kbd>
            <span>Navigate</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded-control bg-secondary/80 border border-border/70 px-1.5 py-0.5 font-mono text-[10px] text-foreground">↵</kbd>
            <span>Select</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded-control bg-secondary/80 border border-border/70 px-1.5 py-0.5 font-mono text-[10px] text-foreground">esc</kbd>
            <span>Close</span>
          </span>
        </div>
        {searchRegistry ? (
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground/70">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            <span>{searchRegistry.name}</span>
          </div>
        ) : null}
      </div>
    </CommandDialog>
  )
}
