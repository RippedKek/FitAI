'use client'

import { useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  useWorkoutLogs,
  useDailyIntake,
  useUpdateDailyIntake,
  useUpdateWorkoutLog,
  useDeleteWorkoutLog,
} from '@/hooks/useFirestore'
import { AuthGuard } from '@/components/layout/auth-guard'
import { SidebarNav } from '@/components/layout/sidebar-nav'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  BarChart3,
  Calendar,
  Flame,
  Dumbbell,
  Printer,
  Clock,
  Trash2,
  Edit,
  CheckCircle2,
  X,
  Utensils,
  TrendingUp,
} from 'lucide-react'
import type { WorkoutLog, DailyIntake } from '@/lib/firestore'

// Simple date formatters
function formatDate(date: Date, formatStr: string): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  if (formatStr === 'yyyy-MM-dd') {
    return `${year}-${month}-${day}`
  }

  // For 'EEE, MMM d, yyyy' format
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  return `${days[date.getDay()]}, ${
    months[date.getMonth()]
  } ${date.getDate()}, ${year}`
}

function formatTabDate(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  return {
    day: days[date.getDay()],
    date: date.getDate().toString(),
    month: months[date.getMonth()],
  }
}

function subDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() - days)
  return result
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function rangeDays(start: Date, end: Date) {
  const days: Date[] = []
  let cur = new Date(start)
  while (cur <= end) {
    days.push(new Date(cur))
    cur = addDays(cur, 1)
  }
  return days
}

