import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { AppLayout } from '@/components/layout/AppLayout'
import { Dashboard } from '@/pages/Dashboard'
import { Train } from '@/pages/Train'
import { WorkoutSession } from '@/pages/WorkoutSession'
import { Habits } from '@/pages/Habits'
import { Body } from '@/pages/Body'
import { SettingsPage } from '@/pages/SettingsPage'

export function App() {
  // BASE_URL is '/' locally and '/<repo>/' on GitHub Pages; strip the trailing
  // slash so react-router treats it as a routing basename.
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

  return (
    <ThemeProvider>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/workouts" element={<Train />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/metrics" element={<Body />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          {/* Full-screen workout logging (no bottom nav) */}
          <Route path="/workouts/:id" element={<WorkoutSession />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
