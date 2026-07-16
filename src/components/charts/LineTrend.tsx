import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { fmtDayShort } from '@/lib/date'

export interface TrendPoint {
  date: string // yyyy-MM-dd
  value: number
}

interface LineTrendProps {
  data: TrendPoint[]
  unit?: string
  height?: number
  color?: string // css color, defaults to primary
}

export function LineTrend({ data, unit, height = 180, color }: LineTrendProps) {
  const stroke = color ?? 'hsl(var(--primary))'
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground"
        style={{ height }}
      >
        No data in range
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={fmtDayShort}
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          stroke="hsl(var(--border))"
          minTickGap={28}
        />
        <YAxis
          width={44}
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          stroke="hsl(var(--border))"
          domain={['dataMin - 1', 'dataMax + 1']}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
            fontFamily: 'inherit',
          }}
          labelFormatter={(l) => fmtDayShort(l as string)}
          formatter={(v) => [`${v}${unit ? ` ${unit}` : ''}`, '']}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={stroke}
          strokeWidth={2}
          dot={{ r: 2, fill: stroke }}
          activeDot={{ r: 4 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
