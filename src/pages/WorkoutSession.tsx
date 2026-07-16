import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Plus, Check, Trash2, Timer, X, Trophy, MoreVertical, Calculator } from 'lucide-react'
import { db, type Exercise, type SetEntry, type Workout } from '@/lib/db'
import {
  addSet,
  addExerciseFromHistory,
  deleteSet,
  deleteWorkout,
  finishWorkout,
  toggleSetDone,
  updateSet,
  updateWorkout,
} from '@/lib/repo'
import { useExerciseMap } from '@/hooks/useExercises'
import { useSettings } from '@/hooks/useSettings'
import { useRestTimer } from '@/hooks/useRestTimer'
import { displayWeight, toKg } from '@/lib/strength'
import { suggestedRestSec, fmtRest } from '@/lib/rest'
import { muscleLabel } from '@/lib/muscles'
import { relativeDay } from '@/lib/date'
import { ExercisePicker } from '@/components/ExercisePicker'
import { PlateCalculator } from '@/components/PlateCalculator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export function WorkoutSession() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const settings = useSettings()
  const exMap = useExerciseMap()
  const timer = useRestTimer()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [plateOpen, setPlateOpen] = useState(false)

  const workout = useLiveQuery(() => (id ? db.workouts.get(id) : undefined), [id])
  const sets = useLiveQuery(
    () => (id ? db.sets.where('workoutId').equals(id).toArray() : []),
    [id],
  )

  // Group sets by exercise, preserving first-appearance order.
  const groups = useMemo(() => {
    const map = new Map<string, SetEntry[]>()
    const firstOrder = new Map<string, number>()
    for (const s of (sets ?? []).slice().sort((a, b) => a.order - b.order)) {
      if (!map.has(s.exerciseId)) {
        map.set(s.exerciseId, [])
        firstOrder.set(s.exerciseId, s.order)
      }
      map.get(s.exerciseId)!.push(s)
    }
    return [...map.entries()].sort(
      (a, b) => (firstOrder.get(a[0]) ?? 0) - (firstOrder.get(b[0]) ?? 0),
    )
  }, [sets])

  const exerciseIds = groups.map((g) => g[0])
  const previous = usePreviousPerformance(workout, exerciseIds)

  const totalSets = sets?.length ?? 0
  const doneSets = sets?.filter((s) => s.done).length ?? 0

  async function onAddExercise(exerciseId: string) {
    if (id) await addExerciseFromHistory(id, exerciseId)
  }

  async function onToggleDone(set: SetEntry) {
    await toggleSetDone(set.id)
  }

  async function finish() {
    if (id) await finishWorkout(id)
    navigate('/workouts')
  }

  async function remove() {
    if (id) await deleteWorkout(id)
    navigate('/workouts')
  }

  if (workout === null) {
    navigate('/workouts')
    return null
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-2 px-3 py-2">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate('/workouts')} aria-label="Back">
            <ChevronLeft />
          </Button>
          <input
            value={workout?.name ?? ''}
            placeholder="Workout"
            onChange={(e) => id && updateWorkout(id, { name: e.target.value })}
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-muted-foreground"
          />
          <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
            {doneSets}/{totalSets}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={() => setMenuOpen(true)} aria-label="Options">
            <MoreVertical />
          </Button>
          <Button size="sm" onClick={finish} disabled={!workout?.finishedAt && totalSets === 0}>
            {workout?.finishedAt ? 'Done' : 'Finish'}
          </Button>
        </div>
      </header>

      <main className="flex-1 space-y-4 px-3 pb-40 pt-3">
        {workout && (
          <p className="text-[11px] text-muted-foreground">{relativeDay(workout.date)}</p>
        )}

        {groups.length === 0 && (
          <div className="rounded-lg border border-dashed border-border py-12 text-center">
            <p className="text-sm text-muted-foreground">No exercises yet.</p>
          </div>
        )}

        {groups.map(([exerciseId, exSets]) => {
          const ex = exMap.get(exerciseId)
          if (!ex) return null
          return (
            <ExerciseBlock
              key={exerciseId}
              exercise={ex}
              sets={exSets}
              previous={previous.get(exerciseId) ?? []}
              unit={settings.weightUnit}
              onToggleDone={onToggleDone}
              onStartRest={timer.start}
              restActive={timer.running}
            />
          )
        })}

        <Button variant="outline" className="w-full" onClick={() => setPickerOpen(true)}>
          <Plus /> Add exercise
        </Button>
      </main>

      {timer.running && <RestTimerBar remaining={timer.remaining} onStop={timer.stop} onAdd={timer.add} />}

      <ExercisePicker open={pickerOpen} onOpenChange={setPickerOpen} onSelect={onAddExercise} />

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Workout options</SheetTitle>
          </SheetHeader>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setMenuOpen(false)
                setPlateOpen(true)
              }}
            >
              <Calculator /> Plate calculator
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => {
                if (confirm('Delete this workout and all its sets?')) remove()
              }}
            >
              <Trash2 /> Delete workout
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <PlateCalculator open={plateOpen} onOpenChange={setPlateOpen} unit={settings.weightUnit} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Exercise block
// ---------------------------------------------------------------------------

