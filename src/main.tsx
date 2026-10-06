import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import { App } from './App'
import { closeOpenWorkouts, ensureSeeded } from '@/lib/repo'
import { requestPersistentStorage } from '@/lib/storage'

// Seed the exercise library + default settings on first run.
void ensureSeeded()

// All data is local-only, so ask the browser not to evict it.
void requestPersistentStorage()

// Close any workout left open and idle (forgot to hit Finish) — on launch and
// whenever the PWA comes back to the foreground.
void closeOpenWorkouts()
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') void closeOpenWorkouts()
})

// Keep the installed PWA up to date automatically.
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
