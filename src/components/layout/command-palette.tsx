"use client"

import { useRouter } from "next/navigation"
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
  const searchableRegistries = registriesQuery.data?.filter((registry) => registry.capabilities?.canSearch) ?? []
  const searchRegistry = searchableRegistries.find((registry) => registry.isDefault) ?? searchableRegistries[0]
  const reposQuery = useSearchRepositories(searchRegistry?.id ?? "", open ? debouncedQuery : "")

  function navigate(href: string) {
    router.push(href)
    close()
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} showCloseButton={false}>
      <CommandInput
        placeholder={searchRegistry ? "Search repositories, registries, or actions…" : "Search registries or actions…"}
        value={query}
        onValueChange={setQuery}
      />
      <p className="px-3 py-2 text-xs text-muted-foreground">
        {registriesQuery.isLoading
          ? "Loading registries…"
          : searchRegistry
            ? `Repository search: ${searchRegistry.name}`
            : "Repository search is unavailable. Browse repositories by namespace."}
      </p>
      <CommandList>
        <CommandEmpty>{searchRegistry && (query !== debouncedQuery || reposQuery.isFetching) ? "Searching…" : reposQuery.isError ? "Repository search failed. Try again." : "No results found."}</CommandEmpty>

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
        {query === debouncedQuery && reposQuery.data?.items.length ? (
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
