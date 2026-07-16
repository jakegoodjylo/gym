import type { Exercise } from './db'
import type { MuscleGroup } from './muscles'

// Large muscle groups / heavy compounds warrant longer rest.
const BIG_MUSCLES = new Set<MuscleGroup>(['quads', 'hamstrings', 'glutes', 'chest', 'lats', 'lower_back'])

/**
 * Suggested rest between sets, in seconds, inferred from the exercise:
 *  - heavy compound (multi-joint, hits a large muscle)  → 3:00
 *  - other compound                                     → 2:00
 *  - isolation                                          → 1:30
 *  - timed / cardio work                                → short
 */
export function suggestedRestSec(ex: Exercise): number {
  if (ex.type === 'cardio') return 60
  if (ex.type === 'duration') return 45

  const totalMuscles = ex.primaryMuscles.length + ex.secondaryMuscles.length
  const isCompound = ex.primaryMuscles.length >= 2 || totalMuscles >= 3
  const hitsBig = ex.primaryMuscles.some((m) => BIG_MUSCLES.has(m))

  if (hitsBig && isCompound) return 180
  if (isCompound) return 120
  return 90
}

export function fmtRest(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
