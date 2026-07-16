import { cn } from '@/lib/utils'

interface StatTileProps {
  label: string
  value: React.ReactNode
  unit?: string
  hint?: React.ReactNode
  className?: string
}

export function StatTile({ label, value, unit, hint, className }: StatTileProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-3', className)}>
      <div className="label-mono">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-semibold tabular-nums leading-none">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  )
}
