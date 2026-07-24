import { useLiveQuery } from 'dexie-react-hooks'
import { addWeeks } from 'date-fns'
import { db } from '@/lib/db'
import { computeMuscleVolume, totalSets, type MuscleVolume } from '@/lib/volume'
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

export interface WeekVolumePoint {
  /** ISO date of the week's Monday. */
  weekStart: string
  sets: number
}

/** Total weekly set volume for the last `weeks` weeks (oldest first). */
export function useVolumeTrend(weeks = 12): WeekVolumePoint[] | undefined {
  return useLiveQuery(async () => {
    const exercises = await db.exercises.toArray()
    const exMap = new Map(exercises.map((e) => [e.id, e]))
    const now = new Date()
    const out: WeekVolumePoint[] = []
    for (let i = weeks - 1; i >= 0; i--) {
      const { start, end } = weekBounds(addWeeks(now, -i))
      const workouts = await db.workouts.where('date').between(start, end, true, true).toArray()
      const ids = workouts.map((w) => w.id)
      const sets = ids.length ? await db.sets.where('workoutId').anyOf(ids).toArray() : []
      out.push({ weekStart: start, sets: Math.round(totalSets(computeMuscleVolume(sets, exMap))) })
    }
    return out
  }, [weeks])
}
