import { useLiveQuery } from 'dexie-react-hooks'
import { db, DEFAULT_SETTINGS, type Settings } from '@/lib/db'

export function useSettings(): Settings {
  return useLiveQuery(() => db.settings.get('app'), [], DEFAULT_SETTINGS) ?? DEFAULT_SETTINGS
}
