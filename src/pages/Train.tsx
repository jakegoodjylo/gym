import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { addWeeks } from 'date-fns'
import {
  Plus,
  Dumbbell,
  ChevronLeft,
  ChevronRight,
  Search,
  Trophy,
  Clock,
  TrendingDown,
  Repeat,
  Play,
  Pencil,
  ClipboardList,
} from 'lucide-react'
import { db, type Exercise, type Routine, type SetEntry, type Workout } from '@/lib/db'
import { createWorkout, repeatLastWorkout, startWorkoutFromRoutine } from '@/lib/repo'
import { useMuscleVolume } from '@/hooks/useMuscleVolume'
import { useExercises } from '@/hooks/useExercises'
import { totalSets } from '@/lib/volume'
import { MUSCLE_LIST, muscleLabel, volumeStatus } from '@/lib/muscles'
import { weekBounds, relativeDay, fmtDayShort } from '@/lib/date'
import { bestE1RM, volumeLoad } from '@/lib/strength'
import { useSettings } from '@/hooks/useSettings'
import { displayWeight } from '@/lib/strength'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { StatTile } from '@/components/common/StatTile'
import { MuscleVolumePanel } from '@/components/MuscleVolumePanel'
import { MuscleHeatmap } from '@/components/MuscleHeatmap'
import { WeeklyVolumeChart } from '@/components/charts/WeeklyVolumeChart'
import { LineTrend } from '@/components/charts/LineTrend'
import { RoutineEditor } from '@/components/RoutineEditor'
import { useVolumeTrend } from '@/hooks/useMuscleVolume'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { EQUIPMENT_LABELS } from '@/lib/db'

