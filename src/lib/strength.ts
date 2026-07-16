import type { SetEntry } from './db'

/** Epley estimated one-rep max. Returns 0 when inputs are incomplete. */
export function est1RM(weight?: number, reps?: number): number {
  if (!weight || !reps || reps <= 0) return 0
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

export function set1RM(s: SetEntry): number {
  return est1RM(s.weight, s.reps)
}

/** Best estimated 1RM across a list of sets. */
export function bestE1RM(sets: SetEntry[]): number {
  return sets.reduce((max, s) => Math.max(max, set1RM(s)), 0)
}

/** Total volume load (weight × reps) across sets. */
export function volumeLoad(sets: SetEntry[]): number {
  return sets.reduce((sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0)
}

const KG_PER_LB = 0.45359237

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB
}
export function lbToKg(lb: number): number {
  return lb * KG_PER_LB
}

/** Convert a canonical-kg value into the user's unit for display. */
export function displayWeight(kg: number | undefined, unit: 'kg' | 'lb'): number {
  if (kg == null) return 0
  return unit === 'kg' ? kg : kgToLb(kg)
}

/** Convert a user-entered value (in their unit) back to canonical kg. */
export function toKg(value: number, unit: 'kg' | 'lb'): number {
  return unit === 'kg' ? value : lbToKg(value)
}
