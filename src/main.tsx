import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import { App } from './App'
import { ensureSeeded } from '@/lib/repo'

// Seed the exercise library + default settings on first run.
void ensureSeeded()

// Keep the installed PWA up to date automatically.
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
