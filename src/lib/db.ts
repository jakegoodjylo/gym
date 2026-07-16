import Dexie, { type Table } from 'dexie'
import type { MuscleGroup } from './muscles'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'kettlebell'
  | 'band'
  | 'other'

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  machine: 'Machine',
  cable: 'Cable',
  bodyweight: 'Bodyweight',
  kettlebell: 'Kettlebell',
  band: 'Band',
  other: 'Other',
}

/**
 * How an exercise is logged & measured:
 *  - weight_reps: external load × reps (most lifts)
 *  - bodyweight:  reps, optional added weight (pull-ups, dips, push-ups)
 *  - duration:    time under tension in seconds (planks, holds)
 *  - cardio:      distance + duration (run, row, bike)
 */
export type ExerciseType = 'weight_reps' | 'bodyweight' | 'duration' | 'cardio'

export interface Exercise {
  id: string
  name: string
  equipment: Equipment
  type: ExerciseType
  primaryMuscles: MuscleGroup[]
  secondaryMuscles: MuscleGroup[]
  /** Optional cue/instructions. */
  notes?: string
  isCustom?: boolean
  archived?: boolean
  createdAt: number
  updatedAt: number
}

export interface Workout {
  id: string
  /** Local calendar day, yyyy-MM-dd. */
  date: string
  name?: string
  notes?: string
  startedAt: number
  finishedAt?: number
  createdAt: number
  updatedAt: number
}

export interface SetEntry {
  id: string
  workoutId: string
  exerciseId: string
  /** Ordering within the workout (per exercise blocks preserve insertion order). */
  order: number
  weight?: number // kg (canonical storage unit)
  reps?: number
  durationSec?: number
  distanceM?: number
  done: boolean
  /** True when this set beat the previous best est-1RM for the exercise. */
  isPR?: boolean
  createdAt: number
  updatedAt: number
}

export interface Habit {
  id: string
  name: string
  emoji?: string
  /** One of the chart hue tokens: 1..5, or 'neutral'. */
  color: string
  order: number
  archived?: boolean
  createdAt: number
  updatedAt: number
}

/** Presence of a log = the (binary) habit was done that day. */
export interface HabitLog {
  id: string // `${habitId}_${date}`
  habitId: string
  date: string // yyyy-MM-dd
  createdAt: number
}

export interface BodyMetric {
  id: string
  date: string // yyyy-MM-dd
  /** 'weight' | 'bodyfat' | 'waist' | ... (extensible) */
  type: string
  value: number
  createdAt: number
  updatedAt: number
}

export interface ProgressPhoto {
  id: string
  date: string // yyyy-MM-dd
  blob: Blob
  note?: string
  createdAt: number
}

export interface Settings {
  id: 'app'
  weightUnit: 'kg' | 'lb'
  theme: 'light' | 'dark' | 'system'
  restTimerSec: number
  /** Target value per metric type (canonical units: kg for weight, raw otherwise). */
  metricGoals?: Record<string, number>
  seededAt?: number
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

export class GymDB extends Dexie {
  exercises!: Table<Exercise, string>
  workouts!: Table<Workout, string>
  sets!: Table<SetEntry, string>
  habits!: Table<Habit, string>
  habitLogs!: Table<HabitLog, string>
  metrics!: Table<BodyMetric, string>
  photos!: Table<ProgressPhoto, string>
  settings!: Table<Settings, string>

  constructor() {
    super('forge')
    this.version(1).stores({
      exercises: 'id, name, equipment, type, archived, *primaryMuscles',
      workouts: 'id, date, startedAt, finishedAt',
      sets: 'id, workoutId, exerciseId, [workoutId+order]',
      habits: 'id, order, archived',
      habitLogs: 'id, habitId, date, [habitId+date]',
      metrics: 'id, date, type, [type+date]',
      photos: 'id, date',
      settings: 'id',
    })
  }
}

export const db = new GymDB()

export const DEFAULT_SETTINGS: Settings = {
  id: 'app',
  weightUnit: 'kg',
  theme: 'system',
  restTimerSec: 120,
}
