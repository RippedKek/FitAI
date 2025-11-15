'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  UtensilsCrossed,
  Dumbbell,
  Settings,
  Book,
  Trophy,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/intake', label: 'Intake', icon: UtensilsCrossed },
  { href: '/workouts', label: 'Workouts', icon: Dumbbell },
  { href: '/achievements', label: 'Achievements', icon: Trophy },
  { href: '/stats', label: 'Stats', icon: Book },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <aside className='hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:border-r md:border-border md:bg-background'>
      <div className='flex flex-col flex-1 pt-16'>
        <nav className='flex-1 px-4 space-y-1'>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className='h-5 w-5' />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
