import { useLiveQuery } from 'dexie-react-hooks'
import { startOfWeek, subWeeks, eachDayOfInterval } from 'date-fns'
import { db } from '@/lib/db'
import { toISODate, isToday, fmtDay } from '@/lib/date'
import { cn } from '@/lib/utils'

/** Background for a day cell based on how many sets were logged that day. */
function levelColor(sets: number): string {
  if (sets <= 0) return 'hsl(var(--secondary))'
  if (sets < 6) return 'hsl(var(--chart-2) / 0.35)'
  if (sets < 11) return 'hsl(var(--chart-2) / 0.6)'
  if (sets < 16) return 'hsl(var(--chart-2) / 0.8)'
  return 'hsl(var(--chart-2))'
}

const LEGEND = [0, 4, 9, 14, 20]

export function ConsistencyHeatmap({ weeks = 17 }: { weeks?: number }) {
  const byDate = useLiveQuery(async () => {
    const workouts = await db.workouts.toArray()
    const sets = await db.sets.toArray()
    const countByWorkout = new Map<string, number>()
    for (const s of sets) countByWorkout.set(s.workoutId, (countByWorkout.get(s.workoutId) ?? 0) + 1)
    const m = new Map<string, number>()
    for (const w of workouts) m.set(w.date, (m.get(w.date) ?? 0) + (countByWorkout.get(w.id) ?? 0))
    return m
  }, [])

  // Start on the Monday `weeks-1` weeks back so columns align to calendar weeks.
  const today = new Date()
  const start = startOfWeek(subWeeks(today, weeks - 1), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start, end: today }).map(toISODate)

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="label-mono">Consistency</span>
        <span className="text-[11px] text-muted-foreground">last {weeks} weeks</span>
      </div>

      <div className="overflow-x-auto">
        <div
          className="inline-grid grid-flow-col gap-[3px]"
          style={{ gridTemplateRows: 'repeat(7, 13px)', gridAutoColumns: '13px' }}
        >
          {days.map((iso) => {
            const n = byDate?.get(iso) ?? 0
            return (
              <div
                key={iso}
                title={`${fmtDay(iso)} · ${n} set${n === 1 ? '' : 's'}`}
                className={cn('rounded-[2px]', isToday(iso) && 'ring-1 ring-foreground')}
                style={{ background: levelColor(n) }}
              />
            )
          })}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
        less
        {LEGEND.map((n) => (
          <span
            key={n}
            className="inline-block size-2.5 rounded-[2px]"
            style={{ background: levelColor(n) }}
          />
        ))}
        more
      </div>
    </div>
  )
}