function ExerciseBlock({
  exercise,
  sets,
  previous,
  unit,
  onToggleDone,
  onStartRest,
  restActive,
}: {
  exercise: Exercise
  sets: SetEntry[]
  previous: SetEntry[]
  unit: 'kg' | 'lb'
  onToggleDone: (s: SetEntry) => void
  onStartRest: (seconds: number) => void
  restActive: boolean
}) {
  const isCardio = exercise.type === 'cardio'
  const isDuration = exercise.type === 'duration'
  const restSec = suggestedRestSec(exercise)

  // Add set duplicating last values for quick logging.
  async function add() {
    const last = sets.at(-1)
    if (!last) return
    await addSet(last.workoutId, exercise.id, {
      weight: last?.weight,
      reps: last?.reps,
      durationSec: last?.durationSec,
      distanceM: last?.distanceM,
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border p-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{exercise.name}</div>
          <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {exercise.primaryMuscles.map(muscleLabel).join(', ') || 'Cardio'}
          </div>
        </div>
      </div>

      {previous.length > 0 && (
        <div className="border-b border-border px-3 py-1.5 text-[11px] text-muted-foreground">
          <span className="uppercase tracking-wider">Last:</span>{' '}
          {previous
            .filter((s) => s.done)
            .map((s) => summarizeSet(s, unit, exercise))
            .join(', ') || '—'}
        </div>
      )}

      <div className="divide-y divide-border">
        {sets.map((s, i) => (
          <SetRow
            key={s.id}
            set={s}
            index={i + 1}
            unit={unit}
            isCardio={isCardio}
            isDuration={isDuration}
            onToggleDone={() => onToggleDone(s)}
          />
        ))}
      </div>

      <div className="flex gap-2 p-2">
        <Button variant="ghost" size="sm" className="flex-1" onClick={add}>
          <Plus /> Add set
        </Button>
        {!isCardio && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onStartRest(restSec)}
            disabled={restActive}
            title={`Suggested rest for ${exercise.name}`}
          >
            <Timer /> Rest {fmtRest(restSec)}
          </Button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Set row
// ---------------------------------------------------------------------------

function SetRow({
  set,
  index,
  unit,
  isCardio,
  isDuration,
  onToggleDone,
}: {
  set: SetEntry
  index: number
  unit: 'kg' | 'lb'
  isCardio: boolean
  isDuration: boolean
  onToggleDone: () => void
}) {
  return (
    <div className={cn('flex items-center gap-2 px-3 py-2', set.done && 'bg-success/5')}>
      <span className="w-5 shrink-0 text-center text-xs text-muted-foreground tabular-nums">{index}</span>

      {isCardio ? (
        <>
          <NumField
            value={set.distanceM != null ? set.distanceM / 1000 : undefined}
            placeholder="km"
            step="0.1"
            onCommit={(v) => updateSet(set.id, { distanceM: v == null ? undefined : v * 1000 })}
          />
          <NumField
            value={set.durationSec != null ? Math.round(set.durationSec / 60) : undefined}
            placeholder="min"
            onCommit={(v) => updateSet(set.id, { durationSec: v == null ? undefined : v * 60 })}
          />
        </>
      ) : isDuration ? (
        <NumField
          value={set.durationSec}
          placeholder="seconds"
          onCommit={(v) => updateSet(set.id, { durationSec: v })}
          className="flex-1"
        />
      ) : (
        <>
          <NumField
            value={set.weight != null ? round(displayWeight(set.weight, unit)) : undefined}
            placeholder={unit}
            step="0.5"
            onCommit={(v) => updateSet(set.id, { weight: v == null ? undefined : toKg(v, unit) })}
          />
          <span className="text-xs text-muted-foreground">×</span>
          <NumField
            value={set.reps}
            placeholder="reps"
            onCommit={(v) => updateSet(set.id, { reps: v })}
          />
        </>
      )}

      {set.isPR && set.done && (
        <span title="Personal record" className="text-warning">
          <Trophy className="size-4" />
        </span>
      )}

      <button
        onClick={onToggleDone}
        aria-label="Toggle set complete"
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-md border transition-colors',
          set.done
            ? 'border-transparent bg-success text-success-foreground'
            : 'border-border text-muted-foreground active:bg-accent',
        )}
      >
        <Check className="size-4" />
      </button>

      <button
        onClick={() => deleteSet(set.id)}
        aria-label="Delete set"
        className="shrink-0 p-1 text-muted-foreground/60 transition-colors active:text-destructive"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

function NumField({
  value,
  placeholder,
  step,
  className,
  onCommit,
}: {
  value: number | undefined
  placeholder?: string
  step?: string
  className?: string
  onCommit: (v: number | undefined) => void
}) {
  return (
    <Input
      type="number"
      inputMode="decimal"
      step={step}
      defaultValue={value ?? ''}
      placeholder={placeholder}
      onChange={(e) => {
        const raw = e.target.value
        onCommit(raw === '' ? undefined : parseFloat(raw))
      }}
      className={cn('h-9 min-w-0 flex-1 px-2 text-center', className)}
    />
  )
}

// ---------------------------------------------------------------------------
// Rest timer bar
// ---------------------------------------------------------------------------

function RestTimerBar({
  remaining,
  onStop,
  onAdd,
}: {
  remaining: number
  onStop: () => void
  onAdd: (s: number) => void
}) {
  const mm = Math.floor(remaining / 60)
  const ss = remaining % 60
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-lg px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-2 shadow-lg">
        <Timer className="ml-1 size-4 text-primary" />
        <span className="text-lg font-semibold tabular-nums">
          {mm}:{String(ss).padStart(2, '0')}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => onAdd(15)}>
            +15s
          </Button>
          <Button variant="outline" size="sm" onClick={onStop}>
            Skip
          </Button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function summarizeSet(s: SetEntry, unit: 'kg' | 'lb', ex: Exercise): string {
  if (ex.type === 'cardio') {
    const km = s.distanceM ? `${(s.distanceM / 1000).toFixed(1)}km` : ''
    const min = s.durationSec ? `${Math.round(s.durationSec / 60)}min` : ''
    return [km, min].filter(Boolean).join(' ') || '—'
  }
  if (ex.type === 'duration') return s.durationSec ? `${s.durationSec}s` : '—'
  const w = s.weight != null ? round(displayWeight(s.weight, unit)) : null
  if (w != null && s.reps != null) return `${w}${unit}×${s.reps}`
  if (s.reps != null) return `${s.reps} reps`
  return '—'
}

function round(n: number): number {
  return Math.round(n * 10) / 10
}

// Most recent earlier workout's sets for each exercise, for "Last:" hints.
function usePreviousPerformance(workout: Workout | undefined, exerciseIds: string[]) {
  return (
    useLiveQuery(async () => {
      const map = new Map<string, SetEntry[]>()
      if (!workout) return map
      for (const exId of exerciseIds) {
        const all = await db.sets.where('exerciseId').equals(exId).toArray()
        const otherIds = [...new Set(all.map((s) => s.workoutId))].filter((w) => w !== workout.id)
        if (otherIds.length === 0) continue
        const ws = ((await db.workouts.bulkGet(otherIds)).filter(Boolean) as Workout[]).filter(
          (w) => w.startedAt < workout.startedAt,
        )
        const prior = ws.sort((a, b) => b.startedAt - a.startedAt)[0]
        if (!prior) continue
        map.set(
          exId,
          all.filter((s) => s.workoutId === prior.id).sort((a, b) => a.order - b.order),
        )
      }
      return map
    }, [workout?.id, exerciseIds.join(',')]) ?? new Map<string, SetEntry[]>()
  )
}
