"use client"

import { motion } from "framer-motion"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUpIcon } from "lucide-react"

interface ChartData {
  name: string
  registryId: string
  tagCount: number
}

interface ModernChartProps {
  data: ChartData[]
  isLoading?: boolean
  title?: string
}

export function ModernChart({ data, isLoading, title = "Top Repositories by Tags" }: ModernChartProps) {
  if (isLoading) {
    return (
      <div className="h-80 w-full bg-card rounded-2xl border border-border p-6">
        <div className="h-6 bg-muted rounded w-48 mb-6" />
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="h-80 w-full bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <TrendingUpIcon className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No data available</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1] as const
      }}
      className="h-80 w-full bg-card rounded-2xl border border-border p-6"
    >
      {/* Chart header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          {title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingUpIcon className="w-4 h-4" />
          <span>{data.length} repositories</span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.3} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            opacity={0.5}
          />

          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground, #6b7280)' }}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />

          <YAxis
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground, #6b7280)' }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
              }}
            labelStyle={{ fontWeight: 600, color: '#111827' }}
            formatter={(value) => [`${value ?? 0} tags`, 'Count']}
          />

          <Bar
            dataKey="tagCount"
            fill="url(#colorGradient)"
            radius={[4, 4, 0, 0]}
            animationDuration={800}
            animationBegin={200}
          />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
