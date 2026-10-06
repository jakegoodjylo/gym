import type { Exercise, SetEntry } from './db'
import { isHeavyCompound } from './rest'
import { toKg } from './strength'

type SetValues = Pick<SetEntry, 'weight' | 'reps' | 'durationSec' | 'distanceM'>

export interface NextSession {
  /** Values to pre-fill, one per set. */
  sets: SetValues[]
  /** What changed vs last time ("+2.5 kg", "+1 rep"), or null when repeating. */
  hint: string | null
}

/** Rep range for double progression: heavy compounds 5–8, everything else 8–12. */
function repRange(ex: Exercise): [number, number] {
  return isHeavyCompound(ex) ? [5, 8] : [8, 12]
}

/** Smallest sensible jump, in the user's display unit. */
function increment(ex: Exercise, unit: 'kg' | 'lb'): number {
  if (unit === 'lb') return 5
  return ex.equipment === 'dumbbell' ? 2 : 2.5
}

/**
 * Plan this session's sets from last session's, using double progression:
 * add a rep per set until every set reaches the top of the rep range, then add
 * weight and drop back to the bottom. Only progresses when every set last time
 * was completed — otherwise it repeats the same numbers. Timed and cardio work
 * is always repeated as-is.
 */
export function planNextSession(ex: Exercise, last: SetEntry[], unit: 'kg' | 'lb'): NextSession {
  const usable = last.filter((s) => s.weight != null || s.reps != null || s.durationSec != null || s.distanceM != null)
  const repeat: NextSession = {
    sets: usable.map(({ weight, reps, durationSec, distanceM }) => ({ weight, reps, durationSec, distanceM })),
    hint: null,
  }

  const repBased = ex.type === 'weight_reps' || ex.type === 'bodyweight'
  if (!repBased || usable.length === 0 || usable.some((s) => !s.done || s.reps == null)) return repeat

  const [bottom, top] = repRange(ex)
  const weighted = usable.every((s) => s.weight != null && s.weight > 0)

  if (weighted && usable.every((s) => s.reps! >= top)) {
    const inc = increment(ex, unit)
    return {
      sets: usable.map((s) => ({ weight: s.weight! + toKg(inc, unit), reps: bottom })),
      hint: `+${inc} ${unit}`,
    }
  }

  return {
    sets: usable.map((s) => ({ weight: s.weight, reps: weighted ? Math.min(top, s.reps! + 1) : s.reps! + 1 })),
    hint: '+1 rep',
  }
}
