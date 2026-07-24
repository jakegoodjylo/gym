import { useEffect, useState } from 'react'
import { Plus, X, ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ExercisePicker } from '@/components/ExercisePicker'
import { useExerciseMap } from '@/hooks/useExercises'
import { createRoutine, updateRoutine, deleteRoutine } from '@/lib/repo'
import { muscleLabel } from '@/lib/muscles'
import type { Routine } from '@/lib/db'

interface RoutineEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** null = create a new routine; a routine = edit it. */
  routine: Routine | null
}

export function RoutineEditor({ open, onOpenChange, routine }: RoutineEditorProps) {
  const exMap = useExerciseMap()
  const [name, setName] = useState('')
  const [ids, setIds] = useState<string[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)

  // Reset the form whenever the sheet opens for a different routine.
  useEffect(() => {
    if (open) {
      setName(routine?.name ?? '')
      setIds(routine?.exerciseIds ?? [])
    }
  }, [open, routine])

  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= ids.length) return
    const next = ids.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    setIds(next)
  }

  async function save() {
    const trimmed = name.trim()
    if (!trimmed) return
    if (routine) await updateRoutine(routine.id, { name: trimmed, exerciseIds: ids })
    else await createRoutine(trimmed, ids)
    onOpenChange(false)
  }

  async function remove() {
    if (routine && confirm('Delete this routine?')) {
      await deleteRoutine(routine.id)
      onOpenChange(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="h-[92dvh]">
        <SheetHeader>
          <SheetTitle>{routine ? 'Edit routine' : 'New routine'}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Push A"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Exercises</Label>
              <span className="text-[11px] text-muted-foreground tabular-nums">{ids.length}</span>
            </div>

            {ids.length === 0 ? (
              <p className="rounded-md border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
                No exercises yet.
              </p>
            ) : (
              <div className="divide-y divide-border rounded-md border border-border">
                {ids.map((exId, i) => {
                  const ex = exMap.get(exId)
                  return (
                    <div key={`${exId}-${i}`} className="flex items-center gap-2 p-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm">{ex?.name ?? 'Unknown exercise'}</div>
                        {ex && (
                          <div className="truncate text-[11px] text-muted-foreground">
                            {ex.primaryMuscles.map(muscleLabel).join(', ') || 'Cardio'}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        aria-label="Move up"
                        className="p-1 text-muted-foreground disabled:opacity-30 active:text-foreground"
                      >
                        <ChevronUp className="size-4" />
                      </button>
                      <button
                        onClick={() => move(i, 1)}
                        disabled={i === ids.length - 1}
                        aria-label="Move down"
                        className="p-1 text-muted-foreground disabled:opacity-30 active:text-foreground"
                      >
                        <ChevronDown className="size-4" />
                      </button>
                      <button
                        onClick={() => setIds(ids.filter((_, k) => k !== i))}
                        aria-label="Remove"
                        className="p-1 text-muted-foreground/60 active:text-destructive"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            <Button variant="outline" className="w-full" onClick={() => setPickerOpen(true)}>
              <Plus /> Add exercise
            </Button>
          </div>

          <div className="flex gap-2 pt-1">
            {routine && (
              <Button variant="destructive" size="icon" onClick={remove} aria-label="Delete routine">
                <Trash2 />
              </Button>
            )}
            <Button className="flex-1" onClick={save} disabled={!name.trim()}>
              {routine ? 'Save' : 'Create routine'}
            </Button>
          </div>
        </div>

        <ExercisePicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onSelect={(exId) => setIds((prev) => [...prev, exId])}
        />
      </SheetContent>
    </Sheet>
  )
}
