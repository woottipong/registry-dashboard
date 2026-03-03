"use client"

import React, { useState } from "react"
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

interface BulkDeleteDialogProps {
  count: number
  uniqueDigestCount: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isPending?: boolean
}

export function BulkDeleteDialog({
  count,
  uniqueDigestCount,
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: BulkDeleteDialogProps) {
  const sharedCount = count - uniqueDigestCount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangleIcon className="size-5 text-destructive" />
            Delete {count} {count === 1 ? "tag" : "tags"}
          </DialogTitle>
          <DialogDescription>
            This action <strong>cannot be undone</strong>. The selected tags will be permanently
            deleted from the registry.
          </DialogDescription>
        </DialogHeader>

        {sharedCount > 0 && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
            <strong>{sharedCount} of the selected tags share a digest</strong> with other tags not in
            your selection. Deleting will remove those sibling tags too.
          </div>
        )}

        <DialogFooter showCloseButton>
          <Button variant="destructive" disabled={isPending} onClick={onConfirm}>
            {isPending ? "Deleting…" : `Delete ${count} ${count === 1 ? "tag" : "tags"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteDialogProps {
  tag: Tag | null
  sharedWith?: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (tag: Tag) => void
  isPending?: boolean
}

export function DeleteDialog({
  tag,
  sharedWith = [],
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

            {sharedWith.length > 0 && (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
                <strong>Shared digest warning</strong> — the following tags point to the same
                manifest and will also be deleted:{" "}
                {sharedWith.map((t) => (
                  <span key={t} className="font-mono font-medium">{t}</span>
                )).reduce<React.ReactNode[]>((acc, el, i) => [
                  ...acc,
                  i > 0 ? <span key={`sep-${i}`}>, </span> : null,
                  el,
                ], [])}
              </div>
            )}

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
