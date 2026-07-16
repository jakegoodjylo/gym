// Audio/haptic feedback. iOS Safari only allows audio that originates from a
// user gesture, so we create + resume the AudioContext when the user taps
// "Start rest" (primeAudio), then reuse it to beep when the timer ends.

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  return ctx
}

/** Call from a user gesture (e.g. starting the rest timer) to unlock audio. */
export function primeAudio(): void {
  const c = getCtx()
  if (c && c.state === 'suspended') void c.resume()
}

function tone(c: AudioContext, freq: number, start: number, dur: number): void {
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  osc.connect(gain).connect(c.destination)
  osc.start(start)
  osc.stop(start + dur)
}

/** Two rising beeps + a vibration (vibration is a no-op on iOS). */
export function restCompleteAlert(): void {
  try {
    const c = getCtx()
    if (c) {
      if (c.state === 'suspended') void c.resume()
      const t = c.currentTime
      tone(c, 880, t, 0.15)
      tone(c, 1320, t + 0.2, 0.22)
    }
  } catch {
    /* audio unavailable — ignore */
  }
  try {
    navigator.vibrate?.([150, 80, 150])
  } catch {
    /* vibration unsupported — ignore */
  }
}
