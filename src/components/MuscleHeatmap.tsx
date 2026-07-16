import { useState } from 'react'
import { MUSCLES, muscleLabel, type MuscleGroup } from '@/lib/muscles'
import type { MuscleVolume } from '@/lib/volume'

// ---------------------------------------------------------------------------
// Stylised body geometry (viewBox 0 0 120 270). Each muscle group maps to one
// or more shapes; left/right pairs share the same group so both light up.
// ---------------------------------------------------------------------------

type Shape =
  | { k: 'e'; cx: number; cy: number; rx: number; ry: number }
  | { k: 'r'; x: number; y: number; w: number; h: number; r?: number }

const BASE: Shape[] = [
  { k: 'e', cx: 60, cy: 20, rx: 12, ry: 13 }, // head
  { k: 'r', x: 54, y: 30, w: 12, h: 9, r: 4 }, // neck
  { k: 'r', x: 40, y: 38, w: 40, h: 72, r: 16 }, // torso
  { k: 'r', x: 44, y: 104, w: 32, h: 22, r: 10 }, // pelvis
  { k: 'r', x: 21, y: 44, w: 13, h: 48, r: 6 }, // L upper arm
  { k: 'r', x: 86, y: 44, w: 13, h: 48, r: 6 }, // R upper arm
  { k: 'r', x: 20, y: 90, w: 11, h: 46, r: 5 }, // L forearm
  { k: 'r', x: 89, y: 90, w: 11, h: 46, r: 5 }, // R forearm
  { k: 'r', x: 44, y: 124, w: 14, h: 68, r: 7 }, // L thigh
  { k: 'r', x: 62, y: 124, w: 14, h: 68, r: 7 }, // R thigh
  { k: 'r', x: 46, y: 190, w: 11, h: 60, r: 5 }, // L shin
  { k: 'r', x: 63, y: 190, w: 11, h: 60, r: 5 }, // R shin
  { k: 'r', x: 44, y: 250, w: 13, h: 8, r: 3 }, // L foot
  { k: 'r', x: 63, y: 250, w: 13, h: 8, r: 3 }, // R foot
]

const FRONT: { m: MuscleGroup; s: Shape[] }[] = [
  { m: 'side_delts', s: [{ k: 'e', cx: 36, cy: 48, rx: 8, ry: 8 }, { k: 'e', cx: 84, cy: 48, rx: 8, ry: 8 }] },
  { m: 'front_delts', s: [{ k: 'e', cx: 45, cy: 50, rx: 7, ry: 7 }, { k: 'e', cx: 75, cy: 50, rx: 7, ry: 7 }] },
  { m: 'chest', s: [{ k: 'e', cx: 50, cy: 64, rx: 10, ry: 8 }, { k: 'e', cx: 70, cy: 64, rx: 10, ry: 8 }] },
  { m: 'biceps', s: [{ k: 'e', cx: 27, cy: 70, rx: 6, ry: 12 }, { k: 'e', cx: 93, cy: 70, rx: 6, ry: 12 }] },
  { m: 'forearms', s: [{ k: 'e', cx: 25, cy: 110, rx: 5, ry: 16 }, { k: 'e', cx: 95, cy: 110, rx: 5, ry: 16 }] },
  { m: 'abs', s: [{ k: 'r', x: 52, y: 78, w: 16, h: 34, r: 4 }] },
  { m: 'obliques', s: [{ k: 'e', cx: 47, cy: 94, rx: 4, ry: 13 }, { k: 'e', cx: 73, cy: 94, rx: 4, ry: 13 }] },
  { m: 'quads', s: [{ k: 'e', cx: 51, cy: 152, rx: 8, ry: 28 }, { k: 'e', cx: 69, cy: 152, rx: 8, ry: 28 }] },
]

const BACK: { m: MuscleGroup; s: Shape[] }[] = [
  { m: 'traps', s: [{ k: 'e', cx: 60, cy: 45, rx: 16, ry: 9 }] },
  { m: 'rear_delts', s: [{ k: 'e', cx: 36, cy: 51, rx: 8, ry: 7 }, { k: 'e', cx: 84, cy: 51, rx: 8, ry: 7 }] },
  { m: 'triceps', s: [{ k: 'e', cx: 27, cy: 70, rx: 6, ry: 12 }, { k: 'e', cx: 93, cy: 70, rx: 6, ry: 12 }] },
  { m: 'forearms', s: [{ k: 'e', cx: 25, cy: 110, rx: 5, ry: 16 }, { k: 'e', cx: 95, cy: 110, rx: 5, ry: 16 }] },
  { m: 'lats', s: [{ k: 'e', cx: 48, cy: 78, rx: 9, ry: 16 }, { k: 'e', cx: 72, cy: 78, rx: 9, ry: 16 }] },
  { m: 'lower_back', s: [{ k: 'r', x: 52, y: 94, w: 16, h: 16, r: 4 }] },
  { m: 'glutes', s: [{ k: 'e', cx: 51, cy: 118, rx: 9, ry: 9 }, { k: 'e', cx: 69, cy: 118, rx: 9, ry: 9 }] },
  { m: 'hamstrings', s: [{ k: 'e', cx: 51, cy: 162, rx: 8, ry: 26 }, { k: 'e', cx: 69, cy: 162, rx: 8, ry: 26 }] },
  { m: 'calves', s: [{ k: 'e', cx: 51, cy: 216, rx: 7, ry: 20 }, { k: 'e', cx: 69, cy: 216, rx: 7, ry: 20 }] },
]

