"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate } from "@/lib/format"
import type { Repository } from "@/types/registry"

interface RepoTableProps {
  registryId: string
  repositories: Repository[]
}

export function RepoTable({ registryId, repositories }: RepoTableProps) {
  const router = useRouter()

  const columns = useMemo<ColumnDef<Repository>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: ({ column }) => (
          <Button
            type="button"
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDownIcon className="size-4" />
          </Button>
        ),
      },
      {
        accessorKey: "tagCount",
        header: "Tags",
        cell: ({ row }) => row.original.tagCount ?? "-",
      },
      {
        accessorKey: "lastUpdated",
        header: "Last Updated",
        cell: ({ row }) =>
          row.original.lastUpdated ? formatDate(row.original.lastUpdated) : "Unknown",
      },
      {
        accessorKey: "sizeBytes",
        header: "Size",
        cell: ({ row }) =>
          row.original.sizeBytes ? `${Math.round(row.original.sizeBytes / 1024)} KB` : "-",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/repos/${registryId}/${row.original.fullName}`)}
          >
            Open
          </Button>
        ),
      },
    ],
    [registryId, router],
  )

  const table = useReactTable({
    data: repositories,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

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
          <TableRow
            key={row.id}
            className="cursor-pointer"
            onClick={() => router.push(`/repos/${registryId}/${row.original.fullName}`)}
          >
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
