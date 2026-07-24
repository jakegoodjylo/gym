import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { fmtDayShort } from '@/lib/date'
import type { WeekVolumePoint } from '@/hooks/useMuscleVolume'

interface WeeklyVolumeChartProps {
  data: WeekVolumePoint[]
  height?: number
}

export function WeeklyVolumeChart({ data, height = 160 }: WeeklyVolumeChartProps) {
  const hasData = data.some((d) => d.sets > 0)
  if (!hasData) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground"
        style={{ height }}
      >
        No volume logged yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="weekStart"
          tickFormatter={fmtDayShort}
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          stroke="hsl(var(--border))"
          minTickGap={16}
        />
        <YAxis
          width={44}
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          stroke="hsl(var(--border))"
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ fill: 'hsl(var(--accent))' }}
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
            fontFamily: 'inherit',
          }}
          labelFormatter={(l) => `Week of ${fmtDayShort(l as string)}`}
          formatter={(v) => [`${v} sets`, '']}
        />
        <Bar dataKey="sets" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  )
}