export default function StatsPage() {
  const { user } = useAuth()
  const defaultEnd = new Date()
  const defaultStart = subDays(defaultEnd, 6)
  const [startDate, setStartDate] = useState(
    formatDate(defaultStart, 'yyyy-MM-dd')
  )
  const [endDate, setEndDate] = useState(formatDate(defaultEnd, 'yyyy-MM-dd'))

  const { data: workoutLogs } = useWorkoutLogs(
    user?.uid || null,
    startDate,
    endDate
  )

  const dayList = useMemo(() => {
    const s = new Date(startDate)
    const e = new Date(endDate)
    return rangeDays(s, e).map((d) => formatDate(d, 'yyyy-MM-dd'))
  }, [startDate, endDate])

  // Set initial selected date to today or the last date in range
  const [selectedDate, setSelectedDate] = useState(
    dayList[dayList.length - 1] || formatDate(new Date(), 'yyyy-MM-dd')
  )

  const caloriesByDay = useMemo(() => {
    const map: Record<string, number> = {}
    for (const d of dayList) map[d] = 0
    return map
  }, [dayList])

  const volumeByDay = useMemo(() => {
    const map: Record<string, number> = {}
    for (const d of dayList) map[d] = 0
    if (workoutLogs) {
      for (const log of workoutLogs) {
        if (map[log.date] !== undefined) {
          map[log.date] = (map[log.date] || 0) + (log.totalVolume || 0)
        }
      }
    }
    return map
  }, [dayList, workoutLogs])

  // Update selected date when date range changes
  useMemo(() => {
    if (dayList.length > 0 && !dayList.includes(selectedDate)) {
      setSelectedDate(dayList[dayList.length - 1])
    }
  }, [dayList, selectedDate])

  return (
    <AuthGuard>
      <div className='flex min-h-screen flex-col md:flex-row'>
        <SidebarNav />
        <main className='flex-1 pb-16 md:pb-0 md:ml-64'>
          <div className='container mx-auto px-4 py-8 max-w-7xl'>
            {/* Header */}
            <div className='mb-8'>
              <div className='flex items-center gap-3 mb-2'>
                <div className='p-2 rounded-lg bg-primary/10'>
                  <BarChart3 className='w-6 h-6 text-primary' />
                </div>
                <h1 className='text-3xl font-bold'>Statistics</h1>
              </div>
              <p className='text-muted-foreground mt-2'>
                Day-wise overview for meals and workouts. Select a date to view
                details.
              </p>
            </div>

            {/* Date Range Selector */}
            <Card className='mb-6 border-2 shadow-lg'>
              <div className='h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'></div>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Calendar className='w-5 h-5 text-primary' />
                  Date Range
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex flex-wrap gap-4 items-center'>
                  <div className='flex items-center gap-2'>
                    <label className='text-sm font-medium'>Start</label>
                    <Input
                      type='date'
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className='w-40'
                    />
                  </div>
                  <div className='flex items-center gap-2'>
                    <label className='text-sm font-medium'>End</label>
                    <Input
                      type='date'
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className='w-40'
                    />
                  </div>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setStartDate(
                        formatDate(subDays(new Date(), 29), 'yyyy-MM-dd')
                      )
                      setEndDate(formatDate(new Date(), 'yyyy-MM-dd'))
                    }}
                    className='ml-auto'
                  >
                    <Clock className='w-4 h-4 mr-2' />
                    Last 30 days
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
              <Card className='shadow-md hover:shadow-lg transition-all duration-300 group'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <div className='p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 group-hover:scale-110 transition-transform'>
                      <Flame className='w-5 h-5' />
                    </div>
                    Calories (by day)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    <div className='w-full h-32 bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-950/20 rounded-lg p-2'>
                      <svg
                        viewBox='0 0 100 28'
                        className='w-full h-full'
                        preserveAspectRatio='none'
                      >
                        {dayList.map((d, i) => {
                          const barWidth = 100 / Math.max(1, dayList.length)
                          const x = i * barWidth
                          const val = caloriesByDay[d] || 0
                          const h = Math.min(26, (val / 2500) * 26)
                          return (
                            <rect
                              key={d}
                              x={x}
                              y={28 - h}
                              width={barWidth * 0.8}
                              height={h}
                              fill='#3b82f6'
                              rx='1'
                              className='hover:fill-blue-700 transition-colors'
                            />
                          )
                        })}
                      </svg>
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      Daily calories from logged meals
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className='shadow-md hover:shadow-lg transition-all duration-300 group'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <div className='p-2 rounded-lg bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400 group-hover:scale-110 transition-transform'>
                      <Dumbbell className='w-5 h-5' />
                    </div>
                    Workout Volume
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    <div className='w-full h-32 bg-gradient-to-b from-green-50 to-transparent dark:from-green-950/20 rounded-lg p-2'>
                      <svg
                        viewBox='0 0 100 28'
                        className='w-full h-full'
                        preserveAspectRatio='none'
                      >
                        {dayList.map((d, i) => {
                          const barWidth = 100 / Math.max(1, dayList.length)
                          const x = i * barWidth
                          const val = volumeByDay[d] || 0
                          const h = Math.min(26, (val / 10000) * 26)
                          return (
                            <rect
                              key={d}
                              x={x}
                              y={28 - h}
                              width={barWidth * 0.8}
                              height={h}
                              fill='#10b981'
                              rx='1'
                              className='hover:fill-green-700 transition-colors'
                            />
                          )
                        })}
                      </svg>
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      Total volume (kg) from logged workouts
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className='shadow-md hover:shadow-lg transition-all duration-300'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <div className='p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400'>
                      <TrendingUp className='w-5 h-5' />
                    </div>
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex flex-col gap-3'>
                    <Button
                      onClick={() => window.print()}
                      className='w-full shadow-sm hover:shadow-md transition-shadow'
                    >
                      <Printer className='w-4 h-4 mr-2' />
                      Print Report
                    </Button>
                    <p className='text-xs text-muted-foreground text-center'>
                      Export your statistics for records
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Date Tabs - Horizontal Scrollable */}
            <div className='mb-6'>
              <div className='flex items-center gap-2 mb-4'>
                <Calendar className='w-5 h-5 text-primary' />
                <h2 className='text-2xl font-semibold'>Daily Breakdown</h2>
              </div>
              <div className='relative'>
                <div className='overflow-x-auto pb-2'>
                  <div className='flex gap-2 min-w-max'>
                    {dayList.map((d) => {
                      const dateObj = new Date(d)
                      const tabInfo = formatTabDate(dateObj)
                      const isSelected = selectedDate === d
                      const isToday = d === formatDate(new Date(), 'yyyy-MM-dd')

                      return (
                        <button
                          key={d}
                          onClick={() => setSelectedDate(d)}
                          className={`flex flex-col items-center justify-center min-w-[80px] p-3 rounded-xl border-2 transition-all duration-200 ${
                            isSelected
                              ? 'border-primary bg-primary text-primary-foreground shadow-lg scale-105'
                              : 'border-transparent bg-muted hover:border-primary/50 hover:bg-muted/80'
                          }`}
                        >
                          <span className='text-xs font-medium opacity-80'>
                            {tabInfo.day}
                          </span>
                          <span className='text-2xl font-bold my-1'>
                            {tabInfo.date}
                          </span>
                          <span className='text-xs opacity-80'>
                            {tabInfo.month}
                          </span>
                          {isToday && !isSelected && (
                            <span className='text-[10px] mt-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium'>
                              Today
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Date Details */}
            <DayCard
              date={selectedDate}
              uid={user?.uid || null}
              workoutLogs={workoutLogs}
            />
          </div>
        </main>
        <BottomNav />
      </div>
    </AuthGuard>
  )
}

function DayCard({
  date,
  uid,
  workoutLogs,
}: {
  date: string
  uid: string | null
  workoutLogs?: WorkoutLog[] | undefined
}) {
  const { data: intake } = useDailyIntake(uid || null, date)
  const updateIntake = useUpdateDailyIntake()
  const updateLog = useUpdateWorkoutLog()
  const deleteLog = useDeleteWorkoutLog()

  const logsForDay = workoutLogs?.filter((l) => l.date === date) || []
  const totalCalories = intake?.totalCalories || 0
  const totalVolume = logsForDay.reduce((s, l) => s + (l.totalVolume || 0), 0)
  const hasMeals = intake?.meals && intake.meals.length > 0
  const hasWorkouts = logsForDay.length > 0

  return (
    <Card className='shadow-md hover:shadow-lg transition-all duration-300 border-2'>
      <CardHeader className='pb-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <div className='p-1.5 rounded-lg bg-primary/10'>
              <Calendar className='w-4 h-4 text-primary' />
            </div>
            {formatDate(new Date(date), 'EEE, MMM d, yyyy')}
          </CardTitle>
          <div className='flex gap-2'>
            {hasMeals && (
              <span className='inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-xs font-medium'>
                <Utensils className='w-3 h-3' />
                {intake.meals.length}
              </span>
            )}
            {hasWorkouts && (
              <span className='inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 text-xs font-medium'>
                <Dumbbell className='w-3 h-3' />
                {logsForDay.length}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Meals Section */}
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <h3 className='font-semibold flex items-center gap-2'>
                <Flame className='w-4 h-4 text-blue-600' />
                Meals
              </h3>
              <span className='text-sm font-bold text-primary'>
                {Math.round(totalCalories)} kcal
              </span>
            </div>

            {hasMeals ? (
              <div className='space-y-2'>
                {intake.meals.map((m, idx) => (
                  <div
                    key={idx}
                    className='group/meal flex justify-between items-start gap-3 p-3 rounded-xl border-2 border-transparent hover:border-blue-200 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all'
                  >
                    <div className='flex-1'>
                      <p className='font-medium'>{m.name}</p>
                      <div className='flex flex-wrap gap-2 mt-1'>
                        <span className='text-xs px-2 py-0.5 rounded-full bg-muted capitalize'>
                          {m.category}
                        </span>
                        <span className='text-xs text-muted-foreground'>
                          {Math.round(m.calories)} kcal
                        </span>
                      </div>
                    </div>
                    <Button
                      size='sm'
                      variant='ghost'
                      className='opacity-0 group-hover/meal:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950'
                      onClick={() => {
                        const updatedMeals = intake.meals.filter(
                          (_, i) => i !== idx
                        )
                        updateIntake.mutateAsync({
                          uid: uid!,
                          date,
                          intake: {
                            meals: updatedMeals,
                            totalCalories: updatedMeals.reduce(
                              (s, x) => s + x.calories,
                              0
                            ),
                            totalProtein: updatedMeals.reduce(
                              (s, x) => s + x.protein,
                              0
                            ),
                            totalCarbs: updatedMeals.reduce(
                              (s, x) => s + x.carbs,
                              0
                            ),
                            totalFat: updatedMeals.reduce(
                              (s, x) => s + x.fat,
                              0
                            ),
                          },
                        })
                      }}
                    >
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className='p-6 text-center rounded-xl bg-muted/30 border-2 border-dashed'>
                <Utensils className='w-8 h-8 mx-auto mb-2 text-muted-foreground' />
                <p className='text-sm text-muted-foreground'>No meals logged</p>
              </div>
            )}
          </div>

          {/* Workouts Section */}
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <h3 className='font-semibold flex items-center gap-2'>
                <Dumbbell className='w-4 h-4 text-green-600' />
                Workouts
              </h3>
              <span className='text-sm font-bold text-primary'>
                {Math.round(totalVolume)} kg
              </span>
            </div>

            {hasWorkouts ? (
              <div className='space-y-2'>
                {logsForDay.map((log) => (
                  <div
                    key={log.id || log.workoutName}
                    className='p-3 rounded-xl border-2 hover:border-green-200 hover:bg-green-50/50 dark:hover:bg-green-950/20 transition-all'
                  >
                    <div className='flex justify-between items-start gap-3'>
                      <div className='flex-1'>
                        <p className='font-medium'>{log.workoutName}</p>
                        <div className='flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground'>
                          <span>{log.exercises.length} exercises</span>
                          <span>•</span>
                          <span>{Math.round(log.totalVolume)} kg volume</span>
                        </div>
                      </div>
                      <div className='flex gap-1'>
                        <EditWorkoutLogButton
                          log={log}
                          updateLog={updateLog}
                          uid={uid}
                        />
                        <Button
                          size='sm'
                          variant='ghost'
                          className='hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950'
                          onClick={() => {
                            if (!uid || !log.id) return
                            const ok = window.confirm(
                              'Delete this workout log?'
                            )
                            if (!ok) return
                            deleteLog.mutateAsync({ uid: uid, logId: log.id })
                          }}
                        >
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='p-6 text-center rounded-xl bg-muted/30 border-2 border-dashed'>
                <Dumbbell className='w-8 h-8 mx-auto mb-2 text-muted-foreground' />
                <p className='text-sm text-muted-foreground'>
                  No workouts logged
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EditWorkoutLogButton({
  log,
  updateLog,
  uid,
}: {
  log: WorkoutLog
  updateLog: ReturnType<typeof useUpdateWorkoutLog>
  uid: string | null
}) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState<WorkoutLog | null>(null)

  if (!editing) {
    return (
      <Button
        size='sm'
        variant='ghost'
        className='hover:bg-primary/10'
        onClick={() => {
          setLocal(log)
          setEditing(true)
        }}
      >
        <Edit className='w-4 h-4' />
      </Button>
    )
  }

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
      <Card className='w-full max-w-md shadow-2xl'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Edit className='w-5 h-5' />
            Edit Workout Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <Input
              value={local?.notes || ''}
              onChange={(e) =>
                setLocal(local ? { ...local, notes: e.target.value } : null)
              }
              placeholder='Add notes about this workout...'
              className='text-base'
            />
            <div className='flex gap-2'>
              <Button
                onClick={async () => {
                  if (!local || !local.id || !uid) return
                  await updateLog.mutateAsync({
                    uid: uid,
                    logId: local.id,
                    updated: { notes: local.notes },
                  })
                  setEditing(false)
                }}
                className='flex-1'
              >
                <CheckCircle2 className='w-4 h-4 mr-2' />
                Save
              </Button>
              <Button variant='outline' onClick={() => setEditing(false)}>
                <X className='w-4 h-4 mr-2' />
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
