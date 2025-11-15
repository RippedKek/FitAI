'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  useDailyIntake,
  useAddMeal,
  useUpdateDailyIntake,
} from '@/hooks/useFirestore'
import { AuthGuard } from '@/components/layout/auth-guard'
import { BottomNav } from '@/components/layout/bottom-nav'
import { SidebarNav } from '@/components/layout/sidebar-nav'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { parseFoodInput } from '@/services/aiFoodParser'
import { useUserProfile } from '@/hooks/useFirestore'
import {
  calculateNutritionTargets,
  calculateNutritionTargetsFromTargetWeight,
} from '@/services/nutritionCalculator'
import { format, parseISO } from 'date-fns'
import {
  Loader2,
  Plus,
  Trash2,
  Sparkles,
  Flame,
  Drumstick,
  Wheat,
  Droplet,
} from 'lucide-react'
import type { MealItem } from '@/lib/firestore'

export default function IntakePage() {
  const { user } = useAuth()
  const today = format(new Date(), 'yyyy-MM-dd')
  const [selectedDate, setSelectedDate] = useState<string>(today)

  const { data: dailyIntake, isLoading } = useDailyIntake(
    user?.uid || null,
    selectedDate
  )
  const { data: profile } = useUserProfile(user?.uid || null)
  const addMeal = useAddMeal()
  const updateIntake = useUpdateDailyIntake()

  const [foodInput, setFoodInput] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState('')

  const handleParseAndAdd = async () => {
    if (!user || !foodInput.trim()) return

    setIsParsing(true)
    setParseError('')

    try {
      const result = await parseFoodInput(foodInput.trim())

      if (result.error) {
        setParseError(result.error)
        setIsParsing(false)
        return
      }

      if (result.meals.length === 0) {
        setParseError(
          'No meals could be parsed from your input. Please try again with more specific details.'
        )
        setIsParsing(false)
        return
      }

      // Add each meal to the intake
      for (const meal of result.meals) {
        await addMeal.mutateAsync({
          uid: user.uid,
          date: selectedDate,
          meal: meal as MealItem,
        })
      }

      // Clear input on success
      setFoodInput('')
      setParseError('')
    } catch (error: any) {
      setParseError(error.message || 'Failed to parse food input')
    } finally {
      setIsParsing(false)
    }
  }

  const handleRemoveMeal = async (index: number) => {
    if (!user || !dailyIntake) return

    // Create updated meals array without the removed meal
    const updatedMeals = dailyIntake.meals.filter((_, i) => i !== index)

    // Recalculate totals
    const totalCalories = updatedMeals.reduce((sum, m) => sum + m.calories, 0)
    const totalProtein = updatedMeals.reduce((sum, m) => sum + m.protein, 0)
    const totalCarbs = updatedMeals.reduce((sum, m) => sum + m.carbs, 0)
    const totalFat = updatedMeals.reduce((sum, m) => sum + m.fat, 0)

    // Update the document
    await updateIntake.mutateAsync({
      uid: user.uid,
      date: selectedDate,
      intake: {
        meals: updatedMeals,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
      },
    })
  }

  const mealsByCategory = {
    breakfast:
      dailyIntake?.meals.filter((m) => m.category === 'breakfast') || [],
    lunch: dailyIntake?.meals.filter((m) => m.category === 'lunch') || [],
    dinner: dailyIntake?.meals.filter((m) => m.category === 'dinner') || [],
    snack: dailyIntake?.meals.filter((m) => m.category === 'snack') || [],
  }

  // Compute dynamic targets
  const computedTargets = (() => {
    if (!profile) return null

    // If user already has explicit targets saved, prefer them
    if (
      typeof profile.targetCalories === 'number' &&
      typeof profile.targetProtein === 'number' &&
      typeof profile.targetCarbs === 'number' &&
      typeof profile.targetFat === 'number'
    ) {
      return {
        targetCalories: profile.targetCalories,
        targetProtein: profile.targetProtein,
        targetCarbs: profile.targetCarbs,
        targetFat: profile.targetFat,
      }
    }

    // If user has a targetWeight, calculate from that
    if (
      typeof profile.targetWeight === 'number' &&
      typeof profile.weight === 'number'
    ) {
      return calculateNutritionTargetsFromTargetWeight(
        profile.weight,
        profile.targetWeight,
        profile.height,
        profile.age,
        profile.gender,
        profile.activityLevel,
        profile.goal
      )
    }

    // Fallback: calculate from current profile values
    return calculateNutritionTargets(profile)
  })()

  const targetCalories = computedTargets?.targetCalories ?? 2000
  const targetProtein = computedTargets?.targetProtein ?? 150
  const targetCarbs = computedTargets?.targetCarbs ?? 250
  const targetFat = computedTargets?.targetFat ?? 70

  const pct = (value: number, target: number) =>
    target > 0 ? Math.round((value / target) * 100) : 0

  const categoryConfig = {
    breakfast: {
      emoji: '🌅',
      gradient: 'from-orange-500/10 via-pink-500/10 to-transparent',
    },
    lunch: {
      emoji: '☀️',
      gradient: 'from-yellow-500/10 via-orange-500/10 to-transparent',
    },
    dinner: {
      emoji: '🌙',
      gradient: 'from-blue-500/10 via-purple-500/10 to-transparent',
    },
    snack: {
      emoji: '✨',
      gradient: 'from-green-500/10 via-teal-500/10 to-transparent',
    },
  }

  return (
    <AuthGuard>
      <div className='flex min-h-screen flex-col md:flex-row'>
        <SidebarNav />
        <main className='flex-1 pb-16 md:pb-0 md:ml-64'>
          <div className='container mx-auto px-4 py-8 max-w-4xl'>
            {/* Header */}
            <div className='mb-8'>
              <div className='flex items-center gap-3 mb-2'>
                <div className='p-2 rounded-lg bg-primary/10'>
                  <Sparkles className='w-6 h-6 text-primary' />
                </div>
                <h1 className='text-3xl font-bold tracking-tight'>
                  Food Intake
                </h1>
              </div>
              <div className='flex items-start justify-between'>
                <p className='text-muted-foreground mt-2'>
                  Log your meals using natural language. AI will extract the
                  nutrition information.
                </p>
                <div className='flex items-center gap-2'>
                  <label className='text-sm text-muted-foreground'>Date</label>
                  <Input
                    type='date'
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Input Form */}
            <Card className='mb-6 border-2 shadow-lg hover:shadow-xl transition-all duration-300'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Plus className='w-5 h-5' />
                  Add Food
                </CardTitle>
                <CardDescription>
                  Describe what you ate (e.g., "Grilled chicken breast with
                  brown rice for lunch")
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='food-input'>What did you eat?</Label>
                    <Input
                      id='food-input'
                      placeholder='e.g., Grilled chicken breast 200g, brown rice 1 cup, broccoli'
                      value={foodInput}
                      onChange={(e) => setFoodInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleParseAndAdd()
                        }
                      }}
                      disabled={isParsing}
                      className='text-base py-6'
                    />
                  </div>
                  {parseError && (
                    <div className='rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950 dark:text-red-400 border border-red-200 dark:border-red-900'>
                      {parseError}
                    </div>
                  )}
                  <Button
                    onClick={handleParseAndAdd}
                    disabled={isParsing || !foodInput.trim()}
                    className='w-full py-6 text-base shadow-md hover:shadow-lg transition-all'
                  >
                    {isParsing ? (
                      <>
                        <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                        Parsing with AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className='mr-2 h-5 w-5' />
                        Add Meal
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Daily Summary */}
            {dailyIntake && dailyIntake.meals.length > 0 && (
              <Card className='mb-6 shadow-lg'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <div className='p-1.5 rounded-md bg-primary/10'>
                      <Flame className='w-5 h-5 text-primary' />
                    </div>
                    {selectedDate === today
                      ? "Today's Summary"
                      : `Summary — ${format(
                          parseISO(selectedDate),
                          'EEE, MMM d, yyyy'
                        )}`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                    {/* Calories */}
                    <div className='p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 hover:scale-105 transition-transform duration-200'>
                      <div className='flex items-center gap-2 mb-2'>
                        <Flame className='w-4 h-4 text-primary' />
                        <p className='text-sm font-medium text-muted-foreground'>
                          Calories
                        </p>
                      </div>
                      <div className='flex items-baseline gap-2 mb-3'>
                        <p className='text-3xl font-bold'>
                          {Math.round(dailyIntake.totalCalories)}
                        </p>
                        <p className='text-sm text-muted-foreground'>
                          / {Math.round(targetCalories)} kcal
                        </p>
                      </div>
                      <div className='relative h-2 bg-muted rounded-full overflow-hidden'>
                        <div
                          className='absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-500 ease-out'
                          style={{
                            width: `${Math.min(
                              (dailyIntake.totalCalories / targetCalories) *
                                100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <p className='text-xs text-muted-foreground mt-2 text-right'>
                        {pct(dailyIntake.totalCalories, targetCalories)}%
                      </p>
                    </div>

                    {/* Protein */}
                    <div className='p-4 rounded-xl bg-gradient-to-br from-blue-500/5 to-blue-500/10 hover:scale-105 transition-transform duration-200'>
                      <div className='flex items-center gap-2 mb-2'>
                        <Drumstick className='w-4 h-4 text-blue-600' />
                        <p className='text-sm font-medium text-muted-foreground'>
                          Protein
                        </p>
                      </div>
                      <div className='flex items-baseline gap-2 mb-3'>
                        <p className='text-3xl font-bold'>
                          {Math.round(dailyIntake.totalProtein)}
                        </p>
                        <p className='text-sm text-muted-foreground'>
                          / {Math.round(targetProtein)}g
                        </p>
                      </div>
                      <div className='relative h-2 bg-muted rounded-full overflow-hidden'>
                        <div
                          className='absolute top-0 left-0 h-full bg-blue-600 rounded-full transition-all duration-500 ease-out'
                          style={{
                            width: `${Math.min(
                              (dailyIntake.totalProtein / targetProtein) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <p className='text-xs text-muted-foreground mt-2 text-right'>
                        {pct(dailyIntake.totalProtein, targetProtein)}%
                      </p>
                    </div>

                    {/* Carbs */}
                    <div className='p-4 rounded-xl bg-gradient-to-br from-amber-500/5 to-amber-500/10 hover:scale-105 transition-transform duration-200'>
                      <div className='flex items-center gap-2 mb-2'>
                        <Wheat className='w-4 h-4 text-amber-600' />
                        <p className='text-sm font-medium text-muted-foreground'>
                          Carbs
                        </p>
                      </div>
                      <div className='flex items-baseline gap-2 mb-3'>
                        <p className='text-3xl font-bold'>
                          {Math.round(dailyIntake.totalCarbs)}
                        </p>
                        <p className='text-sm text-muted-foreground'>
                          / {Math.round(targetCarbs)}g
                        </p>
                      </div>
                      <div className='relative h-2 bg-muted rounded-full overflow-hidden'>
                        <div
                          className='absolute top-0 left-0 h-full bg-amber-600 rounded-full transition-all duration-500 ease-out'
                          style={{
                            width: `${Math.min(
                              (dailyIntake.totalCarbs / targetCarbs) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <p className='text-xs text-muted-foreground mt-2 text-right'>
                        {pct(dailyIntake.totalCarbs, targetCarbs)}%
                      </p>
                    </div>

                    {/* Fat */}
                    <div className='p-4 rounded-xl bg-gradient-to-br from-purple-500/5 to-purple-500/10 hover:scale-105 transition-transform duration-200'>
                      <div className='flex items-center gap-2 mb-2'>
                        <Droplet className='w-4 h-4 text-purple-600' />
                        <p className='text-sm font-medium text-muted-foreground'>
                          Fat
                        </p>
                      </div>
                      <div className='flex items-baseline gap-2 mb-3'>
                        <p className='text-3xl font-bold'>
                          {Math.round(dailyIntake.totalFat)}
                        </p>
                        <p className='text-sm text-muted-foreground'>
                          / {Math.round(targetFat)}g
                        </p>
                      </div>
                      <div className='relative h-2 bg-muted rounded-full overflow-hidden'>
                        <div
                          className='absolute top-0 left-0 h-full bg-purple-600 rounded-full transition-all duration-500 ease-out'
                          style={{
                            width: `${Math.min(
                              (dailyIntake.totalFat / targetFat) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <p className='text-xs text-muted-foreground mt-2 text-right'>
                        {pct(dailyIntake.totalFat, targetFat)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Meals by Category */}
            {isLoading ? (
              <div className='flex items-center justify-center py-12'>
                <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
              </div>
            ) : dailyIntake && dailyIntake.meals.length > 0 ? (
              <div className='space-y-6'>
                {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(
                  (category) => {
                    const meals = mealsByCategory[category]
                    if (meals.length === 0) return null

                    const config = categoryConfig[category]

                    return (
                      <Card
                        key={category}
                        className='overflow-hidden shadow-md hover:shadow-lg transition-all duration-300'
                      >
                        <div
                          className={`h-1 bg-gradient-to-r ${config.gradient}`}
                        ></div>
                        <CardHeader className='pb-3'>
                          <CardTitle className='capitalize flex items-center gap-2'>
                            <span className='text-2xl'>{config.emoji}</span>
                            {category}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className='space-y-3'>
                            {meals.map((meal, index) => {
                              const globalIndex = dailyIntake.meals.findIndex(
                                (m) => m === meal
                              )
                              return (
                                <div
                                  key={globalIndex}
                                  className='group/item relative flex items-start justify-between rounded-xl border-2 p-4 hover:border-primary/50 hover:shadow-md transition-all duration-200'
                                >
                                  <div className='flex-1'>
                                    <h4 className='font-semibold text-lg mb-3'>
                                      {meal.name}
                                    </h4>
                                    <div className='flex flex-wrap gap-2'>
                                      <span className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium'>
                                        <Flame className='w-3.5 h-3.5' />
                                        {Math.round(meal.calories)} kcal
                                      </span>
                                      <span className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-sm font-medium'>
                                        <Drumstick className='w-3.5 h-3.5' />
                                        P: {Math.round(meal.protein)}g
                                      </span>
                                      <span className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-sm font-medium'>
                                        <Wheat className='w-3.5 h-3.5' />
                                        C: {Math.round(meal.carbs)}g
                                      </span>
                                      <span className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-sm font-medium'>
                                        <Droplet className='w-3.5 h-3.5' />
                                        F: {Math.round(meal.fat)}g
                                      </span>
                                    </div>
                                  </div>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() =>
                                      handleRemoveMeal(globalIndex)
                                    }
                                    className='ml-4 opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950'
                                  >
                                    <Trash2 className='h-4 w-4' />
                                  </Button>
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  }
                )}
              </div>
            ) : (
              <Card className='shadow-md'>
                <CardContent className='py-16 text-center'>
                  <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4'>
                    <Sparkles className='w-8 h-8 text-muted-foreground' />
                  </div>
                  <p className='text-muted-foreground text-lg'>
                    No meals logged today. Start by adding a meal above!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
        <BottomNav />
      </div>
    </AuthGuard>
  )
}
