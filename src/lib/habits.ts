import { subDays } from 'date-fns'
import { toISODate } from './date'
import type { HabitLog } from './db'

export function logDateSet(logs: HabitLog[]): Set<string> {
  return new Set(logs.map((l) => l.date))
}

/** Consecutive-day streak ending today (today may still be incomplete). */
export function currentStreak(dates: Set<string>): number {
  let streak = 0
  let d = new Date()
  if (!dates.has(toISODate(d))) d = subDays(d, 1)
  while (dates.has(toISODate(d))) {
    streak++
    d = subDays(d, 1)
  }
  return streak
}

export function longestStreak(dates: Set<string>): number {
  if (dates.size === 0) return 0
  const sorted = [...dates].sort()
  let best = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1])
    const cur = new Date(sorted[i])
    const gap = Math.round((cur.getTime() - prev.getTime()) / 86_400_000)
    if (gap === 1) {
      run++
      best = Math.max(best, run)
    } else {
      run = 1
    }
  }
  return best
}

/** Count completions in an inclusive ISO-date range (lexicographic compare is safe for yyyy-MM-dd). */
export function countBetween(dates: Set<string>, startISO: string, endISO: string): number {
  let n = 0
  for (const d of dates) if (d >= startISO && d <= endISO) n++
  return n
}

export function doneInLastNDays(dates: Set<string>, n: number): number {
  let count = 0
  for (let i = 0; i < n; i++) {
    if (dates.has(toISODate(subDays(new Date(), i)))) count++
  }
  return count
}
