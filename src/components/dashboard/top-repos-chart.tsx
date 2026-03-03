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

// Custom tick to prevent completely broken names
const CustomXAxisTick = ({ x, y, payload }: any) => {
  if (!payload || !payload.value) return null;
  
  // Try to fit the name better, if it's still too long, show ellipsis
  const formattedValue = payload.value.length > 12 
    ? `${payload.value.substring(0, 10)}..` 
    : payload.value;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="middle"
        fill="currentColor"
        className="text-[10px] font-bold fill-muted-foreground/70"
      >
        {formattedValue}
      </text>
    </g>
  );
};

export function TopReposChart({ data, isLoading }: TopReposChartProps) {
  const router = useRouter()

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-2xl bg-muted/50" />
  }

  if (!data?.length) return null

  const chartData = data.slice(0, 8).map((item) => {
    // Extract a cleaner name: handle both standard Docker and namespaced paths
    const parts = item.name.split('/')
    const displayName = parts.length > 1 ? parts.slice(-2).join('/') : item.name
    
    return {
      name: displayName,
      fullName: item.name,
      registryId: item.registryId,
      tags: item.tagCount,
    }
  })

  return (
    <div className="w-full h-[320px] pb-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }} barGap={8}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={1} />
              <stop offset="50%" stopColor="var(--primary)" stopOpacity={0.8} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="barHoverGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={1} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.8} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="var(--border)" opacity={0.4} />
          <XAxis
            dataKey="name"
            tick={<CustomXAxisTick />}
            tickLine={false}
            axisLine={false}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 10, fontWeight: 700 }}
            className="fill-muted-foreground/60"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => (value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value)}
          />
          <Tooltip
            cursor={{ fill: 'var(--primary)', opacity: 0.05, radius: 16 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-card/95 backdrop-blur-xl border border-border/60 p-4 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex flex-col gap-1 min-w-[180px] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-chart-1 via-primary to-chart-2" />
                    <p className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest leading-none mb-1.5 mt-1">Repository</p>
                    <p className="text-sm font-bold truncate max-w-[250px] mb-3 text-foreground/90">{item.fullName}</p>
                    <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                      <span className="font-semibold text-muted-foreground">Active Tags</span>
                      <span className="font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">{item.tags}</span>
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
            radius={[12, 12, 12, 12]}
            barSize={36}
            className="cursor-pointer transition-all duration-500 hover:fill-[url(#barHoverGradient)] drop-shadow-sm"
            onClick={(entry: any) => {
              if (entry?.registryId && entry?.fullName) {
                router.push(`/repos/${entry.registryId}/${encodeURIComponent(entry.fullName)}`)
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