export function Train() {
  const navigate = useNavigate()

  async function start() {
    const id = await createWorkout()
    navigate(`/workouts/${id}`)
  }

  return (
    <div>
      <PageHeader
        title="Train"
        action={
          <Button size="sm" onClick={start}>
            <Plus /> Start
          </Button>
        }
      />

      <Tabs defaultValue="sessions">
        <TabsList className="w-full">
          <TabsTrigger value="sessions" className="flex-1">
            Sessions
          </TabsTrigger>
          <TabsTrigger value="volume" className="flex-1">
            Volume
          </TabsTrigger>
          <TabsTrigger value="prs" className="flex-1">
            PRs
          </TabsTrigger>
          <TabsTrigger value="exercises" className="flex-1">
            Library
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions">
          <SessionsTab onStart={start} />
        </TabsContent>
        <TabsContent value="volume">
          <VolumeTab />
        </TabsContent>
        <TabsContent value="prs">
          <PRsTab />
        </TabsContent>
        <TabsContent value="exercises">
          <ExercisesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

function SessionsTab({ onStart }: { onStart: () => void }) {
  const navigate = useNavigate()
  const routines = useLiveQuery(() => db.routines.orderBy('order').toArray(), [])
  const data = useLiveQuery(async () => {
    const workouts = await db.workouts.orderBy('startedAt').reverse().toArray()
    const sets = await db.sets.toArray()
    const byWorkout = new Map<string, number>()
    const exByWorkout = new Map<string, Set<string>>()
    for (const s of sets) {
      byWorkout.set(s.workoutId, (byWorkout.get(s.workoutId) ?? 0) + 1)
      if (!exByWorkout.has(s.workoutId)) exByWorkout.set(s.workoutId, new Set())
      exByWorkout.get(s.workoutId)!.add(s.exerciseId)
    }
    return workouts.map((w) => ({
      w,
      setCount: byWorkout.get(w.id) ?? 0,
      exCount: exByWorkout.get(w.id)?.size ?? 0,
    }))
  }, [])

  const noWorkouts = data && data.length === 0
  const noRoutines = !routines || routines.length === 0

  async function repeat() {
    const id = await repeatLastWorkout()
    if (id) navigate(`/workouts/${id}`)
  }

  if (noWorkouts && noRoutines) {
    return (
      <div className="space-y-4">
        <RoutinesSection routines={routines} />
        <EmptyState
          icon={Dumbbell}
          title="No workouts yet"
          description="Start a session and log your sets. Your history and volume build up here."
          action={
            <Button onClick={onStart}>
              <Plus /> Start a workout
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <RoutinesSection routines={routines} />

      {!noWorkouts && (
        <Button variant="outline" className="mb-1 w-full" onClick={repeat}>
          <Repeat /> Repeat last workout
        </Button>
      )}
      {data?.map(({ w, setCount, exCount }) => {
        const duration =
          w.finishedAt && w.startedAt ? Math.round((w.finishedAt - w.startedAt) / 60000) : null
        return (
          <button
            key={w.id}
            onClick={() => navigate(`/workouts/${w.id}`)}
            className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors active:bg-accent"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{w.name || 'Workout'}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {relativeDay(w.date)}
                {!w.finishedAt && <span className="ml-2 text-warning">· in progress</span>}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3 text-[11px] text-muted-foreground tabular-nums">
              <span>{exCount} ex</span>
              <span>{setCount} sets</span>
              {duration != null && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {duration}m
                </span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function RoutinesSection({ routines }: { routines: Routine[] | undefined }) {
  const navigate = useNavigate()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Routine | null>(null)

  async function start(id: string) {
    const wid = await startWorkoutFromRoutine(id)
    if (wid) navigate(`/workouts/${wid}`)
  }
  function openNew() {
    setEditing(null)
    setEditorOpen(true)
  }
  function openEdit(r: Routine) {
    setEditing(r)
    setEditorOpen(true)
  }

  return (
    <div className="mb-2">
      <div className="mb-2 flex items-center justify-between">
        <span className="label-mono">Routines</span>
        {routines && routines.length > 0 && (
          <button
            onClick={openNew}
            className="flex items-center gap-1 text-[11px] text-muted-foreground active:text-foreground"
          >
            <Plus className="size-3" /> New
          </button>
        )}
      </div>

      {routines && routines.length > 0 ? (
        <div className="space-y-2">
          {routines.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-2 rounded-lg border border-border bg-card p-3"
            >
              <ClipboardList className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{r.name}</div>
                <div className="text-[11px] text-muted-foreground tabular-nums">
                  {r.exerciseIds.length} exercise{r.exerciseIds.length === 1 ? '' : 's'}
                </div>
              </div>
              <button
                onClick={() => openEdit(r)}
                aria-label="Edit routine"
                className="p-1.5 text-muted-foreground active:text-foreground"
              >
                <Pencil className="size-4" />
              </button>
              <Button size="sm" onClick={() => start(r.id)}>
                <Play /> Start
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <button
          onClick={openNew}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-xs text-muted-foreground active:bg-accent"
        >
          <Plus className="size-4" /> Create a routine to start faster
        </button>
      )}

      <RoutineEditor open={editorOpen} onOpenChange={setEditorOpen} routine={editing} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Volume
// ---------------------------------------------------------------------------

function VolumeTab() {
  const [offset, setOffset] = useState(0)
  const base = addWeeks(new Date(), offset)
  const { start, end } = weekBounds(base)
  const volume = useMuscleVolume(start, end)
  const trend = useVolumeTrend(12)

  const total = volume ? totalSets(volume) : 0
  const undertrained = volume
    ? MUSCLE_LIST.filter((m) => {
        const s = volumeStatus(m.id, volume[m.id])
        return s === 'under' || s === 'none'
      })
    : []

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setOffset((o) => o - 1)}
          className="rounded-md border border-border p-1.5 text-muted-foreground transition-colors active:bg-accent"
          aria-label="Previous week"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="text-center text-xs">
          <div className="font-medium">{offset === 0 ? 'This week' : offset === -1 ? 'Last week' : `${fmtDayShort(start)}`}</div>
          <div className="text-muted-foreground">
            {fmtDayShort(start)} – {fmtDayShort(end)}
          </div>
        </div>
        <button
          onClick={() => setOffset((o) => Math.min(0, o + 1))}
          disabled={offset >= 0}
          className="rounded-md border border-border p-1.5 text-muted-foreground transition-colors active:bg-accent disabled:opacity-40"
          aria-label="Next week"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <StatTile label="Total sets" value={fmt(total)} hint="working sets this week" />
        <StatTile
          label="Needs work"
          value={undertrained.length}
          hint={undertrained.length ? 'muscle groups below target' : 'all on target 🎯'}
        />
      </div>

      <div className="mb-4">
        <MuscleHeatmap volume={volume} />
      </div>

      <div className="mb-4">
        <div className="label-mono mb-2">Weekly volume · last 12 weeks</div>
        {trend ? (
          <WeeklyVolumeChart data={trend} />
        ) : (
          <div className="h-40 animate-pulse rounded-lg bg-secondary" />
        )}
      </div>

      {undertrained.length > 0 && (
        <div className="mb-4 rounded-lg border border-warning/40 bg-warning/5 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-warning">
            <TrendingDown className="size-3.5" /> Under-trained this week
          </div>
          <div className="flex flex-wrap gap-1.5">
            {undertrained.map((m) => (
              <Badge key={m.id} variant="outline">
                {m.label}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <MuscleVolumePanel volume={volume} />

      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        Primary muscle = 1 set · secondary = ½ set. The marker shows the minimum effective volume.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Personal records
// ---------------------------------------------------------------------------

function PRsTab() {
  const settings = useSettings()
  const unit = settings.weightUnit
  const [selected, setSelected] = useState<Exercise | null>(null)

  const rows = useLiveQuery(async () => {
    const sets = (await db.sets.toArray()).filter(
      (s) => s.done && s.weight != null && s.weight > 0 && s.reps != null && s.reps > 0,
    )
    if (sets.length === 0) return []
    const exs = await db.exercises.toArray()
    const exMap = new Map(exs.map((e) => [e.id, e]))
    const workouts = await db.workouts.toArray()
    const wMap = new Map(workouts.map((w) => [w.id, w]))

    const byEx = new Map<string, typeof sets>()
    for (const s of sets) {
      if (!byEx.has(s.exerciseId)) byEx.set(s.exerciseId, [])
      byEx.get(s.exerciseId)!.push(s)
    }

    const out = []
    for (const [exId, exSets] of byEx) {
      const ex = exMap.get(exId)
      if (!ex) continue
      // Heaviest set (ties broken by more reps).
      const top = exSets.reduce((a, b) =>
        b.weight! > a.weight! || (b.weight === a.weight && (b.reps ?? 0) > (a.reps ?? 0)) ? b : a,
      )
      out.push({
        ex,
        topWeight: top.weight!,
        topReps: top.reps!,
        e1rm: bestE1RM(exSets),
        date: wMap.get(top.workoutId)?.date,
      })
    }
    return out.sort((a, b) => b.e1rm - a.e1rm)
  }, [])

  if (rows && rows.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="No PRs yet"
        description="Complete some weighted sets and your heaviest lifts will show up here."
      />
    )
  }

  return (
    <div className="divide-y divide-border">
      {rows?.map((r) => (
        <button
          key={r.ex.id}
          onClick={() => setSelected(r.ex)}
          className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors active:bg-accent"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 truncate text-sm font-medium">
              <Trophy className="size-3.5 shrink-0 text-warning" />
              {r.ex.name}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
              e1RM {Math.round(displayWeight(r.e1rm, unit))} {unit}
              {r.date && ` · ${relativeDay(r.date)}`}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-sm font-semibold tabular-nums">
              {Math.round(displayWeight(r.topWeight, unit) * 10) / 10} {unit}
            </div>
            <div className="text-[11px] text-muted-foreground tabular-nums">× {r.topReps}</div>
          </div>
        </button>
      ))}

      <ExerciseDetailSheet exercise={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Exercises library
// ---------------------------------------------------------------------------

function ExercisesTab() {
  const exercises = useExercises()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Exercise | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return exercises.filter((e) => !q || e.name.toLowerCase().includes(q))
  }, [exercises, query])

  return (
    <div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={`Search ${exercises.length} exercises…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="divide-y divide-border">
        {filtered.map((e) => (
          <button
            key={e.id}
            onClick={() => setSelected(e)}
            className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors active:bg-accent"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">
                {e.name}
                {e.isCustom && <span className="ml-1.5 text-[10px] text-muted-foreground">custom</span>}
              </div>
              <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {e.primaryMuscles.map(muscleLabel).join(', ') || 'Cardio'}
              </div>
            </div>
            <Badge variant="outline">{EQUIPMENT_LABELS[e.equipment]}</Badge>
          </button>
        ))}
      </div>

      <ExerciseDetailSheet exercise={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function ExerciseDetailSheet({ exercise, onClose }: { exercise: Exercise | null; onClose: () => void }) {
  const settings = useSettings()
  const unit = settings.weightUnit
  const data = useLiveQuery(async () => {
    if (!exercise) return null
    const sets = (await db.sets.where('exerciseId').equals(exercise.id).toArray()).filter((s) => s.done)
    const wIds = [...new Set(sets.map((s) => s.workoutId))]
    const workouts = (await db.workouts.bulkGet(wIds)).filter(Boolean) as Workout[]
    const wMap = new Map(workouts.map((w) => [w.id, w]))

    // Group completed sets by session.
    const byWorkout = new Map<string, SetEntry[]>()
    for (const s of sets) {
      if (!byWorkout.has(s.workoutId)) byWorkout.set(s.workoutId, [])
      byWorkout.get(s.workoutId)!.push(s)
    }
    const sessions = [...byWorkout.entries()]
      .map(([id, s]) => ({ id, date: wMap.get(id)?.date, sets: s, e1rm: bestE1RM(s) }))
      .filter((x) => x.date)
      .sort((a, b) => a.date!.localeCompare(b.date!))

    return {
      best1rm: bestE1RM(sets),
      totalLoad: volumeLoad(sets),
      sessionCount: byWorkout.size,
      lastDate: sessions.at(-1)?.date,
      series: sessions.filter((x) => x.e1rm > 0).map((x) => ({ date: x.date!, e1rmKg: x.e1rm })),
      recent: sessions.slice(-6).reverse(),
    }
  }, [exercise?.id])

  return (
    <Sheet open={!!exercise} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="max-h-[92dvh]">
        {exercise && (
          <>
            <SheetHeader>
              <SheetTitle>{exercise.name}</SheetTitle>
            </SheetHeader>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="primary">{EQUIPMENT_LABELS[exercise.equipment]}</Badge>
                {exercise.primaryMuscles.map((m) => (
                  <Badge key={m}>{muscleLabel(m)}</Badge>
                ))}
                {exercise.secondaryMuscles.map((m) => (
                  <Badge key={m} variant="outline">
                    {muscleLabel(m)}
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <StatTile
                  label="Best e1RM"
                  value={data?.best1rm ? Math.round(displayWeight(data.best1rm, unit)) : '—'}
                  unit={data?.best1rm ? unit : undefined}
                />
                <StatTile label="Sessions" value={data?.sessionCount ?? '—'} />
                <StatTile label="Last done" value={data?.lastDate ? fmtDayShort(data.lastDate) : '—'} />
              </div>

              {data && data.series.length >= 2 && (
                <div>
                  <div className="label-mono mb-2">Estimated 1RM over time</div>
                  <LineTrend
                    data={data.series.map((p) => ({
                      date: p.date,
                      value: Math.round(displayWeight(p.e1rmKg, unit)),
                    }))}
                    unit={unit}
                    height={150}
                  />
                </div>
              )}

              {data && data.recent.length > 0 ? (
                <div>
                  <div className="label-mono mb-2">Recent sessions</div>
                  <div className="divide-y divide-border">
                    {data.recent.map((s) => (
                      <div key={s.id} className="flex items-baseline justify-between gap-3 py-2 text-xs">
                        <span className="shrink-0 text-muted-foreground">{fmtDayShort(s.date!)}</span>
                        <span className="text-right tabular-nums">
                          {s.sets.map((x) => setSummary(x, unit)).join(', ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No sets logged yet.</p>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function setSummary(s: SetEntry, unit: 'kg' | 'lb'): string {
  const w = s.weight != null ? Math.round(displayWeight(s.weight, unit) * 10) / 10 : null
  if (w != null && s.reps != null) return `${w}×${s.reps}`
  if (s.reps != null) return `${s.reps} reps`
  if (s.durationSec != null) return `${s.durationSec}s`
  if (s.distanceM != null) return `${(s.distanceM / 1000).toFixed(1)}km`
  return '—'
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}
