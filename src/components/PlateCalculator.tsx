import { useMemo, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// Available plate denominations per side.
const PLATES: Record<'kg' | 'lb', number[]> = {
  kg: [25, 20, 15, 10, 5, 2.5, 1.25],
  lb: [45, 35, 25, 10, 5, 2.5],
}
const DEFAULT_BAR = { kg: 20, lb: 45 }

interface PlateGroup {
  plate: number
  count: number
}

/** Greedy plates per side for (target − bar) / 2. Returns groups + any remainder. */
function computePlates(target: number, bar: number, unit: 'kg' | 'lb'): { groups: PlateGroup[]; remainder: number } {
  let perSide = (target - bar) / 2
  if (!Number.isFinite(perSide) || perSide <= 0) return { groups: [], remainder: 0 }
  const groups: PlateGroup[] = []
  for (const plate of PLATES[unit]) {
    const count = Math.floor(perSide / plate + 1e-9)
    if (count > 0) {
      groups.push({ plate, count })
      perSide -= count * plate
    }
  }
  return { groups, remainder: Math.round(perSide * 100) / 100 }
}

export function PlateCalculator({
  open,
  onOpenChange,
  unit,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  unit: 'kg' | 'lb'
}) {
  const [target, setTarget] = useState('')
  const [bar, setBar] = useState(String(DEFAULT_BAR[unit]))

  const result = useMemo(() => {
    const t = parseFloat(target)
    const b = parseFloat(bar)
    if (Number.isNaN(t) || Number.isNaN(b)) return null
    return computePlates(t, b, unit)
  }, [target, bar, unit])

  const loaded = result ? parseFloat(bar) + result.groups.reduce((s, g) => s + g.plate * g.count * 2, 0) : 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Plate calculator</SheetTitle>
        </SheetHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Target ({unit})</Label>
              <Input
                autoFocus
                type="number"
                inputMode="decimal"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="100"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Bar ({unit})</Label>
              <Input type="number" inputMode="decimal" value={bar} onChange={(e) => setBar(e.target.value)} />
            </div>
          </div>

          {result && (
            <div className="rounded-lg border border-border bg-secondary/40 p-3">
              {result.groups.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Target is at or below the bar weight.
                </p>
              ) : (
                <>
                  <div className="label-mono mb-2">Per side</div>
                  <div className="flex flex-wrap gap-2">
                    {result.groups.map((g) => (
                      <div
                        key={g.plate}
                        className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5"
                      >
                        <span className="text-sm font-semibold tabular-nums">{g.count}×</span>
                        <span className="text-sm tabular-nums">{g.plate}</span>
                        <span className="text-[10px] text-muted-foreground">{unit}</span>
                      </div>
                    ))}
                  </div>
                  <div className={cn('mt-3 text-xs', result.remainder > 0 ? 'text-warning' : 'text-muted-foreground')}>
                    Loads to <span className="font-medium tabular-nums">{loaded}{unit}</span>
                    {result.remainder > 0 && ` · ${result.remainder}${unit}/side short of exact`}
                  </div>
                </>
              )}
            </div>
          )}

          <p className="text-[11px] text-muted-foreground">
            Assumes a standard {unit === 'kg' ? '20kg' : '45lb'} bar and gym plate set. Adjust the bar
            weight for dumbbells, EZ bars, or fixed machines.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
