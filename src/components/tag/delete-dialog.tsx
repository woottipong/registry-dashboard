"use client"

import { useState } from "react"
import { AlertTriangleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { truncateDigest } from "@/lib/format"
import type { Tag } from "@/types/registry"

interface DeleteDialogProps {
  tag: Tag | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (tag: Tag) => void
  isPending?: boolean
}

export function DeleteDialog({
  tag,
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: DeleteDialogProps) {
  const [confirmation, setConfirmation] = useState("")

  const isConfirmed = confirmation === tag?.name

  function handleConfirm() {
    if (!tag || !isConfirmed) return
    onConfirm(tag)
    setConfirmation("")
  }

  function handleOpenChange(value: boolean) {
    if (!value) setConfirmation("")
    onOpenChange(value)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangleIcon className="size-5 text-destructive" />
            Delete tag
          </DialogTitle>
          <DialogDescription>
            This action <strong>cannot be undone</strong>. The image manifest will be permanently
            deleted from the registry.
          </DialogDescription>
        </DialogHeader>

        {tag ? (
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm">
              <div className="font-mono font-medium">{tag.name}</div>
              {tag.digest ? (
                <div className="mt-1 font-mono text-xs text-muted-foreground">
                  {truncateDigest(tag.digest, 12)}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Type <span className="font-mono font-medium text-foreground">{tag.name}</span> to
                confirm
              </label>
              <Input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder={tag.name}
                className="font-mono"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && isConfirmed) handleConfirm()
                }}
              />
            </div>
          </div>
        ) : null}

        <DialogFooter showCloseButton>
          <Button
            variant="destructive"
            disabled={!isConfirmed || isPending}
            onClick={handleConfirm}
          >
            {isPending ? "Deleting…" : "Delete tag"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
