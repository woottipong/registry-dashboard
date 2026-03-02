"use client"

import { useMemo, useState } from "react"
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
  onDeleteClick: (tag: Tag) => void
}

export function TagTable({
  registryId,
  repoName,
  tags,
  canDelete,
  isLoading,
  onDeleteClick,
}: TagTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }])

  const columns = useMemo<ColumnDef<Tag>[]>(
    () => [
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
            <ArrowUpDownIcon className="size-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "digest",
        header: "Digest",
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
        header: ({ column }) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Size
            <ArrowUpDownIcon className="size-3.5" />
          </Button>
        ),
        cell: ({ row }) =>
          row.original.size > 0 ? formatBytes(row.original.size) : <span className="text-muted-foreground">—</span>,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Created
            <ArrowUpDownIcon className="size-3.5" />
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
            onDeleteClick={onDeleteClick}
          />
        ),
      },
    ],
    [registryId, repoName, canDelete, onDeleteClick],
  )

  const table = useReactTable({
    data: tags,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
