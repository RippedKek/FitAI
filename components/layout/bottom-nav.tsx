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

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className='fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden'>
      <div className='flex h-16 items-center justify-around'>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className='h-5 w-5' />
              <span className='text-xs font-medium'>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
