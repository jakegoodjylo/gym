import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { addMonths, startOfMonth, startOfWeek } from 'date-fns'
import { Plus, CheckSquare, Flame, MoreVertical, Trash2, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import { db, type Habit } from '@/lib/db'
import { addHabit, deleteHabit, toggleHabit, updateHabit } from '@/lib/repo'
import { currentStreak, countBetween } from '@/lib/habits'
import { monthDays, monthLabel, toISODate, todayISO, daysAgo } from '@/lib/date'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const HABIT_COLORS = ['1', '2', '3', '4', '5'] as const
const EMPTY: Set<string> = new Set()
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function dotClass(color: string) {
  return `bg-chart-${color}`
}
function textClass(color: string) {
  return `text-chart-${color}`
}

export function Habits() {
  const habits = useLiveQuery(
    async () => (await db.habits.orderBy('order').toArray()).filter((h) => !h.archived),
    [],
  )
  const logs = useLiveQuery(() => db.habitLogs.toArray(), [])
  const [editing, setEditing] = useState<Habit | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const logsByHabit = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const l of logs ?? []) {
      if (!map.has(l.habitId)) map.set(l.habitId, new Set())
      map.get(l.habitId)!.add(l.date)
    }
    return map
  }, [logs])

  function openNew() {
    setEditing(null)
    setSheetOpen(true)
  }
  function openEdit(h: Habit) {
    setEditing(h)
    setSheetOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="Habits"
        subtitle={habits?.length ? `${habits.length} active` : undefined}
        action={
          <Button size="sm" onClick={openNew}>
            <Plus /> New
          </Button>
        }
      />

      {habits && habits.length === 0 && (
        <EmptyState
          icon={CheckSquare}
          title="No habits yet"
          description="Track daily habits like stretching, cardio or sleep. Tap a day to check it off."
          action={
            <Button onClick={openNew}>
              <Plus /> Add your first habit
            </Button>
          }
        />
      )}

      <div className="space-y-3">
        {habits?.map((h) => (
          <HabitCard
            key={h.id}
            habit={h}
            dates={logsByHabit.get(h.id) ?? EMPTY}
            onEdit={() => openEdit(h)}
          />
        ))}
      </div>

      <HabitSheet
        key={editing?.id ?? 'new'}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        habit={editing}
      />
    </div>
  )
}

function HabitCard({
  habit,
  dates,
  onEdit,
}: {
  habit: Habit
  dates: Set<string>
  onEdit: () => void
}) {
  const [monthOffset, setMonthOffset] = useState(0)
  const streak = currentStreak(dates)
  const month = addMonths(startOfMonth(new Date()), monthOffset)
  const cells = useMemo(() => monthDays(month), [month.getTime()])

  // Completion averages
  const today = todayISO()
  const weekStart = toISODate(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const monthStart = toISODate(startOfMonth(new Date()))
  const weekElapsed = daysAgo(weekStart) + 1
  const monthElapsed = new Date().getDate()
  const weekDone = countBetween(dates, weekStart, today)
  const monthDone = countBetween(dates, monthStart, today)

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn('size-2 shrink-0 rounded-full', dotClass(habit.color))} />
          {habit.emoji && <span className="text-base leading-none">{habit.emoji}</span>}
          <span className="truncate text-sm font-medium">{habit.name}</span>
        </div>
        <div className="flex items-center gap-3">
          {streak > 0 && (
            <span className={cn('flex items-center gap-1 text-xs tabular-nums', textClass(habit.color))}>
              <Flame className="size-3.5" /> {streak}
            </span>
          )}
          <button
            onClick={onEdit}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Edit habit"
          >
            <MoreVertical className="size-4" />
          </button>
        </div>
      </div>

      {/* Month navigator */}
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={() => setMonthOffset((o) => o - 1)}
          className="rounded p-1 text-muted-foreground transition-colors active:bg-accent"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="label-mono">{monthLabel(month)}</span>
        <button
          onClick={() => setMonthOffset((o) => Math.min(0, o + 1))}
          disabled={monthOffset >= 0}
          className="rounded p-1 text-muted-foreground transition-colors active:bg-accent disabled:opacity-30"
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Weekday header */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="text-center text-[9px] uppercase text-muted-foreground">
            {d}
          </span>
        ))}
      </div>

      {/* Month dot grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) return <span key={i} />
          const done = dates.has(cell.iso)
          return (
            <button
              key={cell.iso}
              disabled={cell.future}
              onClick={() => toggleHabit(habit.id, cell.iso)}
              className="flex h-7 items-center justify-center rounded-md transition-colors disabled:opacity-40 active:bg-accent"
              aria-label={cell.iso}
            >
              <span
                className={cn(
                  'size-3 rounded-full border transition-colors',
                  done
                    ? cn(dotClass(habit.color), 'border-transparent')
                    : 'border-border bg-transparent',
                  cell.today && !done && 'ring-2 ring-foreground/50 ring-offset-1 ring-offset-card',
                )}
              />
            </button>
          )
        })}
      </div>

      {/* Weekly / monthly averages */}
      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
        <AvgStat label="This week" done={weekDone} of={weekElapsed} />
        <AvgStat label="This month" done={monthDone} of={monthElapsed} />
      </div>
    </div>
  )
}

function AvgStat({ label, done, of }: { label: string; done: number; of: number }) {
  const pct = of > 0 ? Math.round((done / of) * 100) : 0
  return (
    <div className="flex items-baseline justify-between rounded-md bg-secondary px-2.5 py-1.5">
      <span className="label-mono">{label}</span>
      <span className="text-xs tabular-nums">
        <span className="font-semibold">{done}</span>
        <span className="text-muted-foreground">/{of} · {pct}%</span>
      </span>
    </div>
  )
}

function HabitSheet({
  open,
  onOpenChange,
  habit,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  habit: Habit | null
}) {
  const [name, setName] = useState(habit?.name ?? '')
  const [emoji, setEmoji] = useState(habit?.emoji ?? '')
  const [color, setColor] = useState(habit?.color ?? '1')

  async function save() {
    if (!name.trim()) return
    if (habit) {
      await updateHabit(habit.id, { name: name.trim(), emoji: emoji || undefined, color })
    } else {
      await addHabit(name.trim(), emoji || undefined, color)
    }
    onOpenChange(false)
  }

  async function remove() {
    if (habit) {
      await deleteHabit(habit.id)
      onOpenChange(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{habit ? 'Edit habit' : 'New habit'}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-16 space-y-1.5">
              <Label>Emoji</Label>
              <Input
                value={emoji}
                maxLength={2}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="🏃"
                className="text-center text-lg"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label>Name</Label>
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Stretch"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Colour</Label>
            <div className="flex gap-2">
              {HABIT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    'size-8 rounded-full border-2 transition-transform',
                    dotClass(c),
                    color === c ? 'scale-110 border-foreground' : 'border-transparent',
                  )}
                  aria-label={`Colour ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {habit && (
              <Button variant="ghost" size="icon" onClick={remove} aria-label="Delete habit">
                <Trash2 className="text-destructive" />
              </Button>
            )}
            <Button className="flex-1" onClick={save} disabled={!name.trim()}>
              {habit ? (
                <>
                  <Pencil /> Save
                </>
              ) : (
                <>
                  <Plus /> Add habit
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
