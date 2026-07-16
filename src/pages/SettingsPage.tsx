import { useRef, useState } from 'react'
import { Download, Upload, Sun, Moon, Monitor, Check } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { updateSettings } from '@/lib/repo'
import { downloadBackup, importBackup } from '@/lib/backup'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Settings } from '@/lib/db'

const THEMES: { value: Settings['theme']; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export function SettingsPage() {
  const settings = useSettings()
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<string | null>(null)

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      if (!confirm('This will REPLACE all current data with the backup. Continue?')) return
      await importBackup(parsed)
      setStatus('Backup restored.')
    } catch (err) {
      setStatus(`Import failed: ${(err as Error).message}`)
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div>
      <PageHeader title="Settings" />

      <div className="space-y-6">
        <Section label="Appearance">
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((t) => {
              const active = settings.theme === t.value
              return (
                <button
                  key={t.value}
                  onClick={() => updateSettings({ theme: t.value })}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-md border py-3 text-xs transition-colors',
                    active ? 'border-foreground bg-secondary' : 'border-border text-muted-foreground',
                  )}
                >
                  <t.icon className="size-4" />
                  {t.label}
                </button>
              )
            })}
          </div>
        </Section>

        <Section label="Units">
          <div className="grid grid-cols-2 gap-2">
            {(['kg', 'lb'] as const).map((u) => (
              <button
                key={u}
                onClick={() => updateSettings({ weightUnit: u })}
                className={cn(
                  'rounded-md border py-3 text-sm uppercase tracking-wider transition-colors',
                  settings.weightUnit === u
                    ? 'border-foreground bg-secondary'
                    : 'border-border text-muted-foreground',
                )}
              >
                {u}
              </button>
            ))}
          </div>
        </Section>

        <Section label="Data & backup">
          <Card>
            <CardContent className="space-y-2 p-3">
              <p className="text-xs text-muted-foreground">
                Everything is stored locally on this device. Export regularly to keep a backup — your
                data isn’t synced to the cloud (yet).
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => downloadBackup()}>
                  <Download /> Export
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => fileRef.current?.click()}>
                  <Upload /> Import
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={onImport}
                />
              </div>
              {status && (
                <p className="flex items-center gap-1.5 text-xs text-success">
                  <Check className="size-3.5" /> {status}
                </p>
              )}
            </CardContent>
          </Card>
        </Section>

        <p className="pt-2 text-center text-[11px] text-muted-foreground">
          Forge · local-first · v0.1
        </p>
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label-mono mb-2">{label}</div>
      {children}
    </div>
  )
}
