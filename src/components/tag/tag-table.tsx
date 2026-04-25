"use client"

import React, { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TagActions } from "@/components/tag/tag-actions"
import { formatBytes, formatDate, truncateDigest } from "@/lib/format"
import type { Tag } from "@/types/registry"

interface TagTableProps {
  registryId: string
  repoName: string
  tags: Tag[]
  canDelete: boolean
  isLoading?: boolean
  registryUrl?: string
  rowSelection: Record<string, boolean>
  onRowSelectionChange: (value: Record<string, boolean>) => void
  onDeleteClick: (tag: Tag) => void
}

export function TagTable({
  registryId,
  repoName,
  tags,
  canDelete,
  isLoading,
  registryUrl,
  rowSelection,
  onRowSelectionChange,
  onDeleteClick,
}: TagTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }])

  const columns = useMemo<ColumnDef<Tag>[]>(
    () => [
      ...(canDelete
        ? [
          {
            id: "select",
            header: ({ table }) => (
              <Checkbox
                checked={
                  table.getIsAllPageRowsSelected()
                    ? true
                    : table.getIsSomePageRowsSelected()
                      ? "indeterminate"
                      : false
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
              />
            ),
            cell: ({ row }) => (
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
              />
            ),
            enableSorting: false,
          } satisfies ColumnDef<Tag>,
        ]
        : []),
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tag
            <ArrowUpDownIcon data-icon="inline-end" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "digest",
        header: "Digest",
        meta: { className: "hidden lg:table-cell" },
        cell: ({ row }) =>
          row.original.digest ? (
            <span className="font-mono text-xs text-muted-foreground">
              {truncateDigest(row.original.digest)}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "size",
        meta: { className: "hidden md:table-cell" },
        header: ({ column }) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Size
            <ArrowUpDownIcon data-icon="inline-end" />
          </Button>
        ),
        cell: ({ row }) =>
          row.original.size > 0 ? (
            formatBytes(row.original.size)
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "createdAt",
        meta: { className: "hidden md:table-cell" },
        header: ({ column }) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Created
            <ArrowUpDownIcon data-icon="inline-end" />
          </Button>
        ),
        cell: ({ row }) =>
          row.original.createdAt ? (
            <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "platform",
        header: "Platform",
        meta: { className: "hidden lg:table-cell" },
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.os}/{row.original.architecture}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <TagActions
            registryId={registryId}
            repoName={repoName}
            tag={row.original}
            canDelete={canDelete}
            registryUrl={registryUrl}
            onDeleteClick={onDeleteClick}
          />
        ),
      },
    ],
    [registryId, repoName, canDelete, registryUrl, onDeleteClick],
  )

  // TanStack Table intentionally returns callable helpers that React Compiler cannot memoize.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: tags,
    columns,
    getRowId: (row) => row.name,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      const next = typeof updater === 'function' ? updater(rowSelection) : updater
      onRowSelectionChange(next)
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: canDelete,
  })
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-lg border border-border/70">
        <Table>
          <TableHeader className="bg-transparent">
            <TableRow className="border-b border-border/70 hover:bg-transparent">
              {canDelete ? (
                <TableHead className="w-12">
                  <Skeleton className="size-4 rounded-sm" />
                </TableHead>
              ) : null}
              <TableHead>
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                <Skeleton className="h-4 w-20" />
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <Skeleton className="h-4 w-14" />
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <Skeleton className="h-4 w-20" />
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                <Skeleton className="h-4 w-20" />
              </TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i} className="border-b border-border/60 hover:bg-transparent">
                {canDelete ? (
                  <TableCell>
                    <Skeleton className="size-4 rounded-sm" />
                  </TableCell>
                ) : null}
                <TableCell>
                  <Skeleton className="h-4 w-28 font-mono" />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Skeleton className="h-4 w-32 font-mono" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="ml-auto h-8 w-8 rounded-md" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-border/70">
        <Table>
          <TableHeader className="bg-transparent">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-border/70 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={(header.column.columnDef.meta as { className?: string })?.className}
                    aria-sort={
                      !header.column.getCanSort()
                        ? undefined
                        : header.column.getIsSorted() === "asc"
                          ? "ascending"
                          : header.column.getIsSorted() === "desc"
                            ? "descending"
                            : "none"
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            <AnimatePresence initial={false}>
              {table.getRowModel().rows.map((row) => (
                <motion.tr
                  key={row.original.name}
                  className="border-b border-border/60 transition-colors hover:bg-muted/35 data-[state=selected]:bg-primary/10"
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  exit={{ opacity: 0, x: -16, transition: { duration: 0.18, ease: "easeIn" } }}
                  layout
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={(cell.column.columnDef.meta as { className?: string })?.className}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
