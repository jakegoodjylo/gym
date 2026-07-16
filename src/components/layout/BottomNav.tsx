import { NavLink } from 'react-router-dom'
import { LayoutGrid, Dumbbell, CheckSquare, LineChart, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/', label: 'Home', icon: LayoutGrid, end: true },
  { to: '/workouts', label: 'Train', icon: Dumbbell, end: false },
  { to: '/habits', label: 'Habits', icon: CheckSquare, end: false },
  { to: '/metrics', label: 'Body', icon: LineChart, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
]

export function BottomNav() {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-2 text-[10px] uppercase tracking-wider transition-colors',
                isActive ? 'text-foreground' : 'text-muted-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('size-5', isActive && 'text-primary')} strokeWidth={2} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
