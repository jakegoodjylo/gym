// Muscle taxonomy + weekly volume landmarks used for the "sets per muscle group"
// analytics. Weekly *hard sets* (taken within a few reps of failure) are the main
// volume driver of hypertrophy, with strongly diminishing returns past the sweet
// spot. Evidence (Schoenfeld/Krieger dose-response meta-analyses; Baz-Valle 2022
// review; Pelland 2024 volume meta-regression) supports a broad ~10–18 set/week
// optimal window for most muscles; more can add a little growth but is recovery-
// limited and individual. Per-muscle numbers below are calibrated to that window
// and adjusted down for small / indirectly-trained groups — they are heuristics
// (±a few sets), not measured values.
//   mev = minimum effective weekly sets (below = flagged under-trained)
//   mav = top of the optimal window (above = "high": diminishing returns)

export type MuscleGroup =
  | 'chest'
  | 'front_delts'
  | 'side_delts'
  | 'rear_delts'
  | 'lats'
  | 'traps'
  | 'lower_back'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'abs'
  | 'obliques'

export interface MuscleMeta {
  id: MuscleGroup
  label: string
  /** Broad region for grouping in the UI. */
  region: 'push' | 'pull' | 'legs' | 'core'
  /** Minimum effective weekly sets (below this = flagged as under-trained). */
  mev: number
  /** Top of the productive weekly set range. */
  mav: number
}

export const MUSCLES: Record<MuscleGroup, MuscleMeta> = {
  chest: { id: 'chest', label: 'Chest', region: 'push', mev: 8, mav: 18 },
  front_delts: { id: 'front_delts', label: 'Front Delts', region: 'push', mev: 6, mav: 12 },
  side_delts: { id: 'side_delts', label: 'Side Delts', region: 'push', mev: 8, mav: 18 },
  rear_delts: { id: 'rear_delts', label: 'Rear Delts', region: 'pull', mev: 6, mav: 14 },
  triceps: { id: 'triceps', label: 'Triceps', region: 'push', mev: 8, mav: 16 },
  lats: { id: 'lats', label: 'Lats', region: 'pull', mev: 10, mav: 18 },
  traps: { id: 'traps', label: 'Upper Back / Traps', region: 'pull', mev: 8, mav: 16 },
  lower_back: { id: 'lower_back', label: 'Lower Back', region: 'pull', mev: 4, mav: 10 },
  biceps: { id: 'biceps', label: 'Biceps', region: 'pull', mev: 8, mav: 16 },
  forearms: { id: 'forearms', label: 'Forearms', region: 'pull', mev: 5, mav: 12 },
  quads: { id: 'quads', label: 'Quads', region: 'legs', mev: 8, mav: 18 },
  hamstrings: { id: 'hamstrings', label: 'Hamstrings', region: 'legs', mev: 8, mav: 16 },
  glutes: { id: 'glutes', label: 'Glutes', region: 'legs', mev: 6, mav: 14 },
  calves: { id: 'calves', label: 'Calves', region: 'legs', mev: 8, mav: 16 },
  abs: { id: 'abs', label: 'Abs', region: 'core', mev: 6, mav: 16 },
  obliques: { id: 'obliques', label: 'Obliques', region: 'core', mev: 4, mav: 12 },
}

export const MUSCLE_LIST: MuscleMeta[] = Object.values(MUSCLES)

export const REGIONS: { id: MuscleMeta['region']; label: string }[] = [
  { id: 'push', label: 'Push' },
  { id: 'pull', label: 'Pull' },
  { id: 'legs', label: 'Legs' },
  { id: 'core', label: 'Core' },
]

export function muscleLabel(id: MuscleGroup): string {
  return MUSCLES[id]?.label ?? id
}

export type VolumeStatus = 'none' | 'under' | 'optimal' | 'high'

/** Classify a weekly set count for a muscle against its landmarks. */
export function volumeStatus(muscle: MuscleGroup, sets: number): VolumeStatus {
  const m = MUSCLES[muscle]
  if (sets <= 0) return 'none'
  if (sets < m.mev) return 'under'
  if (sets <= m.mav) return 'optimal'
  return 'high'
}
