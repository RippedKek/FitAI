'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MacroCardProps {
  title: string
  value: number
  target: number
  unit: string
  color: 'blue' | 'green' | 'orange' | 'purple'
}

const colorClasses = {
  blue: 'border-blue-500 bg-blue-50 dark:bg-blue-950',
  green: 'border-green-500 bg-green-50 dark:bg-green-950',
  orange: 'border-orange-500 bg-orange-50 dark:bg-orange-950',
  purple: 'border-purple-500 bg-purple-50 dark:bg-purple-950',
}

const textColors = {
  blue: 'text-blue-600 dark:text-blue-400',
  green: 'text-green-600 dark:text-green-400',
  orange: 'text-orange-600 dark:text-orange-400',
  purple: 'text-purple-600 dark:text-purple-400',
}

export function MacroCard({ title, value, target, unit, color }: MacroCardProps) {
  const percentage = target > 0 ? Math.min((value / target) * 100, 100) : 0
  const isOver = value > target

  return (
    <Card className={cn('border-2', colorClasses[color])}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className={cn('text-2xl font-bold', textColors[color])}>
              {Math.round(value)}
            </span>
            <span className="text-sm text-muted-foreground">
              / {Math.round(target)} {unit}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={cn('h-2 rounded-full transition-all', {
                [textColors[color].replace('text-', 'bg-')]: !isOver,
                'bg-red-500': isOver,
              })}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {percentage.toFixed(0)}% of target
            {isOver && ' (over target)'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

