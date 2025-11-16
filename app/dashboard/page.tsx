'use client'

import { useAuth } from '@/hooks/useAuth'
import {
  useDailyIntake,
  useUserProfile,
  useUpdateProfile,
} from '@/hooks/useFirestore'
import { useState } from 'react'
import { AuthGuard } from '@/components/layout/auth-guard'
import { BottomNav } from '@/components/layout/bottom-nav'
import { SidebarNav } from '@/components/layout/sidebar-nav'
import { MacroCard } from '@/components/dashboard/macro-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Sparkles,
  TrendingUp,
  Target,
  Utensils,
  Dumbbell,
  Settings,
  Calendar,
  Award,
  ChevronLeft,
  ChevronRight,
  Activity,
} from 'lucide-react'
import { useCardioLogs } from '@/hooks/useFirestore'

// Simple date formatter
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return formatDate(date)
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr)
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]
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
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`
}

export default function DashboardPage() {
  const { user } = useAuth()
  const today = formatDate(new Date())
  const [selectedDate, setSelectedDate] = useState<string>(today)

  const { data: profile, isFetched } = useUserProfile(user?.uid || null)
  const updateProfile = useUpdateProfile()
  const { data: dailyIntake } = useDailyIntake(user?.uid || null, selectedDate)

  const calories = dailyIntake?.totalCalories || 0
  const protein = dailyIntake?.totalProtein || 0
  const carbs = dailyIntake?.totalCarbs || 0
  const fat = dailyIntake?.totalFat || 0

  const targetCalories = profile?.targetCalories || 2000
  const targetProtein = profile?.targetProtein || 150
  const targetCarbs = profile?.targetCarbs || 200
  const targetFat = profile?.targetFat || 65

  const { data: cardioLogsForDate } = useCardioLogs(
    user?.uid || null,
    selectedDate,
    selectedDate
  )
  const cardioCalories = (cardioLogsForDate || []).reduce(
    (s, c: any) => s + (c.caloriesBurned || 0),
    0
  )

  const remainingCalories = Math.max(0, targetCalories - calories)
  const calorieProgress = Math.min((calories / targetCalories) * 100, 100)

  const showOnboarding = !!user && isFetched && !profile
  const [showModal, setShowModal] = useState<boolean>(showOnboarding)

  // Form state for onboarding
  const [onWeight, setOnWeight] = useState<number | ''>('')
  const [onHeight, setOnHeight] = useState<number | ''>('')
  const [onAge, setOnAge] = useState<number | ''>('')
  const [onGender, setOnGender] = useState<'male' | 'female' | 'other'>('male')
  const [onActivity, setOnActivity] = useState<
    'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  >('moderate')
  const [onGoal, setOnGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain')
  const [onTargetWeight, setOnTargetWeight] = useState<number | ''>('')

  if (showOnboarding && !showModal) setShowModal(true)

  const isToday = selectedDate === today

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
                  <TrendingUp className='w-6 h-6 text-primary' />
                </div>
                <h1 className='text-3xl font-bold tracking-tight'>Dashboard</h1>
              </div>
              <p className='text-muted-foreground mt-2'>
                Track your daily nutrition and fitness progress
              </p>
            </div>

            {/* Welcome Card - Only show if user has profile */}
            {profile && (
              <Card className='mb-6 border-2 shadow-lg overflow-hidden'>
                <div className='h-1.5 bg-gradient-to-r from-primary via-purple-500 to-pink-500'></div>
                <CardContent className='pt-6'>
                  <div className='flex items-start justify-between'>
                    <div>
                      <h2 className='text-2xl font-bold mb-2'>
                        Welcome back, {user?.displayName || 'there'}! 👋
                      </h2>
                      <p className='text-muted-foreground mb-4'>
                        {calorieProgress >= 100
                          ? "Great job! You've reached your calorie goal!"
                          : `You have ${remainingCalories} calories remaining.`}
                      </p>
                      <div className='flex flex-wrap gap-3'>
                        <div className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium'>
                          <Target className='w-4 h-4' />
                          Goal: {profile.goal}
                        </div>
                        <div className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-sm font-medium'>
                          <Dumbbell className='w-4 h-4' />
                          {profile.activityLevel}
                        </div>
                      </div>
                    </div>
                    <div className='hidden md:block'>
                      <div className='p-4 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20'>
                        <Award className='w-12 h-12 text-primary' />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Date Selector */}
            <Card className='mb-6 shadow-md'>
              <CardContent className='pt-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <div className='flex items-center gap-2 mb-1'>
                      <Calendar className='w-4 h-4 text-primary' />
                      <span className='text-sm font-medium text-muted-foreground'>
                        Viewing
                      </span>
                    </div>
                    <h3 className='text-xl font-bold'>
                      {formatDisplayDate(selectedDate)}
                      {isToday && (
                        <span className='ml-2 text-sm font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary'>
                          Today
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className='flex items-center gap-2'>
                    <button
                      onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                      className='p-2 rounded-lg hover:bg-muted transition-colors'
                      aria-label='Previous day'
                    >
                      <ChevronLeft className='w-5 h-5' />
                    </button>
                    <input
                      type='date'
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className='px-3 py-2 rounded-lg border border-input bg-background text-sm hover:border-primary transition-colors'
                    />
                    <button
                      onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                      className='p-2 rounded-lg hover:bg-muted transition-colors'
                      aria-label='Next day'
                    >
                      <ChevronRight className='w-5 h-5' />
                    </button>
                    {!isToday && (
                      <button
                        onClick={() => setSelectedDate(today)}
                        className='ml-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors'
                      >
                        Today
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Macro Cards Grid */}
            <div className='mb-8'>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-2'>
                  <Sparkles className='w-5 h-5 text-primary' />
                  <h2 className='text-xl font-semibold'>
                    {isToday ? "Today's" : "Day's"} Nutrition
                  </h2>
                </div>
              </div>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                <MacroCard
                  title='Calories'
                  value={calories}
                  target={targetCalories}
                  unit='kcal'
                  color='blue'
                />
                <MacroCard
                  title='Protein'
                  value={protein}
                  target={targetProtein}
                  unit='g'
                  color='green'
                />
                <MacroCard
                  title='Carbs'
                  value={carbs}
                  target={targetCarbs}
                  unit='g'
                  color='orange'
                />
                <MacroCard
                  title='Fat'
                  value={fat}
                  target={targetFat}
                  unit='g'
                  color='purple'
                />
              </div>
              {cardioCalories > 0 && (
                <Card className='mt-4 border-2 border-orange-200 dark:border-orange-900 bg-gradient-to-br from-orange-50 to-transparent dark:from-orange-950/20'>
                  <CardContent className='pt-4'>
                    <div className='flex items-center gap-3'>
                      <div className='p-2 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400'>
                        <Activity className='w-5 h-5' />
                      </div>
                      <div className='flex-1'>
                        <h3 className='font-semibold text-orange-900 dark:text-orange-100'>
                          Cardio Activity Detected
                        </h3>
                        <p className='text-sm text-orange-700 dark:text-orange-300'>
                          You burned{' '}
                          <span className='font-bold'>
                            {cardioCalories} calories
                          </span>{' '}
                          through cardio today. Great work!
                        </p>
                      </div>
                      <div className='text-right'>
                        <div className='text-3xl font-bold text-orange-600'>
                          {cardioCalories}
                        </div>
                        <div className='text-xs text-orange-600'>
                          kcal burned
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Onboarding Modal for new users */}
            {showModal && (
              <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
                <Card className='w-full max-w-md shadow-2xl'>
                  <div className='h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500'></div>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Sparkles className='w-6 h-6 text-primary' />
                      Welcome — Let's Set Up Your Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-sm text-muted-foreground mb-4'>
                      Enter a few details so we can personalize your targets.
                    </p>
                    <div className='space-y-3'>
                      <div className='grid grid-cols-2 gap-3'>
                        <label className='text-sm'>
                          <span className='font-medium mb-1 block'>
                            Weight (kg)
                          </span>
                          <input
                            className='w-full rounded-lg border border-input px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
                            type='number'
                            value={onWeight as any}
                            onChange={(e) =>
                              setOnWeight(
                                e.target.value ? Number(e.target.value) : ''
                              )
                            }
                          />
                        </label>
                        <label className='text-sm'>
                          <span className='font-medium mb-1 block'>
                            Height (cm)
                          </span>
                          <input
                            className='w-full rounded-lg border border-input px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
                            type='number'
                            value={onHeight as any}
                            onChange={(e) =>
                              setOnHeight(
                                e.target.value ? Number(e.target.value) : ''
                              )
                            }
                          />
                        </label>
                      </div>
                      <div className='grid grid-cols-2 gap-3'>
                        <label className='text-sm'>
                          <span className='font-medium mb-1 block'>Age</span>
                          <input
                            className='w-full rounded-lg border border-input px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
                            type='number'
                            value={onAge as any}
                            onChange={(e) =>
                              setOnAge(
                                e.target.value ? Number(e.target.value) : ''
                              )
                            }
                          />
                        </label>
                        <label className='text-sm'>
                          <span className='font-medium mb-1 block'>Gender</span>
                          <select
                            className='w-full rounded-lg border border-input px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
                            value={onGender}
                            onChange={(e) => setOnGender(e.target.value as any)}
                          >
                            <option value='male'>Male</option>
                            <option value='female'>Female</option>
                            <option value='other'>Other</option>
                          </select>
                        </label>
                      </div>

                      <div className='grid grid-cols-2 gap-3'>
                        <label className='text-sm'>
                          <span className='font-medium mb-1 block'>
                            Activity Level
                          </span>
                          <select
                            className='w-full rounded-lg border border-input px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
                            value={onActivity}
                            onChange={(e) =>
                              setOnActivity(e.target.value as any)
                            }
                          >
                            <option value='sedentary'>Sedentary</option>
                            <option value='light'>Light</option>
                            <option value='moderate'>Moderate</option>
                            <option value='active'>Active</option>
                            <option value='very_active'>Very Active</option>
                          </select>
                        </label>
                        <label className='text-sm'>
                          <span className='font-medium mb-1 block'>Goal</span>
                          <select
                            className='w-full rounded-lg border border-input px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
                            value={onGoal}
                            onChange={(e) => setOnGoal(e.target.value as any)}
                          >
                            <option value='lose'>Lose weight</option>
                            <option value='maintain'>Maintain</option>
                            <option value='gain'>Gain weight</option>
                          </select>
                        </label>
                      </div>

                      <label className='text-sm'>
                        <span className='font-medium mb-1 block'>
                          Target Weight (optional)
                        </span>
                        <input
                          className='w-full rounded-lg border border-input px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
                          type='number'
                          value={onTargetWeight as any}
                          onChange={(e) =>
                            setOnTargetWeight(
                              e.target.value ? Number(e.target.value) : ''
                            )
                          }
                        />
                      </label>

                      <div className='flex gap-2 mt-6'>
                        <button
                          className='flex-1 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg'
                          onClick={async () => {
                            if (!user) return
                            const payload: any = {}
                            if (onWeight) payload.weight = onWeight
                            if (onHeight) payload.height = onHeight
                            if (onAge) payload.age = onAge
                            if (onGender) payload.gender = onGender
                            if (onActivity) payload.activityLevel = onActivity
                            if (onGoal) payload.goal = onGoal
                            if (onTargetWeight)
                              payload.targetWeight = onTargetWeight
                            try {
                              await updateProfile.mutateAsync({
                                uid: user.uid,
                                profile: payload,
                              })
                              setShowModal(false)
                            } catch (err) {
                              console.error(err)
                              alert('Failed to save profile')
                            }
                          }}
                        >
                          Save Profile
                        </button>
                        <button
                          className='px-4 py-3 rounded-lg border border-input hover:bg-muted transition-colors'
                          onClick={() => setShowModal(false)}
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Daily Summary & Quick Actions */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* Today's Summary */}
              <Card className='shadow-md hover:shadow-lg transition-shadow duration-300'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <div className='p-1.5 rounded-md bg-primary/10'>
                      <Calendar className='w-5 h-5 text-primary' />
                    </div>
                    {isToday ? "Today's" : "Day's"} Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='flex justify-between items-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors'>
                      <div className='flex items-center gap-2'>
                        <Utensils className='w-4 h-4 text-muted-foreground' />
                        <span className='text-sm font-medium'>
                          Meals Logged
                        </span>
                      </div>
                      <span className='text-xl font-bold text-primary'>
                        {dailyIntake?.meals.length || 0}
                      </span>
                    </div>

                    {cardioCalories > 0 && (
                      <div className='flex justify-between items-center p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900'>
                        <div className='flex items-center gap-2'>
                          <Activity className='w-4 h-4 text-orange-600' />
                          <span className='text-sm font-medium text-orange-900 dark:text-orange-100'>
                            Cardio Burned
                          </span>
                        </div>
                        <span className='text-xl font-bold text-orange-600'>
                          {cardioCalories} kcal
                        </span>
                      </div>
                    )}

                    <div className='flex justify-between items-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors'>
                      <div className='flex items-center gap-2'>
                        <Target className='w-4 h-4 text-muted-foreground' />
                        <span className='text-sm font-medium'>
                          Remaining Calories
                        </span>
                      </div>
                      <span className='text-xl font-bold text-primary'>
                        {remainingCalories} kcal
                      </span>
                    </div>

                    <div className='flex justify-between items-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors'>
                      <div className='flex items-center gap-2'>
                        <TrendingUp className='w-4 h-4 text-muted-foreground' />
                        <span className='text-sm font-medium'>
                          Daily Progress
                        </span>
                      </div>
                      <span className='text-xl font-bold text-primary'>
                        {Math.round(calorieProgress)}%
                      </span>
                    </div>

                    {profile && (
                      <div className='pt-4 border-t'>
                        <div className='flex items-center gap-2 mb-3'>
                          <Award className='w-4 h-4 text-primary' />
                          <p className='text-sm font-semibold'>Your Goals</p>
                        </div>
                        <div className='space-y-2 text-sm pl-6'>
                          <div className='flex justify-between items-center'>
                            <span className='text-muted-foreground'>Goal:</span>
                            <span className='font-medium'>{profile.goal}</span>
                          </div>
                          <div className='flex justify-between items-center'>
                            <span className='text-muted-foreground'>
                              Activity Level:
                            </span>
                            <span className='font-medium'>
                              {profile.activityLevel}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className='shadow-md hover:shadow-lg transition-shadow duration-300'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <div className='p-1.5 rounded-md bg-primary/10'>
                      <Sparkles className='w-5 h-5 text-primary' />
                    </div>
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground mb-6'>
                    Get started by logging your meals or creating a workout
                    routine.
                  </p>
                  <div className='space-y-3'>
                    <a
                      href='/intake'
                      className='group flex items-center gap-3 p-4 rounded-xl border-2 border-transparent hover:border-primary/50 hover:bg-primary/5 transition-all duration-200'
                    >
                      <div className='p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 group-hover:scale-110 transition-transform'>
                        <Utensils className='w-5 h-5' />
                      </div>
                      <div className='flex-1'>
                        <h4 className='font-semibold'>Log a Meal</h4>
                        <p className='text-xs text-muted-foreground'>
                          Track your food intake
                        </p>
                      </div>
                      <div className='text-muted-foreground group-hover:text-primary transition-colors'>
                        →
                      </div>
                    </a>

                    <a
                      href='/workouts'
                      className='group flex items-center gap-3 p-4 rounded-xl border-2 border-transparent hover:border-primary/50 hover:bg-primary/5 transition-all duration-200'
                    >
                      <div className='p-2 rounded-lg bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400 group-hover:scale-110 transition-transform'>
                        <Dumbbell className='w-5 h-5' />
                      </div>
                      <div className='flex-1'>
                        <h4 className='font-semibold'>Create Workout</h4>
                        <p className='text-xs text-muted-foreground'>
                          Plan your exercises
                        </p>
                      </div>
                      <div className='text-muted-foreground group-hover:text-primary transition-colors'>
                        →
                      </div>
                    </a>

                    <a
                      href='/settings'
                      className='group flex items-center gap-3 p-4 rounded-xl border-2 border-transparent hover:border-primary/50 hover:bg-primary/5 transition-all duration-200'
                    >
                      <div className='p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400 group-hover:scale-110 transition-transform'>
                        <Settings className='w-5 h-5' />
                      </div>
                      <div className='flex-1'>
                        <h4 className='font-semibold'>Update Profile</h4>
                        <p className='text-xs text-muted-foreground'>
                          Adjust your goals
                        </p>
                      </div>
                      <div className='text-muted-foreground group-hover:text-primary transition-colors'>
                        →
                      </div>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    </AuthGuard>
  )
}
