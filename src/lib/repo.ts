import {
  db,
  DEFAULT_SETTINGS,
  type Exercise,
  type Habit,
  type Routine,
  type SetEntry,
  type Settings,
  type Workout,
} from './db'
import { PRESET_EXERCISES } from '@/data/exercises'
import { uid } from './utils'
import { todayISO } from './date'
import { set1RM } from './strength'

const now = () => Date.now()

// ---------------------------------------------------------------------------
// Seeding & settings
// ---------------------------------------------------------------------------

export async function ensureSeeded(): Promise<void> {
  const existing = await db.settings.get('app')
  if (!existing) {
    await db.settings.put({ ...DEFAULT_SETTINGS, seededAt: now() })
  }
  const count = await db.exercises.count()
  if (count === 0) {
    const t = now()
    await db.exercises.bulkPut(
      PRESET_EXERCISES.map((e) => ({ ...e, createdAt: t, updatedAt: t })),
    )
  }
}

export async function getSettings(): Promise<Settings> {
  return (await db.settings.get('app')) ?? DEFAULT_SETTINGS
}

export async function updateSettings(patch: Partial<Omit<Settings, 'id'>>): Promise<void> {
  const current = await getSettings()
  await db.settings.put({ ...current, ...patch, id: 'app' })
}

// ---------------------------------------------------------------------------
// Exercises
// ---------------------------------------------------------------------------

export async function addCustomExercise(
  data: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt' | 'isCustom'>,
): Promise<string> {
  const t = now()
  const id = uid()
  await db.exercises.put({ ...data, id, isCustom: true, createdAt: t, updatedAt: t })
  return id
}

export async function updateExercise(id: string, patch: Partial<Exercise>): Promise<void> {
  await db.exercises.update(id, { ...patch, updatedAt: now() })
}

export async function exerciseMap(): Promise<Map<string, Exercise>> {
  const all = await db.exercises.toArray()
  return new Map(all.map((e) => [e.id, e]))
}

// ---------------------------------------------------------------------------
// Workouts & sets
// ---------------------------------------------------------------------------

export async function createWorkout(name?: string, date = todayISO()): Promise<string> {
  const t = now()
  const id = uid()
  const workout: Workout = {
    id,
    date,
    name,
    startedAt: t,
    createdAt: t,
    updatedAt: t,
  }
  await db.workouts.put(workout)
  return id
}

export async function updateWorkout(id: string, patch: Partial<Workout>): Promise<void> {
  await db.workouts.update(id, { ...patch, updatedAt: now() })
}

/**
 * Clone the most recent workout that has sets into a brand-new session
 * (same name, sets pre-filled but un-completed). Returns the new workout id,
 * or null if there's no prior workout to repeat.
 */
export async function repeatLastWorkout(): Promise<string | null> {
  const workouts = await db.workouts.orderBy('startedAt').reverse().toArray()
  let source: Workout | undefined
  for (const w of workouts) {
    if ((await db.sets.where('workoutId').equals(w.id).count()) > 0) {
      source = w
      break
    }
  }
  if (!source) return null

  const srcSets = (await db.sets.where('workoutId').equals(source.id).toArray()).sort(
    (a, b) => a.order - b.order,
  )
  const newId = await createWorkout(source.name)
  for (const s of srcSets) {
    await addSet(newId, s.exerciseId, {
      weight: s.weight,
      reps: s.reps,
      durationSec: s.durationSec,
      distanceM: s.distanceM,
    })
  }
  return newId
}

export async function finishWorkout(id: string): Promise<void> {
  await db.workouts.update(id, { finishedAt: now(), updatedAt: now() })
}

export async function deleteWorkout(id: string): Promise<void> {
  await db.transaction('rw', db.workouts, db.sets, async () => {
    await db.sets.where('workoutId').equals(id).delete()
    await db.workouts.delete(id)
  })
}

/** Best est-1RM across all completed sets for an exercise, optionally excluding a workout. */
export async function bestE1RMForExercise(exerciseId: string, excludeWorkoutId?: string): Promise<number> {
  const sets = await db.sets.where('exerciseId').equals(exerciseId).toArray()
  let best = 0
  for (const s of sets) {
    if (!s.done) continue
    if (excludeWorkoutId && s.workoutId === excludeWorkoutId) continue
    best = Math.max(best, set1RM(s))
  }
  return best
}

export async function addSet(
  workoutId: string,
  exerciseId: string,
  data: Partial<Pick<SetEntry, 'weight' | 'reps' | 'durationSec' | 'distanceM' | 'done'>> = {},
): Promise<string> {
  const t = now()
  const id = uid()
  const count = await db.sets.where('workoutId').equals(workoutId).count()
  const set: SetEntry = {
    id,
    workoutId,
    exerciseId,
    order: count,
    done: false,
    createdAt: t,
    updatedAt: t,
    ...data,
  }
  await db.sets.put(set)
  if (set.done) await recomputePR(set)
  return id
}

/** Sets for an exercise from the most recent earlier workout (its "last logged" performance). */
export async function lastLoggedSets(exerciseId: string, beforeWorkoutId?: string): Promise<SetEntry[]> {
  const all = await db.sets.where('exerciseId').equals(exerciseId).toArray()
  const workoutIds = [...new Set(all.map((s) => s.workoutId))].filter((w) => w !== beforeWorkoutId)
  if (workoutIds.length === 0) return []

  const current = beforeWorkoutId ? await db.workouts.get(beforeWorkoutId) : undefined
  const candidates = ((await db.workouts.bulkGet(workoutIds)).filter(Boolean) as Workout[]).filter(
    (w) => !current || w.startedAt < current.startedAt,
  )
  const prior = candidates.sort((a, b) => b.startedAt - a.startedAt)[0]
  if (!prior) return []
  return all.filter((s) => s.workoutId === prior.id).sort((a, b) => a.order - b.order)
}

