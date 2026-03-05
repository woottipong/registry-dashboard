"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDownIcon, TagsIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { Repository } from "@/types/registry"

interface RepoTableProps {
  registryId: string
  repositories: Repository[]
}

export function RepoTable({ registryId, repositories }: RepoTableProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const handleMouseEnter = (repo: Repository) => {
    // Prefetch tags data for instant navigation
    queryClient.prefetchQuery({
      queryKey: ["tags", registryId, repo.fullName],
      staleTime: 30 * 1000, // 30 seconds
      queryFn: async () => {
        const encodedRepoPath = repo.fullName
          .split("/")
          .map((segment) => encodeURIComponent(segment))
          .join("/")
        const response = await fetch(
          `/api/v1/registries/${registryId}/repositories/${encodedRepoPath}/tags`,
          { cache: "no-store" },
        )
        const payload = await response.json()
        if (!response.ok || !payload.success || payload.data === null) {
          throw new Error(payload.error?.message ?? "Unable to fetch tags")
        }
        return { items: payload.data, meta: payload.meta }
      },
    })
  }

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
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: "tagCount",
        header: "Tags",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            {row.original.tagCount ?? "-"} images
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/repos/${registryId}/${row.original.fullName}`)
              }}
            >
              <TagsIcon className="size-3.5" />
              Browse Tags
            </Button>
          </div>
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
    <div className="w-full relative">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const isName = header.id === "fullName"
                const isTags = header.id === "tagCount"

                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      isName ? "w-[60%] pl-6" : isTags ? "w-[20%]" : "w-[20%] text-right pr-6"
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className="cursor-pointer"
              onClick={() => router.push(`/repos/${registryId}/${row.original.fullName}`)}
              onMouseEnter={() => handleMouseEnter(row.original)}
            >
              {row.getVisibleCells().map((cell) => {
                const isName = cell.column.id === "fullName"
                const isTags = cell.column.id === "tagCount"

                return (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      isName ? "w-[60%] pl-6" : isTags ? "w-[20%]" : "w-[20%] text-right pr-6"
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
