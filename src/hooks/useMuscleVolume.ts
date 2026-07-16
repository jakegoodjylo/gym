import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { computeMuscleVolume, type MuscleVolume } from '@/lib/volume'
import { weekBounds } from '@/lib/date'

/** Live muscle-group set volume for the given inclusive date range. */
export function useMuscleVolume(startISO: string, endISO: string): MuscleVolume | undefined {
  return useLiveQuery(async () => {
    const workouts = await db.workouts.where('date').between(startISO, endISO, true, true).toArray()
    const ids = workouts.map((w) => w.id)
    const sets = ids.length ? await db.sets.where('workoutId').anyOf(ids).toArray() : []
    const exercises = await db.exercises.toArray()
    const exMap = new Map(exercises.map((e) => [e.id, e]))
    return computeMuscleVolume(sets, exMap)
  }, [startISO, endISO])
}

export function useCurrentWeekVolume(): MuscleVolume | undefined {
  const { start, end } = weekBounds()
  return useMuscleVolume(start, end)
}
