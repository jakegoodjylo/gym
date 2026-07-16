import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Exercise } from '@/lib/db'

export function useExercises(includeArchived = false): Exercise[] {
  return (
    useLiveQuery(async () => {
      const all = await db.exercises.toArray()
      return all
        .filter((e) => includeArchived || !e.archived)
        .sort((a, b) => a.name.localeCompare(b.name))
    }, [includeArchived]) ?? []
  )
}

export function useExerciseMap(): Map<string, Exercise> {
  return (
    useLiveQuery(async () => {
      const all = await db.exercises.toArray()
      return new Map(all.map((e) => [e.id, e]))
    }, []) ?? new Map()
  )
}
