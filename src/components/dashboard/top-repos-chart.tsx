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
    return <Skeleton className="h-64 w-full rounded-2xl bg-muted/50" />
  }

  if (!data?.length) return null

  const chartData = data.slice(0, 8).map((item) => ({
    name: item.name.split('/').pop() || item.name,
    fullName: item.name,
    registryId: item.registryId,
    tags: item.tagCount,
  }))

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barGap={8}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={1} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fontWeight: 600 }}
            className="fill-muted-foreground/50"
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            tick={{ fontSize: 10, fontWeight: 600 }}
            className="fill-muted-foreground/50"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: 'var(--primary)', opacity: 0.05, radius: 12 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-card/90 backdrop-blur-md border border-border/50 p-3 rounded-2xl shadow-2xl flex flex-col gap-1 min-w-[150px]">
                    <p className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest leading-none mb-1">Repository</p>
                    <p className="text-xs font-bold truncate max-w-[200px] mb-2">{item.name}</p>
                    <div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs">
                      <span className="font-medium text-muted-foreground">Active Tags</span>
                      <span className="font-black text-primary">{item.tags}</span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="tags"
            fill="url(#barGradient)"
            radius={[10, 10, 10, 10]}
            barSize={40}
            className="cursor-pointer transition-all duration-300 hover:opacity-80"
            onClick={(entry: any) => {
              if (entry?.registryId && entry?.fullName) {
                router.push(`/repos/${entry.registryId}/${entry.fullName}`)
              }
            }}
            animationBegin={0}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
