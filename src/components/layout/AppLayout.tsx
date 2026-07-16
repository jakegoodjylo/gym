import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppLayout() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      <main className="flex-1 px-4 pb-28 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
