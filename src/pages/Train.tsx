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
} from 'lucide-react'
import { db, type Exercise } from '@/lib/db'
import { createWorkout } from '@/lib/repo'
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
          <TabsTrigger value="exercises" className="flex-1">
            Exercises
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions">
          <SessionsTab onStart={start} />
        </TabsContent>
        <TabsContent value="volume">
          <VolumeTab />
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

  if (data && data.length === 0) {
    return (
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
    )
  }

  return (
    <div className="space-y-2">
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

// ---------------------------------------------------------------------------
// Volume
// ---------------------------------------------------------------------------

function VolumeTab() {
  const [offset, setOffset] = useState(0)
  const base = addWeeks(new Date(), offset)
  const { start, end } = weekBounds(base)
  const volume = useMuscleVolume(start, end)

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
  const stats = useLiveQuery(async () => {
    if (!exercise) return null
    const sets = (await db.sets.where('exerciseId').equals(exercise.id).toArray()).filter((s) => s.done)
    const workouts = await db.workouts.bulkGet([...new Set(sets.map((s) => s.workoutId))])
    const lastDate = workouts
      .filter(Boolean)
      .map((w) => w!.date)
      .sort()
      .at(-1)
    return {
      best1rm: bestE1RM(sets),
      totalLoad: volumeLoad(sets),
      sessions: new Set(sets.map((s) => s.workoutId)).size,
      lastDate,
    }
  }, [exercise?.id])

  return (
    <Sheet open={!!exercise} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
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
                  value={stats?.best1rm ? Math.round(displayWeight(stats.best1rm, settings.weightUnit)) : '—'}
                  unit={stats?.best1rm ? settings.weightUnit : undefined}
                />
                <StatTile label="Sessions" value={stats?.sessions ?? '—'} />
                <StatTile label="Last done" value={stats?.lastDate ? fmtDayShort(stats.lastDate) : '—'} />
              </div>

              {stats?.best1rm ? (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Trophy className="size-3.5 text-warning" /> Estimated one-rep max from your best logged set.
                </p>
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

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}
