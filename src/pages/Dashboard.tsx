import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { format } from 'date-fns'
import { Plus, Dumbbell, ChevronRight, Flame, Activity } from 'lucide-react'
import { db } from '@/lib/db'
import { createWorkout, toggleHabit } from '@/lib/repo'
import { useCurrentWeekVolume } from '@/hooks/useMuscleVolume'
import { useSettings } from '@/hooks/useSettings'
import { totalSets } from '@/lib/volume'
import { MUSCLE_LIST, volumeStatus } from '@/lib/muscles'
import { currentStreak } from '@/lib/habits'
import { todayISO, weekBounds, relativeDay } from '@/lib/date'
import { displayWeight } from '@/lib/strength'
import { StatTile } from '@/components/common/StatTile'
import { LineTrend, type TrendPoint } from '@/components/charts/LineTrend'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function Dashboard() {
  const navigate = useNavigate()
  const settings = useSettings()
  const today = todayISO()
  const volume = useCurrentWeekVolume()

  const habits = useLiveQuery(
    async () => (await db.habits.orderBy('order').toArray()).filter((h) => !h.archived),
    [],
  )
  const allLogs = useLiveQuery(() => db.habitLogs.toArray(), [])
  const lastWorkout = useLiveQuery(() => db.workouts.orderBy('startedAt').last(), [])
  const weekWorkoutCount = useLiveQuery(async () => {
    const { start, end } = weekBounds()
    return db.workouts.where('date').between(start, end, true, true).count()
  }, [])
  const weight = useLiveQuery(
    async () => (await db.metrics.where('type').equals('weight').toArray()).sort((a, b) => a.date.localeCompare(b.date)),
    [],
  )

  const logsByHabit = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const l of allLogs ?? []) {
      if (!map.has(l.habitId)) map.set(l.habitId, new Set())
      map.get(l.habitId)!.add(l.date)
    }
    return map
  }, [allLogs])

  const doneToday = habits?.filter((h) => logsByHabit.get(h.id)?.has(today)).length ?? 0
  const total = volume ? totalSets(volume) : 0
  const undertrained = volume
    ? MUSCLE_LIST.filter((m) => ['under', 'none'].includes(volumeStatus(m.id, volume[m.id])))
    : []

  const weightPoints: TrendPoint[] = useMemo(() => {
    const cutoff = daysAgoISO(90)
    return (weight ?? [])
      .filter((m) => m.date >= cutoff)
      .map((m) => ({ date: m.date, value: round(displayWeight(m.value, settings.weightUnit)) }))
  }, [weight, settings.weightUnit])
  const latestWeight = weightPoints.at(-1)

  async function start() {
    const id = await createWorkout()
    navigate(`/workouts/${id}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="label-mono">{format(new Date(), 'EEEE, d MMMM')}</p>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">Overview</h1>
      </div>

      {/* Week snapshot */}
      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Sets / wk" value={fmt(total)} hint="volume" />
        <StatTile label="Workouts" value={weekWorkoutCount ?? 0} hint="this week" />
        <StatTile
          label="Habits"
          value={habits ? `${doneToday}/${habits.length}` : '—'}
          hint="today"
        />
      </div>

      {/* Start workout / last session */}
      <Card>
        <CardContent className="flex items-center justify-between gap-3 p-3">
          <div className="min-w-0">
            <div className="text-sm font-medium">
              {lastWorkout && !lastWorkout.finishedAt ? 'Resume workout' : 'Start a workout'}
            </div>
            <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {lastWorkout
                ? `Last: ${lastWorkout.name || 'Workout'} · ${relativeDay(lastWorkout.date)}`
                : 'Log your first session'}
            </div>
          </div>
          <Button
            onClick={() =>
              lastWorkout && !lastWorkout.finishedAt
                ? navigate(`/workouts/${lastWorkout.id}`)
                : start()
            }
          >
            {lastWorkout && !lastWorkout.finishedAt ? 'Resume' : <><Plus /> Start</>}
          </Button>
        </CardContent>
      </Card>

      {/* Today's habits */}
      {habits && habits.length > 0 && (
        <section>
          <SectionHeader title="Today" to="/habits" />
          <div className="space-y-2">
            {habits.map((h) => {
              const dates = logsByHabit.get(h.id) ?? new Set<string>()
              const done = dates.has(today)
              const streak = currentStreak(dates)
              return (
                <button
                  key={h.id}
                  onClick={() => toggleHabit(h.id, today)}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors active:bg-accent"
                >
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-md border text-xs',
                      done ? `bg-chart-${h.color} border-transparent text-background` : 'border-border text-transparent',
                    )}
                  >
                    ✓
                  </span>
                  {h.emoji && <span>{h.emoji}</span>}
                  <span className={cn('flex-1 truncate text-sm', done && 'text-muted-foreground line-through')}>
                    {h.name}
                  </span>
                  {streak > 0 && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
                      <Flame className="size-3" /> {streak}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* Weekly volume summary */}
      <section>
        <SectionHeader title="Weekly volume" to="/workouts" />
        <Card>
          <CardContent className="p-3">
            {undertrained.length === 0 && total > 0 ? (
              <p className="flex items-center gap-2 text-sm">
                <Activity className="size-4 text-success" /> All muscle groups on target this week 🎯
              </p>
            ) : total === 0 ? (
              <p className="text-sm text-muted-foreground">No sets logged this week yet.</p>
            ) : (
              <>
                <p className="mb-2 text-xs text-muted-foreground">Muscle groups below target:</p>
                <div className="flex flex-wrap gap-1.5">
                  {undertrained.map((m) => (
                    <Badge key={m.id} variant="outline">
                      {m.label}
                    </Badge>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Bodyweight */}
      {weightPoints.length > 0 && (
        <section>
          <SectionHeader title="Bodyweight" to="/metrics" />
          <Card>
            <CardContent className="p-3">
              <div className="mb-2 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tabular-nums">{latestWeight?.value}</span>
                <span className="text-xs text-muted-foreground">{settings.weightUnit}</span>
              </div>
              <LineTrend data={weightPoints} unit={settings.weightUnit} height={120} />
            </CardContent>
          </Card>
        </section>
      )}

      {(!habits || habits.length === 0) && !latestWeight && (
        <Link
          to="/habits"
          className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-4 text-sm text-muted-foreground"
        >
          <Dumbbell className="size-4" /> Add habits & log a workout to fill your dashboard
        </Link>
      )}
    </div>
  )
}

function SectionHeader({ title, to }: { title: string; to: string }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="label-mono">{title}</h2>
      <Link to={to} className="flex items-center text-[11px] text-muted-foreground transition-colors hover:text-foreground">
        View <ChevronRight className="size-3" />
      </Link>
    </div>
  )
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}
function round(n: number): number {
  return Math.round(n * 10) / 10
}
function daysAgoISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}
