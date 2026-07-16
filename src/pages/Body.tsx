import { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, LineChart as LineChartIcon, Camera, Trash2, ImageIcon } from 'lucide-react'
import { db, type BodyMetric, type ProgressPhoto } from '@/lib/db'
import { addMetric, addPhoto, deleteMetric, deletePhoto } from '@/lib/repo'
import { useSettings } from '@/hooks/useSettings'
import { displayWeight, toKg } from '@/lib/strength'
import { todayISO, relativeDay } from '@/lib/date'
import { PageHeader } from '@/components/common/PageHeader'
import { StatTile } from '@/components/common/StatTile'
import { EmptyState } from '@/components/common/EmptyState'
import { LineTrend, type TrendPoint } from '@/components/charts/LineTrend'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface MetricPreset {
  type: string
  label: string
  unit?: string
  isWeight?: boolean
}

const METRIC_PRESETS: MetricPreset[] = [
  { type: 'weight', label: 'Bodyweight', isWeight: true },
  { type: 'bodyfat', label: 'Body Fat', unit: '%' },
  { type: 'waist', label: 'Waist', unit: 'cm' },
  { type: 'chest', label: 'Chest', unit: 'cm' },
  { type: 'arms', label: 'Arms', unit: 'cm' },
  { type: 'thighs', label: 'Thighs', unit: 'cm' },
]

const RANGES = [
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '1Y', days: 365 },
  { label: 'All', days: Infinity },
]