/**
 * Add an exercise to a workout, pre-populating its sets from the last time it
 * was logged (values carried over, left un-completed). Falls back to one empty
 * set when there's no history.
 */
export async function addExerciseFromHistory(workoutId: string, exerciseId: string): Promise<void> {
  const template = await lastLoggedSets(exerciseId, workoutId)
  const usable = template.filter((s) => s.weight != null || s.reps != null || s.durationSec != null || s.distanceM != null)

  if (usable.length === 0) {
    await addSet(workoutId, exerciseId)
    return
  }
  for (const t of usable) {
    await addSet(workoutId, exerciseId, {
      weight: t.weight,
      reps: t.reps,
      durationSec: t.durationSec,
      distanceM: t.distanceM,
    })
  }
}

export async function updateSet(id: string, patch: Partial<SetEntry>): Promise<void> {
  await db.sets.update(id, { ...patch, updatedAt: now() })
  const updated = await db.sets.get(id)
  if (updated?.done) await recomputePR(updated)
}

export async function toggleSetDone(id: string): Promise<void> {
  const s = await db.sets.get(id)
  if (!s) return
  await updateSet(id, { done: !s.done })
}

export async function deleteSet(id: string): Promise<void> {
  await db.sets.delete(id)
}

/** Flag a completed set as a PR when it beats the prior best est-1RM for its exercise. */
async function recomputePR(set: SetEntry): Promise<void> {
  const e1rm = set1RM(set)
  if (e1rm <= 0) return
  const prior = await bestE1RMForExercise(set.exerciseId, set.workoutId)
  const isPR = e1rm > prior + 1e-6
  if (isPR !== !!set.isPR) {
    await db.sets.update(set.id, { isPR })
  }
}

// ---------------------------------------------------------------------------
// Routines (workout templates)
// ---------------------------------------------------------------------------

export async function createRoutine(name: string, exerciseIds: string[] = []): Promise<string> {
  const t = now()
  const id = uid()
  const max = await db.routines.orderBy('order').last()
  await db.routines.put({
    id,
    name,
    exerciseIds,
    order: (max?.order ?? -1) + 1,
    createdAt: t,
    updatedAt: t,
  })
  return id
}

export async function updateRoutine(id: string, patch: Partial<Routine>): Promise<void> {
  await db.routines.update(id, { ...patch, updatedAt: now() })
}

export async function deleteRoutine(id: string): Promise<void> {
  await db.routines.delete(id)
}

/** Start a new workout from a routine, pre-filling each exercise from history. */
export async function startWorkoutFromRoutine(routineId: string): Promise<string | null> {
  const routine = await db.routines.get(routineId)
  if (!routine) return null
  const newId = await createWorkout(routine.name)
  for (const exId of routine.exerciseIds) {
    await addExerciseFromHistory(newId, exId)
  }
  return newId
}

/** Snapshot a workout's exercises (in order, de-duplicated) as a new routine. */
export async function saveWorkoutAsRoutine(workoutId: string, name: string): Promise<string> {
  const sets = (await db.sets.where('workoutId').equals(workoutId).toArray()).sort(
    (a, b) => a.order - b.order,
  )
  const seen = new Set<string>()
  const exerciseIds: string[] = []
  for (const s of sets) {
    if (!seen.has(s.exerciseId)) {
      seen.add(s.exerciseId)
      exerciseIds.push(s.exerciseId)
    }
  }
  return createRoutine(name, exerciseIds)
}

// ---------------------------------------------------------------------------
// Habits
// ---------------------------------------------------------------------------

export async function addHabit(name: string, emoji?: string, color = '1'): Promise<string> {
  const t = now()
  const id = uid()
  const max = await db.habits.orderBy('order').last()
  await db.habits.put({
    id,
    name,
    emoji,
    color,
    order: (max?.order ?? -1) + 1,
    createdAt: t,
    updatedAt: t,
  })
  return id
}

export async function updateHabit(id: string, patch: Partial<Habit>): Promise<void> {
  await db.habits.update(id, { ...patch, updatedAt: now() })
}

export async function archiveHabit(id: string, archived = true): Promise<void> {
  await updateHabit(id, { archived })
}

export async function deleteHabit(id: string): Promise<void> {
  await db.transaction('rw', db.habits, db.habitLogs, async () => {
    await db.habitLogs.where('habitId').equals(id).delete()
    await db.habits.delete(id)
  })
}

export async function toggleHabit(habitId: string, date: string): Promise<void> {
  const id = `${habitId}_${date}`
  const existing = await db.habitLogs.get(id)
  if (existing) {
    await db.habitLogs.delete(id)
  } else {
    await db.habitLogs.put({ id, habitId, date, createdAt: now() })
  }
}

// ---------------------------------------------------------------------------
// Body metrics & photos
// ---------------------------------------------------------------------------

export async function addMetric(type: string, value: number, date = todayISO()): Promise<string> {
  const t = now()
  const id = `${type}_${date}`
  await db.metrics.put({ id, type, value, date, createdAt: t, updatedAt: t })
  return id
}

export async function deleteMetric(id: string): Promise<void> {
  await db.metrics.delete(id)
}

export async function addPhoto(blob: Blob, note?: string, date = todayISO()): Promise<string> {
  const id = uid()
  await db.photos.put({ id, blob, note, date, createdAt: now() })
  return id
}

export async function deletePhoto(id: string): Promise<void> {
  await db.photos.delete(id)
}
