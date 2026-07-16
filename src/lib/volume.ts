import type { Exercise, SetEntry } from './db'
import { MUSCLE_LIST, type MuscleGroup } from './muscles'

const COUNTED_TYPES = new Set<Exercise['type']>(['weight_reps', 'bodyweight', 'duration'])

export type MuscleVolume = Record<MuscleGroup, number>

function emptyVolume(): MuscleVolume {
  return MUSCLE_LIST.reduce((acc, m) => {
    acc[m.id] = 0
    return acc
  }, {} as MuscleVolume)
}

/**
 * Weekly "hard set" volume per muscle group.
 * Primary muscle = 1.0 set, secondary = 0.5 set. Only completed sets of
 * resistance exercises count (cardio is excluded).
 */
export function computeMuscleVolume(
  sets: SetEntry[],
  exerciseById: Map<string, Exercise>,
): MuscleVolume {
  const vol = emptyVolume()
  for (const s of sets) {
    if (!s.done) continue
    const ex = exerciseById.get(s.exerciseId)
    if (!ex || !COUNTED_TYPES.has(ex.type)) continue
    for (const m of ex.primaryMuscles) vol[m] += 1
    for (const m of ex.secondaryMuscles) vol[m] += 0.5
  }
  return vol
}

export function totalSets(vol: MuscleVolume): number {
  return Object.values(vol).reduce((a, b) => a + b, 0)
}
