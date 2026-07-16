import { useCallback, useEffect, useRef, useState } from 'react'

export interface RestTimer {
  remaining: number
  running: boolean
  start: (seconds: number) => void
  stop: () => void
  add: (seconds: number) => void
}

/** Simple countdown rest timer used between sets. */
export function useRestTimer(): RestTimer {
  const [remaining, setRemaining] = useState(0)
  const [running, setRunning] = useState(false)
  const deadline = useRef<number>(0)

  const tick = useCallback(() => {
    const left = Math.max(0, Math.round((deadline.current - Date.now()) / 1000))
    setRemaining(left)
    if (left <= 0) setRunning(false)
  }, [])

  useEffect(() => {
    if (!running) return
    const iv = setInterval(tick, 250)
    return () => clearInterval(iv)
  }, [running, tick])

  const start = useCallback((seconds: number) => {
    if (seconds <= 0) return
    deadline.current = Date.now() + seconds * 1000
    setRemaining(seconds)
    setRunning(true)
  }, [])

  const stop = useCallback(() => setRunning(false), [])

  const add = useCallback((seconds: number) => {
    deadline.current += seconds * 1000
    setRemaining((r) => Math.max(0, r + seconds))
  }, [])

  return { remaining, running, start, stop, add }
}
