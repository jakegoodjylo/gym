import type { Exercise } from '@/lib/db'

export type SeedExercise = Omit<Exercise, 'createdAt' | 'updatedAt'>

/**
 * Preset exercise library. Each entry is tagged with primary + secondary
 * muscles, which drives the weekly volume / "missing muscle groups" analytics.
 * Primary muscles count as 1 set, secondary as 0.5 set (see lib/volume).
 */
export const PRESET_EXERCISES: SeedExercise[] = [
  // ---- Chest ----
  { id: 'bench-press', name: 'Barbell Bench Press', equipment: 'barbell', type: 'weight_reps', primaryMuscles: ['chest', 'front_delts'], secondaryMuscles: ['triceps'] },
  { id: 'incline-bench-press', name: 'Incline Barbell Bench Press', equipment: 'barbell', type: 'weight_reps', primaryMuscles: ['chest', 'front_delts'], secondaryMuscles: ['triceps'] },
  { id: 'db-bench-press', name: 'Dumbbell Bench Press', equipment: 'dumbbell', type: 'weight_reps', primaryMuscles: ['chest', 'front_delts'], secondaryMuscles: ['triceps'] },
  { id: 'incline-db-press', name: 'Incline Dumbbell Press', equipment: 'dumbbell', type: 'weight_reps', primaryMuscles: ['chest', 'front_delts'], secondaryMuscles: ['triceps'] },
  { id: 'db-fly', name: 'Dumbbell Fly', equipment: 'dumbbell', type: 'weight_reps', primaryMuscles: ['chest'], secondaryMuscles: ['front_delts'] },
  { id: 'cable-crossover', name: 'Cable Crossover', equipment: 'cable', type: 'weight_reps', primaryMuscles: ['chest'], secondaryMuscles: ['front_delts'] },
  { id: 'machine-chest-press', name: 'Machine Chest Press', equipment: 'machine', type: 'weight_reps', primaryMuscles: ['chest', 'front_delts'], secondaryMuscles: ['triceps'] },
  { id: 'pec-deck', name: 'Pec Deck', equipment: 'machine', type: 'weight_reps', primaryMuscles: ['chest'], secondaryMuscles: [] },
  { id: 'push-up', name: 'Push-Up', equipment: 'bodyweight', type: 'bodyweight', primaryMuscles: ['chest', 'front_delts'], secondaryMuscles: ['triceps', 'abs'] },
  { id: 'chest-dip', name: 'Chest Dip', equipment: 'bodyweight', type: 'bodyweight', primaryMuscles: ['chest', 'triceps'], secondaryMuscles: ['front_delts'] },

  // ---- Shoulders ----
  { id: 'overhead-press', name: 'Overhead Press', equipment: 'barbell', type: 'weight_reps', primaryMuscles: ['front_delts'], secondaryMuscles: ['side_delts', 'triceps'] },
  { id: 'db-shoulder-press', name: 'Dumbbell Shoulder Press', equipment: 'dumbbell', type: 'weight_reps', primaryMuscles: ['front_delts', 'side_delts'], secondaryMuscles: ['triceps'] },
  { id: 'arnold-press', name: 'Arnold Press', equipment: 'dumbbell', type: 'weight_reps', primaryMuscles: ['front_delts', 'side_delts'], secondaryMuscles: ['triceps'] },
  { id: 'lateral-raise', name: 'Lateral Raise', equipment: 'dumbbell', type: 'weight_reps', primaryMuscles: ['side_delts'], secondaryMuscles: [] },
  { id: 'cable-lateral-raise', name: 'Cable Lateral Raise', equipment: 'cable', type: 'weight_reps', primaryMuscles: ['side_delts'], secondaryMuscles: [] },
  { id: 'rear-delt-fly', name: 'Rear Delt Fly', equipment: 'dumbbell', type: 'weight_reps', primaryMuscles: ['rear_delts'], secondaryMuscles: ['traps'] },
  { id: 'reverse-pec-deck', name: 'Reverse Pec Deck', equipment: 'machine', type: 'weight_reps', primaryMuscles: ['rear_delts'], secondaryMuscles: ['traps'] },
  { id: 'face-pull', name: 'Face Pull', equipment: 'cable', type: 'weight_reps', primaryMuscles: ['rear_delts', 'traps'], secondaryMuscles: ['biceps'] },
  { id: 'upright-row', name: 'Upright Row', equipment: 'barbell', type: 'weight_reps', primaryMuscles: ['side_delts', 'traps'], secondaryMuscles: ['biceps'] },

  // ---- Back ----
  { id: 'deadlift', name: 'Deadlift', equipment: 'barbell', type: 'weight_reps', primaryMuscles: ['lower_back', 'glutes', 'hamstrings'], secondaryMuscles: ['traps', 'quads', 'forearms'] },
  { id: 'pull-up', name: 'Pull-Up', equipment: 'bodyweight', type: 'bodyweight', primaryMuscles: ['lats'], secondaryMuscles: ['biceps', 'traps', 'forearms'] },
  { id: 'chin-up', name: 'Chin-Up', equipment: 'bodyweight', type: 'bodyweight', primaryMuscles: ['lats', 'biceps'], secondaryMuscles: ['traps'] },
  { id: 'lat-pulldown', name: 'Lat Pulldown', equipment: 'cable', type: 'weight_reps', primaryMuscles: ['lats'], secondaryMuscles: ['biceps', 'traps'] },
  { id: 'seated-cable-row', name: 'Seated Cable Row', equipment: 'cable', type: 'weight_reps', primaryMuscles: ['lats', 'traps'], secondaryMuscles: ['biceps', 'rear_delts'] },
  { id: 'barbell-row', name: 'Bent-Over Barbell Row', equipment: 'barbell', type: 'weight_reps', primaryMuscles: ['lats', 'traps'], secondaryMuscles: ['biceps', 'rear_delts', 'lower_back'] },
  { id: 'db-row', name: 'Single-Arm Dumbbell Row', equipment: 'dumbbell', type: 'weight_reps', primaryMuscles: ['lats', 'traps'], secondaryMuscles: ['biceps'] },
  { id: 't-bar-row', name: 'T-Bar Row', equipment: 'barbell', type: 'weight_reps', primaryMuscles: ['lats', 'traps'], secondaryMuscles: ['biceps', 'rear_delts'] },
  { id: 'machine-row', name: 'Machine Row', equipment: 'machine', type: 'weight_reps', primaryMuscles: ['lats', 'traps'], secondaryMuscles: ['biceps'] },
  { id: 'straight-arm-pulldown', name: 'Straight-Arm Pulldown', equipment: 'cable', type: 'weight_reps', primaryMuscles: ['lats'], secondaryMuscles: [] },
  { id: 'shrug', name: 'Shrug', equipment: 'dumbbell', type: 'weight_reps', primaryMuscles: ['traps'], secondaryMuscles: ['forearms'] },
  { id: 'back-extension', name: 'Back Extension', equipment: 'bodyweight', type: 'bodyweight', primaryMuscles: ['lower_back'], secondaryMuscles: ['glutes', 'hamstrings'] },

  // ---- Legs ----
  { id: 'back-squat', name: 'Back Squat', equipment: 'barbell', type: 'weight_reps', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings', 'lower_back'] },
  { id: 'front-squat', name: 'Front Squat', equipment: 'barbell', type: 'weight_reps', primaryMuscles: ['quads'], secondaryMuscles: ['glutes', 'lower_back'] },
  { id: 'leg-press', name: 'Leg Press', equipment: 'machine', type: 'weight_reps', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings'] },
  { id: 'hack-squat', name: 'Hack Squat', equipment: 'machine', type: 'weight_reps', primaryMuscles: ['quads'], secondaryMuscles: ['glutes'] },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', equipment: 'dumbbell', type: 'weight_reps', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings'] },
  { id: 'lunge', name: 'Dumbbell Lunge', equipment: 'dumbbell', type: 'weight_reps', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings'] },
  { id: 'goblet-squat', name: 'Goblet Squat', equipment: 'dumbbell', type: 'weight_reps', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings'] },
  { id: 'leg-extension', name: 'Leg Extension', equipment: 'machine', type: 'weight_reps', primaryMuscles: ['quads'], secondaryMuscles: [] },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', equipment: 'barbell', type: 'weight_reps', primaryMuscles: ['hamstrings', 'glutes'], secondaryMuscles: ['lower_back'] },
  { id: 'leg-curl', name: 'Leg Curl', equipment: 'machine', type: 'weight_reps', primaryMuscles: ['hamstrings'], secondaryMuscles: [] },
  { id: 'hip-thrust', name: 'Barbell Hip Thrust', equipment: 'barbell', type: 'weight_reps', primaryMuscles: ['glutes'], secondaryMuscles: ['hamstrings'] },
  { id: 'glute-bridge', name: 'Glute Bridge', equipment: 'bodyweight', type: 'bodyweight', primaryMuscles: ['glutes'], secondaryMuscles: ['hamstrings'] },
  { id: 'standing-calf-raise', name: 'Standing Calf Raise', equipment: 'machine', type: 'weight_reps', primaryMuscles: ['calves'], secondaryMuscles: [] },
  { id: 'seated-calf-raise', name: 'Seated Calf Raise', equipment: 'machine', type: 'weight_reps', primaryMuscles: ['calves'], secondaryMuscles: [] },

  // ---- Arms ----
  { id: 'barbell-curl', name: 'Barbell Curl', equipment: 'barbell', type: 'weight_reps', primaryMuscles: ['biceps'], secondaryMuscles: ['forearms'] },
  { id: 'db-curl', name: 'Dumbbell Curl', equipment: 'dumbbell', type: 'weight_reps', primaryMuscles: ['biceps'], secondaryMuscles: ['forearms'] },
  { id: 'hammer-curl', name: 'Hammer Curl', equipment: 'dumbbell', type: 'weight_reps', primaryMuscles: ['biceps', 'forearms'], secondaryMuscles: [] },
  { id: 'preacher-curl', name: 'Preacher Curl', equipment: 'barbell', type: 'weight_reps', primaryMuscles: ['biceps'], secondaryMuscles: [] },
  { id: 'cable-curl', name: 'Cable Curl', equipment: 'cable', type: 'weight_reps', primaryMuscles: ['biceps'], secondaryMuscles: [] },
  { id: 'incline-db-curl', name: 'Incline Dumbbell Curl', equipment: 'dumbbell', type: 'weight_reps', primaryMuscles: ['biceps'], secondaryMuscles: [] },
  { id: 'concentration-curl', name: 'Concentration Curl', equipment: 'dumbbell', type: 'weight_reps', primaryMuscles: ['biceps'], secondaryMuscles: [] },
  { id: 'triceps-pushdown', name: 'Triceps Pushdown', equipment: 'cable', type: 'weight_reps', primaryMuscles: ['triceps'], secondaryMuscles: [] },
  { id: 'overhead-triceps-ext', name: 'Overhead Triceps Extension', equipment: 'dumbbell', type: 'weight_reps', primaryMuscles: ['triceps'], secondaryMuscles: [] },
  { id: 'skull-crusher', name: 'Skull Crusher', equipment: 'barbell', type: 'weight_reps', primaryMuscles: ['triceps'], secondaryMuscles: [] },
  { id: 'close-grip-bench', name: 'Close-Grip Bench Press', equipment: 'barbell', type: 'weight_reps', primaryMuscles: ['triceps', 'chest'], secondaryMuscles: ['front_delts'] },
  { id: 'triceps-dip', name: 'Triceps Dip', equipment: 'bodyweight', type: 'bodyweight', primaryMuscles: ['triceps'], secondaryMuscles: ['chest', 'front_delts'] },
  { id: 'triceps-kickback', name: 'Triceps Kickback', equipment: 'dumbbell', type: 'weight_reps', primaryMuscles: ['triceps'], secondaryMuscles: [] },
  { id: 'wrist-curl', name: 'Wrist Curl', equipment: 'dumbbell', type: 'weight_reps', primaryMuscles: ['forearms'], secondaryMuscles: [] },

  // ---- Core ----
  { id: 'plank', name: 'Plank', equipment: 'bodyweight', type: 'duration', primaryMuscles: ['abs'], secondaryMuscles: ['obliques'] },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', equipment: 'bodyweight', type: 'bodyweight', primaryMuscles: ['abs'], secondaryMuscles: ['obliques'] },
  { id: 'cable-crunch', name: 'Cable Crunch', equipment: 'cable', type: 'weight_reps', primaryMuscles: ['abs'], secondaryMuscles: [] },
  { id: 'crunch', name: 'Crunch', equipment: 'bodyweight', type: 'bodyweight', primaryMuscles: ['abs'], secondaryMuscles: [] },
  { id: 'sit-up', name: 'Sit-Up', equipment: 'bodyweight', type: 'bodyweight', primaryMuscles: ['abs'], secondaryMuscles: [] },
  { id: 'russian-twist', name: 'Russian Twist', equipment: 'bodyweight', type: 'bodyweight', primaryMuscles: ['obliques'], secondaryMuscles: ['abs'] },
  { id: 'ab-wheel', name: 'Ab Wheel Rollout', equipment: 'other', type: 'bodyweight', primaryMuscles: ['abs'], secondaryMuscles: ['obliques'] },
  { id: 'side-plank', name: 'Side Plank', equipment: 'bodyweight', type: 'duration', primaryMuscles: ['obliques'], secondaryMuscles: ['abs'] },
  { id: 'mountain-climbers', name: 'Mountain Climbers', equipment: 'bodyweight', type: 'bodyweight', primaryMuscles: ['abs'], secondaryMuscles: ['obliques'] },

  // ---- Cardio (not counted toward set volume) ----
  { id: 'running', name: 'Running', equipment: 'other', type: 'cardio', primaryMuscles: [], secondaryMuscles: [] },
  { id: 'cycling', name: 'Cycling', equipment: 'machine', type: 'cardio', primaryMuscles: [], secondaryMuscles: [] },
  { id: 'rowing', name: 'Rowing Machine', equipment: 'machine', type: 'cardio', primaryMuscles: [], secondaryMuscles: [] },
  { id: 'incline-walk', name: 'Incline Treadmill Walk', equipment: 'machine', type: 'cardio', primaryMuscles: [], secondaryMuscles: [] },
  { id: 'jump-rope', name: 'Jump Rope', equipment: 'other', type: 'cardio', primaryMuscles: [], secondaryMuscles: [] },
]
