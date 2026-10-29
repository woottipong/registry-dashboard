"use client"

import React, { useId, useState } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { truncateDigest } from "@/lib/format"
import type { Tag } from "@/types/registry"

interface BulkDeleteDialogProps {
  tags: Tag[]
  sideEffectTags: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isPending?: boolean
}

export function BulkDeleteDialog({
  tags,
  sideEffectTags,
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: BulkDeleteDialogProps) {
  const count = tags.length
  const acknowledgmentId = useId()
  const [acknowledgedSelection, setAcknowledgedSelection] = useState("")
  const selectionKey = JSON.stringify([tags.map((tag) => tag.name).sort(), [...sideEffectTags].sort()])
  const acknowledged = acknowledgedSelection === selectionKey

  function handleOpenChange(value: boolean) {
    if (!value) setAcknowledgedSelection("")
    onOpenChange(value)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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

        <div className="rounded-2xl border-0 bg-secondary/50 p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Tags to delete
          </p>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {tags.map((tag) => (
              <div key={tag.name} className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium">{tag.name}</span>
                {tag.digest ? (
                  <span className="font-mono text-xs text-muted-foreground">
                    {truncateDigest(tag.digest, 8)}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {sideEffectTags.length > 0 && (
          <div className="rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            <strong>Also deletes unselected tags</strong> — these tags share a digest with your
            selection and will be removed too:{" "}
            {sideEffectTags.map((name, i) => (
              <React.Fragment key={name}>
                {i > 0 && <span>, </span>}
                <span className="font-mono font-medium">{name}</span>
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="flex items-start gap-3">
          <Checkbox id={acknowledgmentId} checked={acknowledged} onCheckedChange={(checked) => setAcknowledgedSelection(checked === true ? selectionKey : "")} />
          <label htmlFor={acknowledgmentId} className="text-sm leading-6">
            I understand that the selected tags{sideEffectTags.length > 0 ? " and the unselected tags listed above" : ""} will be permanently deleted.
          </label>
        </div>

        <DialogFooter showCloseButton>
          <Button variant="destructive" disabled={isPending || !acknowledged || count === 0} onClick={() => { setAcknowledgedSelection(""); onConfirm() }}>
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
  const confirmationId = useId()

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
            <div className="rounded-2xl border-0 bg-secondary/50 p-4 text-sm">
              <div className="font-mono font-medium">{tag.name}</div>
              {tag.digest ? (
                <div className="mt-1 font-mono text-xs text-muted-foreground">
                  {truncateDigest(tag.digest, 12)}
                </div>
              ) : null}
            </div>

            {sharedWith.length > 0 && (
              <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
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
              <label htmlFor={confirmationId} className="text-sm text-muted-foreground">
                Type <span className="font-mono font-medium text-foreground">{tag.name}</span> to
                confirm
              </label>
              <Input
                id={confirmationId}
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder={tag.name}
                className="font-mono rounded-xl h-10"
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
