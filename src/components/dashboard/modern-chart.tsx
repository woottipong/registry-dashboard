"use client"

import { motion } from "framer-motion"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUpIcon } from "lucide-react"
import { DASHBOARD_DESIGN } from "@/lib/design/dashboard-design"
import { cn } from "@/lib/utils"

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
      <div className={cn(DASHBOARD_DESIGN.components.chart.container, "animate-pulse")}>
        <div className="h-6 bg-neutral-200 rounded w-48 mb-6" />
        <div className="h-64 bg-neutral-200 rounded-lg" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={cn(DASHBOARD_DESIGN.components.chart.container)}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <TrendingUpIcon className="w-8 h-8 text-neutral-400 mx-auto mb-3" />
            <p className="text-sm text-neutral-600">No data available</p>
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
        duration: parseFloat(DASHBOARD_DESIGN.motion.duration.normal) / 1000,
        ease: [0.16, 1, 0.3, 1] as const
      }}
      className={DASHBOARD_DESIGN.components.chart.container}
    >
      {/* Chart header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className={cn(DASHBOARD_DESIGN.components.chart.title)}>
          {title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
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
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.3}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#e5e7eb" 
            opacity={0.5}
          />
          
          <XAxis 
            dataKey="name"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          
          <YAxis 
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
              backdropFilter: 'blur(8px)',
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