export function Body() {
  const settings = useSettings()
  const [type, setType] = useState('weight')
  const [rangeDays, setRangeDays] = useState<number>(90)
  const [logOpen, setLogOpen] = useState(false)

  const preset = METRIC_PRESETS.find((p) => p.type === type) ?? METRIC_PRESETS[0]
  const unit = preset.isWeight ? settings.weightUnit : preset.unit

  const metrics = useLiveQuery(
    async () => (await db.metrics.where('type').equals(type).toArray()).sort((a, b) => a.date.localeCompare(b.date)),
    [type],
  )

  const points: TrendPoint[] = useMemo(() => {
    if (!metrics) return []
    const cutoff = rangeDays === Infinity ? '' : daysAgoISO(rangeDays)
    return metrics
      .filter((m) => rangeDays === Infinity || m.date >= cutoff)
      .map((m) => ({
        date: m.date,
        value: round(preset.isWeight ? displayWeight(m.value, settings.weightUnit) : m.value),
      }))
  }, [metrics, rangeDays, preset.isWeight, settings.weightUnit])

  const latest = points.at(-1)
  const first = points[0]
  const delta = latest && first ? latest.value - first.value : 0

  return (
    <div>
      <PageHeader
        title="Body"
        action={
          <Button size="sm" onClick={() => setLogOpen(true)}>
            <Plus /> Log
          </Button>
        }
      />

      <Tabs defaultValue="measurements">
        <TabsList className="w-full">
          <TabsTrigger value="measurements" className="flex-1">
            Measurements
          </TabsTrigger>
          <TabsTrigger value="photos" className="flex-1">
            Photos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="measurements">
          <div className="mb-3">
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {METRIC_PRESETS.map((p) => (
                <option key={p.type} value={p.type}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2">
            <StatTile
              label="Latest"
              value={latest ? latest.value : '—'}
              unit={latest ? unit : undefined}
              hint={latest ? relativeDay(latest.date) : 'No entries'}
            />
            <StatTile
              label={`Change (${RANGES.find((r) => r.days === rangeDays)?.label})`}
              value={points.length > 1 ? `${delta > 0 ? '+' : ''}${round(delta)}` : '—'}
              unit={points.length > 1 ? unit : undefined}
              hint={points.length > 1 ? `over ${points.length} entries` : undefined}
            />
          </div>

          <div className="mb-3 flex gap-1">
            {RANGES.map((r) => (
              <button
                key={r.label}
                onClick={() => setRangeDays(r.days)}
                className={cn(
                  'flex-1 rounded-md border py-1 text-xs transition-colors',
                  rangeDays === r.days
                    ? 'border-foreground bg-secondary'
                    : 'border-border text-muted-foreground',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          <LineTrend data={points} unit={unit} />

          <div className="mt-4">
            <div className="label-mono mb-2">History</div>
            {metrics && metrics.length === 0 ? (
              <EmptyState
                icon={LineChartIcon}
                title={`No ${preset.label.toLowerCase()} logged`}
                description="Log a measurement to start tracking your trend."
              />
            ) : (
              <div className="divide-y divide-border">
                {[...(metrics ?? [])].reverse().map((m) => (
                  <MetricRow key={m.id} metric={m} preset={preset} unit={unit} weightUnit={settings.weightUnit} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="photos">
          <PhotosTab />
        </TabsContent>
      </Tabs>

      <LogMetricSheet
        open={logOpen}
        onOpenChange={setLogOpen}
        defaultType={type}
        weightUnit={settings.weightUnit}
      />
    </div>
  )
}

function MetricRow({
  metric,
  preset,
  unit,
  weightUnit,
}: {
  metric: BodyMetric
  preset: MetricPreset
  unit?: string
  weightUnit: 'kg' | 'lb'
}) {
  const val = preset.isWeight ? displayWeight(metric.value, weightUnit) : metric.value
  return (
    <div className="flex items-center justify-between py-2.5 text-sm">
      <span className="text-muted-foreground">{relativeDay(metric.date)}</span>
      <div className="flex items-center gap-3">
        <span className="tabular-nums font-medium">
          {round(val)} {unit}
        </span>
        <button
          onClick={() => deleteMetric(metric.id)}
          className="text-muted-foreground transition-colors hover:text-destructive"
          aria-label="Delete entry"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  )
}

function LogMetricSheet({
  open,
  onOpenChange,
  defaultType,
  weightUnit,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  defaultType: string
  weightUnit: 'kg' | 'lb'
}) {
  const [type, setType] = useState(defaultType)
  const [value, setValue] = useState('')
  const [date, setDate] = useState(todayISO())

  useEffect(() => {
    if (open) {
      setType(defaultType)
      setValue('')
      setDate(todayISO())
    }
  }, [open, defaultType])

  const preset = METRIC_PRESETS.find((p) => p.type === type) ?? METRIC_PRESETS[0]
  const unit = preset.isWeight ? weightUnit : preset.unit

  async function save() {
    const num = parseFloat(value)
    if (Number.isNaN(num)) return
    const stored = preset.isWeight ? toKg(num, weightUnit) : num
    await addMetric(type, stored, date)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Log measurement</SheetTitle>
        </SheetHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Metric</Label>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {METRIC_PRESETS.map((p) => (
                <option key={p.type} value={p.type}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Value {unit ? `(${unit})` : ''}</Label>
              <Input
                autoFocus
                type="number"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <Button className="w-full" onClick={save} disabled={!value}>
            <Plus /> Save entry
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function PhotosTab() {
  const photos = useLiveQuery(async () => (await db.photos.toArray()).sort((a, b) => b.date.localeCompare(a.date)), [])
  const fileRef = useRef<HTMLInputElement>(null)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) await addPhoto(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFile}
      />
      <Button variant="outline" className="mb-3 w-full" onClick={() => fileRef.current?.click()}>
        <Camera /> Add progress photo
      </Button>

      {photos && photos.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No photos yet"
          description="Progress photos are stored privately on this device."
        />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {photos?.map((p) => (
            <PhotoThumb key={p.id} photo={p} />
          ))}
        </div>
      )}
    </div>
  )
}

function PhotoThumb({ photo }: { photo: ProgressPhoto }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    const u = URL.createObjectURL(photo.blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [photo.blob])

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border">
      {url && <img src={url} alt={photo.date} className="aspect-[3/4] w-full object-cover" />}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent p-2">
        <span className="text-[11px] font-medium text-white">{relativeDay(photo.date)}</span>
        <button
          onClick={() => deletePhoto(photo.id)}
          className="rounded p-1 text-white/80 transition-colors hover:text-destructive"
          aria-label="Delete photo"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  )
}

// helpers
function round(n: number): number {
  return Math.round(n * 10) / 10
}
function daysAgoISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}
