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
      <div className="space-y-1.5 px-3 py-2 text-xs text-muted-foreground">
        {searchRegistry ? (
          <div className="flex items-center gap-2">
            <label htmlFor="command-search-registry" className="shrink-0">Repository search</label>
            <select id="command-search-registry" value={searchRegistry.id} onChange={(event) => setSelectedRegistryId(event.target.value)} className="min-w-0 rounded-control border border-border bg-background px-2 py-1 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {registries.map((registry) => <option key={registry.id} value={registry.id}>{registry.name}</option>)}
            </select>
          </div>
        ) : null}
        <p>{registriesQuery.isLoading ? "Loading registries…" : registriesQuery.isError ? "Unable to load registries." : !searchRegistry ? "Add a registry to search repositories." : canSearch ? "Showing up to 8 repository results from the selected registry." : "This registry does not support repository search. Browse by namespace instead."}</p>
      </div>
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

        {/* Repository search is limited to a provider that supports it. */}
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
                >
                  <FolderGit2Icon className="size-4 text-muted-foreground" />
                  {repo.fullName}
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
    </CommandDialog>
  )
}
