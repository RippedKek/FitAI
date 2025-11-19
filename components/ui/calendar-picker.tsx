'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'

interface CalendarPickerProps {
  value: string // YYYY-MM-DD format
  onChange: (date: string) => void
  maxDate?: string // YYYY-MM-DD format
  minDate?: string // YYYY-MM-DD format
}

export function CalendarPicker({
  value,
  onChange,
  maxDate,
  minDate,
}: CalendarPickerProps) {
  const [viewDate, setViewDate] = useState(() => {
    const parts = value.split('-')
    return new Date(
      parseInt(parts[0]),
      parseInt(parts[1]) - 1,
      parseInt(parts[2])
    )
  })

  const monthName = useMemo(() => {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]
    return months[viewDate.getMonth()]
  }, [viewDate])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  // Create calendar grid
  const calendarDays = useMemo(() => {
    const days = []

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return days
  }, [startingDayOfWeek, daysInMonth])

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1))
  }

  const handleDayClick = (day: number) => {
    const selected = new Date(year, month, day)
    const dateStr = formatDate(selected)

    // Check bounds
    if (maxDate && dateStr > maxDate) return
    if (minDate && dateStr < minDate) return

    onChange(dateStr)
  }

  const formatDate = (date: Date): string => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const isDateDisabled = (day: number): boolean => {
    const dateStr = formatDate(new Date(year, month, day))
    if (maxDate && dateStr > maxDate) return true
    if (minDate && dateStr < minDate) return true
    return false
  }

  const isDateSelected = (day: number): boolean => {
    return formatDate(new Date(year, month, day)) === value
  }

  const isToday = (day: number): boolean => {
    const today = new Date()
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className='w-full max-w-xs p-3 bg-background border rounded-lg shadow-sm'>
      {/* Header with month/year and navigation */}
      <div className='flex items-center justify-between mb-3 gap-2'>
        <h2 className='text-base font-semibold flex-1'>
          {monthName} {year}
        </h2>
        <div className='flex gap-1 shrink-0'>
          <Button
            variant='outline'
            size='sm'
            onClick={handlePrevMonth}
            className='h-7 w-7 p-0'
          >
            <ChevronLeft className='w-3 h-3' />
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={handleNextMonth}
            className='h-7 w-7 p-0'
          >
            <ChevronRight className='w-3 h-3' />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className='grid grid-cols-7 gap-1 mb-1'>
        {weekDays.map((day) => (
          <div
            key={day}
            className='h-6 flex items-center justify-center text-xs font-medium text-muted-foreground'
          >
            {day.charAt(0)}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className='grid grid-cols-7 gap-1'>
        {calendarDays.map((day, idx) => (
          <button
            key={idx}
            onClick={() => day !== null && handleDayClick(day)}
            disabled={day === null || isDateDisabled(day)}
            className={`h-6 text-xs font-medium transition-colors rounded ${
              day === null
                ? 'invisible'
                : isDateSelected(day)
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : isToday(day)
                ? 'bg-muted border border-primary text-foreground hover:bg-muted/80'
                : isDateDisabled(day)
                ? 'text-muted-foreground cursor-not-allowed opacity-40'
                : 'hover:bg-muted text-foreground'
            }`}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  )
}
