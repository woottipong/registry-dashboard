"use client"

import { useRouter } from "next/navigation"
import {
  ClockIcon,
  DatabaseIcon,
  FolderGit2Icon,
  PlusIcon,
  SettingsIcon,
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
import { useRepositories } from "@/hooks/use-repositories"
import { useCommandPalette } from "@/hooks/use-command-palette"

export function CommandPalette() {
  const router = useRouter()
  const { open, setOpen, close, query, setQuery, history, submitSearch, clearHistory } =
    useCommandPalette()

  const registriesQuery = useRegistries()
  const firstRegistry = registriesQuery.data?.[0]

  const reposQuery = useRepositories(firstRegistry?.id ?? "", {
    search: query || undefined,
    perPage: 8,
  })

  function navigate(href: string) {
    router.push(href)
    close()
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} showCloseButton={false}>
      <CommandInput
        placeholder="Search repositories, tags, or actions…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

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

        {/* Repositories (from first registry or search) */}
        {reposQuery.data?.items.length ? (
          <>
            <CommandGroup heading="Repositories">
              {reposQuery.data.items.map((repo) => (
                <CommandItem
                  key={repo.fullName}
                  onSelect={() => {
                    submitSearch(repo.fullName)
                    navigate(`/repos/${firstRegistry?.id}/${repo.fullName}`)
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
          <CommandItem onSelect={() => navigate("/settings")}>
            <SettingsIcon className="size-4 text-muted-foreground" />
            Settings
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
