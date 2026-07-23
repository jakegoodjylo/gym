import { useMemo, useState } from 'react'
import { Plus, Search, Dumbbell } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useExercises } from '@/hooks/useExercises'
import { EQUIPMENT_LABELS, type Equipment, type ExerciseType } from '@/lib/db'
import { MUSCLE_LIST, muscleLabel, type MuscleGroup } from '@/lib/muscles'
import { addCustomExercise } from '@/lib/repo'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface ExercisePickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (exerciseId: string) => void
}

export function ExercisePicker({ open, onOpenChange, onSelect }: ExercisePickerProps) {
  const exercises = useExercises()
  const [query, setQuery] = useState('')
  const [muscle, setMuscle] = useState<'all' | MuscleGroup>('all')
  const [creating, setCreating] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return exercises.filter((e) => {
      if (q && !e.name.toLowerCase().includes(q)) return false
      if (muscle !== 'all' && !e.primaryMuscles.includes(muscle) && !e.secondaryMuscles.includes(muscle))
        return false
      return true
    })
  }, [exercises, query, muscle])

  function pick(id: string) {
    onSelect(id)
    onOpenChange(false)
    setQuery('')
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="h-[92vh]">
        {creating ? (
          <CreateExerciseForm
            onCancel={() => setCreating(false)}
            onCreated={(id) => {
              setCreating(false)
              pick(id)
            }}
          />
        ) : (
          <div className="flex h-full flex-col">
            <SheetHeader className="shrink-0">
              <SheetTitle>Add exercise</SheetTitle>
            </SheetHeader>

            <div className="shrink-0 space-y-2 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Search exercises…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Select value={muscle} onChange={(e) => setMuscle(e.target.value as MuscleGroup | 'all')}>
                  <option value="all">All muscles</option>
                  {MUSCLE_LIST.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </Select>
                <Button variant="outline" size="icon" onClick={() => setCreating(true)} aria-label="New exercise">
                  <Plus />
                </Button>
              </div>
            </div>

            <div className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
              {filtered.map((e) => (
                <button
                  key={e.id}
                  onClick={() => pick(e.id)}
                  className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors active:bg-accent"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{e.name}</div>
                    <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {e.primaryMuscles.map(muscleLabel).join(', ') || 'Cardio'}
                    </div>
                  </div>
                  <Badge variant="outline">{EQUIPMENT_LABELS[e.equipment]}</Badge>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No matches.{' '}
                  <button className="text-foreground underline" onClick={() => setCreating(true)}>
                    Create “{query}”
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function CreateExerciseForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void
  onCreated: (id: string) => void
}) {
  const [name, setName] = useState('')
  const [equipment, setEquipment] = useState<Equipment>('barbell')
  const [type, setType] = useState<ExerciseType>('weight_reps')
  const [primary, setPrimary] = useState<MuscleGroup[]>([])
  const [secondary, setSecondary] = useState<MuscleGroup[]>([])

  function toggle(list: MuscleGroup[], set: (m: MuscleGroup[]) => void, m: MuscleGroup) {
    set(list.includes(m) ? list.filter((x) => x !== m) : [...list, m])
  }

  async function submit() {
    if (!name.trim()) return
    const id = await addCustomExercise({
      name: name.trim(),
      equipment,
      type,
      primaryMuscles: primary,
      secondaryMuscles: secondary.filter((m) => !primary.includes(m)),
    })
    onCreated(id)
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>New exercise</SheetTitle>
      </SheetHeader>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Landmine Press" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Equipment</Label>
            <Select value={equipment} onChange={(e) => setEquipment(e.target.value as Equipment)}>
              {Object.entries(EQUIPMENT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tracking</Label>
            <Select value={type} onChange={(e) => setType(e.target.value as ExerciseType)}>
              <option value="weight_reps">Weight × reps</option>
              <option value="bodyweight">Bodyweight reps</option>
              <option value="duration">Duration</option>
              <option value="cardio">Cardio</option>
            </Select>
          </div>
        </div>

        <MuscleChips label="Primary muscles" selected={primary} onToggle={(m) => toggle(primary, setPrimary, m)} />
        <MuscleChips
          label="Secondary muscles"
          selected={secondary}
          onToggle={(m) => toggle(secondary, setSecondary, m)}
        />

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={submit} disabled={!name.trim()}>
            Create & add
          </Button>
        </div>
      </div>
    </>
  )
}

function MuscleChips({
  label,
  selected,
  onToggle,
}: {
  label: string
  selected: MuscleGroup[]
  onToggle: (m: MuscleGroup) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {MUSCLE_LIST.map((m) => {
          const active = selected.includes(m.id)
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onToggle(m.id)}
              className={cn(
                'rounded-md border px-2 py-1 text-[11px] transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground',
              )}
            >
              {m.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export const ExercisePickerIcon = Dumbbell
