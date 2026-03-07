"use client"

import { useRouter } from "next/navigation"
import { CopyIcon, EyeIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { generatePullCommand, registryHostFromUrl } from "@/lib/format"
import type { Tag } from "@/types/registry"

interface TagActionsProps {
  registryId: string
  repoName: string
  tag: Tag
  canDelete: boolean
  registryUrl?: string
  onDeleteClick: (tag: Tag) => void
}

export function TagActions({
  registryId,
  repoName,
  tag,
  canDelete,
  registryUrl,
  onDeleteClick,
}: TagActionsProps) {
  const router = useRouter()

  function copyPullCommand() {
    const cmd = generatePullCommand({
      registry: registryUrl ? registryHostFromUrl(registryUrl) : undefined,
      repository: repoName,
      tag: tag.name,
    })
    void navigator.clipboard.writeText(cmd)
    toast.success("Pull command copied to clipboard")
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" onClick={copyPullCommand}>
              <CopyIcon className="size-3.5" />
              <span className="sr-only">Copy pull command</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy pull command</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() =>
                router.push(`/repos/${registryId}/${repoName}?tag=${encodeURIComponent(tag.name)}`)
              }
            >
              <EyeIcon className="size-3.5" />
              <span className="sr-only">Inspect image</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Inspect image</TooltipContent>
        </Tooltip>

        {canDelete ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-destructive hover:text-destructive"
                onClick={() => onDeleteClick(tag)}
              >
                <Trash2Icon className="size-3.5" />
                <span className="sr-only">Delete tag</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete tag</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
    </TooltipProvider>
  )
}
