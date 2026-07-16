import { db } from './db'

const BACKUP_VERSION = 1

interface PhotoBackup {
  id: string
  date: string
  note?: string
  createdAt: number
  dataUrl: string
}

interface BackupFile {
  app: 'forge'
  version: number
  exportedAt: number
  data: {
    exercises: unknown[]
    workouts: unknown[]
    sets: unknown[]
    habits: unknown[]
    habitLogs: unknown[]
    metrics: unknown[]
    settings: unknown[]
    photos: PhotoBackup[]
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl)
  return res.blob()
}

export async function exportBackup(): Promise<BackupFile> {
  const [exercises, workouts, sets, habits, habitLogs, metrics, settings, photoRows] =
    await Promise.all([
      db.exercises.toArray(),
      db.workouts.toArray(),
      db.sets.toArray(),
      db.habits.toArray(),
      db.habitLogs.toArray(),
      db.metrics.toArray(),
      db.settings.toArray(),
      db.photos.toArray(),
    ])

  const photos: PhotoBackup[] = await Promise.all(
    photoRows.map(async (p) => ({
      id: p.id,
      date: p.date,
      note: p.note,
      createdAt: p.createdAt,
      dataUrl: await blobToDataUrl(p.blob),
    })),
  )

  return {
    app: 'forge',
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    data: { exercises, workouts, sets, habits, habitLogs, metrics, settings, photos },
  }
}

/** Trigger a file download of the full backup. */
export async function downloadBackup(): Promise<void> {
  const backup = await exportBackup()
  const stamp = new Date(backup.exportedAt).toISOString().slice(0, 10)
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `forge-backup-${stamp}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** Replace all local data with the contents of a backup file. */
export async function importBackup(file: BackupFile): Promise<void> {
  if (file.app !== 'forge') throw new Error('Not a Forge backup file.')

  const photos = await Promise.all(
    (file.data.photos ?? []).map(async (p) => ({
      id: p.id,
      date: p.date,
      note: p.note,
      createdAt: p.createdAt,
      blob: await dataUrlToBlob(p.dataUrl),
    })),
  )

  await db.transaction(
    'rw',
    [db.exercises, db.workouts, db.sets, db.habits, db.habitLogs, db.metrics, db.settings, db.photos],
    async () => {
      await Promise.all([
        db.exercises.clear(),
        db.workouts.clear(),
        db.sets.clear(),
        db.habits.clear(),
        db.habitLogs.clear(),
        db.metrics.clear(),
        db.settings.clear(),
        db.photos.clear(),
      ])
      await Promise.all([
        db.exercises.bulkPut(file.data.exercises as never),
        db.workouts.bulkPut(file.data.workouts as never),
        db.sets.bulkPut(file.data.sets as never),
        db.habits.bulkPut(file.data.habits as never),
        db.habitLogs.bulkPut(file.data.habitLogs as never),
        db.metrics.bulkPut(file.data.metrics as never),
        db.settings.bulkPut(file.data.settings as never),
        db.photos.bulkPut(photos as never),
      ])
    },
  )
}