/** Heat colour for a muscle's weekly volume relative to its optimal ceiling. */
function heatFill(sets: number, mav: number): string {
  if (sets <= 0) return 'hsl(var(--muted))'
  const t = Math.min(1, sets / mav)
  const hue = 210 - 210 * t // 210 (cool) → 0 (hot)
  return `hsl(${hue} 78% 52%)`
}

function renderShape(s: Shape, key: string, fill: string, onClick: () => void) {
  const common = {
    fill,
    stroke: 'hsl(var(--card))',
    strokeWidth: 0.8,
    onClick,
    className: 'cursor-pointer transition-[fill] duration-300',
  }
  return s.k === 'e' ? (
    <ellipse key={key} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} {...common} />
  ) : (
    <rect key={key} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r ?? 4} {...common} />
  )
}

function BodyView({
  title,
  parts,
  volume,
  selected,
  onSelect,
}: {
  title: string
  parts: { m: MuscleGroup; s: Shape[] }[]
  volume: MuscleVolume
  selected: MuscleGroup | null
  onSelect: (m: MuscleGroup) => void
}) {
  return (
    <div className="flex-1">
      <div className="label-mono mb-1 text-center">{title}</div>
      <svg viewBox="0 0 120 270" className="mx-auto h-auto w-full max-w-[160px]">
        {/* neutral silhouette */}
        {BASE.map((s, i) =>
          s.k === 'e' ? (
            <ellipse key={i} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill="hsl(var(--secondary))" />
          ) : (
            <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r ?? 4} fill="hsl(var(--secondary))" />
          ),
        )}
        {/* muscle overlays */}
        {parts.map((p) => {
          const isSel = selected === p.m
          return (
            <g key={p.m} opacity={selected && !isSel ? 0.55 : 1}>
              {p.s.map((shape, i) => renderShape(shape, `${p.m}-${i}`, heatFill(volume[p.m], MUSCLES[p.m].mav), () => onSelect(p.m)))}
              {isSel &&
                p.s.map((shape, i) =>
                  shape.k === 'e' ? (
                    <ellipse
                      key={`sel-${i}`}
                      cx={shape.cx}
                      cy={shape.cy}
                      rx={shape.rx}
                      ry={shape.ry}
                      fill="none"
                      stroke="hsl(var(--foreground))"
                      strokeWidth={1.5}
                    />
                  ) : (
                    <rect
                      key={`sel-${i}`}
                      x={shape.x}
                      y={shape.y}
                      width={shape.w}
                      height={shape.h}
                      rx={shape.r ?? 4}
                      fill="none"
                      stroke="hsl(var(--foreground))"
                      strokeWidth={1.5}
                    />
                  ),
                )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function MuscleHeatmap({ volume }: { volume: MuscleVolume | undefined }) {
  const [selected, setSelected] = useState<MuscleGroup | null>(null)

  if (!volume) return <div className="h-64 animate-pulse rounded-lg bg-secondary" />

  const selSets = selected ? volume[selected] : 0

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex gap-2">
        <BodyView title="Front" parts={FRONT} volume={volume} selected={selected} onSelect={setSelected} />
        <BodyView title="Back" parts={BACK} volume={volume} selected={selected} onSelect={setSelected} />
      </div>

      {/* Readout */}
      <div className="mt-2 h-5 text-center text-xs">
        {selected ? (
          <span>
            <span className="font-medium">{muscleLabel(selected)}</span>{' '}
            <span className="text-muted-foreground tabular-nums">
              · {fmt(selSets)} sets · target {MUSCLES[selected].mev}–{MUSCLES[selected].mav}
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground">Tap a muscle for detail</span>
        )}
      </div>

      {/* Legend */}
      <div className="mt-1 flex items-center justify-center gap-2">
        <span className="text-[10px] text-muted-foreground">less</span>
        <div
          className="h-2 w-28 rounded-full"
          style={{
            background: 'linear-gradient(90deg, hsl(210 78% 52%), hsl(140 78% 52%), hsl(60 78% 52%), hsl(0 78% 52%))',
          }}
        />
        <span className="text-[10px] text-muted-foreground">more</span>
        <span className="ml-2 flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="inline-block size-2 rounded-full" style={{ background: 'hsl(var(--muted))' }} /> none
        </span>
      </div>
    </div>
  )
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}
