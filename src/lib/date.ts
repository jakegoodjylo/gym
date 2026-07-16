import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  subDays,
  getDay,
  differenceInCalendarDays,
  isSameDay,
  isAfter,
} from 'date-fns'

/** Canonical day key, local time, yyyy-MM-dd. */
export function toISODate(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function fromISODate(s: string): Date {
  return parseISO(s)
}

/** Week bounds, Monday-start, as ISO date strings. */
export function weekBounds(d: Date = new Date()): { start: string; end: string } {
  return {
    start: toISODate(startOfWeek(d, { weekStartsOn: 1 })),
    end: toISODate(endOfWeek(d, { weekStartsOn: 1 })),
  }
}

export function lastNDays(n: number, from: Date = new Date()): string[] {
  const start = subDays(from, n - 1)
  return eachDayOfInterval({ start, end: from }).map(toISODate)
}

export function daysAgo(iso: string, from: Date = new Date()): number {
  return differenceInCalendarDays(from, parseISO(iso))
}

export function isToday(iso: string): boolean {
  return isSameDay(parseISO(iso), new Date())
}

export function fmtDay(iso: string): string {
  return format(parseISO(iso), 'EEE d MMM')
}

export function fmtDayShort(iso: string): string {
  return format(parseISO(iso), 'd MMM')
}

export function fmtWeekday(iso: string): string {
  return format(parseISO(iso), 'EEEEE') // single letter
}

export interface DayCell {
  iso: string
  future: boolean
  today: boolean
}

/** Month laid out as calendar cells (Monday-first), with leading blanks as null. */
export function monthDays(monthDate: Date): (DayCell | null)[] {
  const start = startOfMonth(monthDate)
  const end = endOfMonth(monthDate)
  const now = new Date()
  const lead = (getDay(start) + 6) % 7 // days before the 1st, Monday-based
  const cells: (DayCell | null)[] = Array.from({ length: lead }, () => null)
  for (const d of eachDayOfInterval({ start, end })) {
    cells.push({ iso: toISODate(d), future: isAfter(d, now), today: isSameDay(d, now) })
  }
  return cells
}

export function monthLabel(monthDate: Date): string {
  return format(monthDate, 'MMMM yyyy')
}

export function relativeDay(iso: string): string {
  const diff = daysAgo(iso)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff}d ago`
  return fmtDayShort(iso)
}
