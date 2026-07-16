import { MUSCLE_LIST, REGIONS, volumeStatus, type VolumeStatus } from '@/lib/muscles'
import type { MuscleVolume } from '@/lib/volume'
import { cn } from '@/lib/utils'

const STATUS_BAR: Record<VolumeStatus, string> = {
  none: 'bg-muted-foreground/30',
  under: 'bg-warning',
  optimal: 'bg-success',
  high: 'bg-chart-2',
}

const STATUS_LABEL: Record<VolumeStatus, string> = {
  none: 'none',
  under: 'low',
  optimal: 'on target',
  high: 'high',
}

function fmtSets(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

export function MuscleVolumePanel({
  volume,
  showRegions = true,
}: {
  volume: MuscleVolume | undefined
  showRegions?: boolean
}) {
  if (!volume) {
    return <div className="h-40 animate-pulse rounded-lg bg-secondary" />
  }

  const rows = MUSCLE_LIST.map((m) => ({
    meta: m,
    sets: volume[m.id],
    status: volumeStatus(m.id, volume[m.id]),
  }))

  if (!showRegions) {
    return (
      <div className="space-y-2.5">
        {rows.map((r) => (
          <VolumeRow key={r.meta.id} {...r} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {REGIONS.map((region) => {
        const regionRows = rows.filter((r) => r.meta.region === region.id)
        return (
          <div key={region.id}>
            <div className="label-mono mb-2">{region.label}</div>
            <div className="space-y-2.5">
              {regionRows.map((r) => (
                <VolumeRow key={r.meta.id} {...r} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function VolumeRow({
  meta,
  sets,
  status,
}: {
  meta: (typeof MUSCLE_LIST)[number]
  sets: number
  status: VolumeStatus
}) {
  // Bar scaled so the top of the productive range (mav) fills ~85% of the track.
  const pct = Math.min(100, (sets / meta.mav) * 85)
  const mevPct = Math.min(100, (meta.mev / meta.mav) * 85)

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="font-medium">{meta.label}</span>
        <span className="tabular-nums text-muted-foreground">
          <span className={cn(status === 'under' && 'text-warning', status === 'optimal' && 'text-success')}>
            {fmtSets(sets)}
          </span>{' '}
          / {meta.mev}–{meta.mav} · {STATUS_LABEL[status]}
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div className={cn('h-full rounded-full transition-all', STATUS_BAR[status])} style={{ width: `${pct}%` }} />
        {/* MEV threshold marker */}
        <div className="absolute top-0 h-full w-px bg-foreground/40" style={{ left: `${mevPct}%` }} />
      </div>
    </div>
  )
}
