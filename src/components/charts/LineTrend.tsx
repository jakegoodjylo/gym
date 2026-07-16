import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
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
  /** Optional horizontal goal line. */
  goal?: number
  goalLabel?: string
}

export function LineTrend({ data, unit, height = 180, color, goal, goalLabel }: LineTrendProps) {
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
          domain={[
            (min: number) => Math.floor(Math.min(min, goal ?? min) - 1),
            (max: number) => Math.ceil(Math.max(max, goal ?? max) + 1),
          ]}
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
        {goal != null && (
          <ReferenceLine
            y={goal}
            stroke="hsl(var(--chart-1))"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{
              value: goalLabel ?? `Goal ${goal}`,
              position: 'insideTopRight',
              fontSize: 10,
              fill: 'hsl(var(--chart-1))',
            }}
          />
        )}
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
