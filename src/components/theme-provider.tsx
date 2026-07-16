import { useEffect } from 'react'
import { useSettings } from '@/hooks/useSettings'

/** Applies the persisted theme (light/dark/system) to <html>. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const settings = useSettings()
  const theme = settings.theme

  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches)
      root.classList.toggle('dark', dark)
      const meta = document.querySelector('meta[name="theme-color"]')
      if (meta) meta.setAttribute('content', dark ? '#0f0f14' : '#ffffff')
    }

    apply()
    if (theme === 'system') {
      media.addEventListener('change', apply)
      return () => media.removeEventListener('change', apply)
    }
  }, [theme])

  return <>{children}</>
}
