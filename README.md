# Forge — Gym & Habit Tracker

A local-first, mobile-first PWA for tracking workouts, habits and body metrics.
Minimal monospace dashboard aesthetic, light/dark, works fully offline and
installs to your phone's home screen.

## Features

- **Workouts** — freestyle logging from a preset library of ~75 exercises, each
  tagged with primary/secondary muscles. Per-set weight × reps with quick "add
  set" duplication, previous-session hints, a rest timer, and automatic
  estimated-1RM personal-record detection.
- **Muscle volume** — weekly "hard sets per muscle group" analytics (primary = 1
  set, secondary = ½). Compares against volume landmarks and flags under-trained
  muscle groups so you can find the gaps in your programming.
- **Habits** — binary daily habits with streaks and a rolling week view.
- **Body** — bodyweight + measurements with trend charts and range toggles, plus
  private on-device progress photos.
- **Backup** — export/import all data as JSON (nothing is synced to the cloud
  yet; the data layer is structured with `updatedAt` timestamps so sync can be
  added later).

## Stack

Vite + React + TypeScript · Tailwind (shadcn-style primitives) · Dexie
(IndexedDB) · Recharts · `vite-plugin-pwa`.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build (emits service worker + manifest)
npm run preview    # serve the production build
```

> Node 20.19+ or 22.12+ is recommended (Vite 7 prints a warning on 20.14 but
> still builds fine).

## Data model

Everything lives in IndexedDB (`forge` database) via Dexie. See `src/lib/db.ts`
for the schema and `src/lib/repo.ts` for all reads/writes. The exercise library
and muscle-volume landmarks are in `src/data/exercises.ts` and
`src/lib/muscles.ts`.

## Regenerating app icons

App icons derive from `public/icon.svg` / `public/icon-maskable.svg`; the PNG
variants (`pwa-*.png`, `apple-touch-icon.png`) were rendered from those SVGs.
Re-render with any SVG→PNG tool if you change the artwork.
