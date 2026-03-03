"use client"

import { useRouter } from "next/navigation"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

interface RepoChartItem {
  name: string
  registryId: string
  tagCount: number
}

interface TopReposChartProps {
  data?: RepoChartItem[]
  isLoading?: boolean
}

export function TopReposChart({ data, isLoading }: TopReposChartProps) {
  const router = useRouter()

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />
  }

  if (!data?.length) return null

  const chartData = data.slice(0, 10).map((item) => ({
    name: item.name.length > 20 ? `…${item.name.slice(-18)}` : item.name,
    fullName: item.name,
    registryId: item.registryId,
    tags: item.tagCount,
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            fontSize: 12,
          }}
          formatter={(value) => [value, "Tags"]}
          labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName ?? label}
        />
        <Bar
          dataKey="tags"
          radius={[4, 4, 0, 0]}
          className="fill-primary cursor-pointer"
          onClick={(entry: unknown) => {
            const e = entry as { registryId?: string; fullName?: string }
            if (e?.registryId && e?.fullName) {
              router.push(`/repos/${e.registryId}/${e.fullName}`)
            }
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
