"use client"

import { useRouter } from "next/navigation"
import { ClipboardIcon, EyeIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { generatePullCommand } from "@/lib/format"
import type { Tag } from "@/types/registry"

interface TagActionsProps {
  registryId: string
  repoName: string
  tag: Tag
  canDelete: boolean
  onDeleteClick: (tag: Tag) => void
}

export function TagActions({
  registryId,
  repoName,
  tag,
  canDelete,
  onDeleteClick,
}: TagActionsProps) {
  const router = useRouter()

  function copyDigest() {
    void navigator.clipboard.writeText(tag.digest)
    toast.success("Digest copied to clipboard")
  }

  function copyPullCommand() {
    const cmd = generatePullCommand({ repository: repoName, tag: tag.name })
    void navigator.clipboard.writeText(cmd)
    toast.success("Pull command copied to clipboard")
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" onClick={copyPullCommand}>
              <span className="sr-only">Copy pull command</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-3.5"
              >
                <path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1" />
                <polyline points="16 11 12 15 8 11" />
                <line x1="12" x2="12" y1="15" y2="3" />
              </svg>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy pull command</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" onClick={copyDigest}>
              <ClipboardIcon className="size-3.5" />
              <span className="sr-only">Copy digest</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy digest</TooltipContent>
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
