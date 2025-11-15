'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  useUserWorkouts,
  useCreateWorkout,
  useLogWorkout,
  useWorkoutLogs,
  useDeleteWorkout,
  useUpdateWorkout,
  useUpdateWorkoutLog,
  useDeleteWorkoutLog,
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
import {
  calculateWorkoutVolume,
  getExerciseStats,
  getWeeklyStats,
} from '@/services/workoutAnalytics'
import {
  generateWorkoutRoutine,
  parseWorkoutPreferences,
  type WorkoutGenerationRequest,
} from '@/services/aiWorkoutGenerator'
import {
  Loader2,
  Plus,
  Dumbbell,
  TrendingUp,
  Wand2,
  Trash2,
  Edit,
  CheckCircle2,
  Circle,
  Sparkles,
  BarChart3,
  Trophy,
} from 'lucide-react'
import type { Workout, Exercise, Set, WorkoutLog } from '@/lib/firestore'

// Simple date formatter
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function subDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() - days)
  return result
}

export default function WorkoutsPage() {
  const { user } = useAuth()
  const today = formatDate(new Date())
  const weekAgo = formatDate(subDays(new Date(), 7))

  const { data: workouts, isLoading: workoutsLoading } = useUserWorkouts(
    user?.uid || null
  )
  const { data: workoutLogs } = useWorkoutLogs(user?.uid || null, weekAgo)
  const createWorkout = useCreateWorkout()
  const logWorkout = useLogWorkout()
  const deleteWorkoutHook = useDeleteWorkout()
  const updateWorkoutLog = useUpdateWorkoutLog()
  const deleteWorkoutLog = useDeleteWorkoutLog()
  const updateWorkoutHook = useUpdateWorkout()

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showAIForm, setShowAIForm] = useState(false)
  const [showLogForm, setShowLogForm] = useState(false)
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)
  const [workoutName, setWorkoutName] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [currentExercise, setCurrentExercise] = useState('')
  const [loggedExercises, setLoggedExercises] = useState<Exercise[]>([])

  // AI Workout Generator state
  const [aiInput, setAiInput] = useState('')
  const [aiGeneratedDays, setAiGeneratedDays] = useState<any[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedAIDay, setSelectedAIDay] = useState<any>(null)
  const [aiWorkoutName, setAiWorkoutName] = useState('')

  const weeklyStats = workoutLogs ? getWeeklyStats(workoutLogs) : []
  const exerciseStats = workoutLogs ? getExerciseStats(workoutLogs) : []

  const handleAddExercise = () => {
    if (!currentExercise.trim()) return

    const newExercise: Exercise = {
      name: currentExercise.trim(),
      sets: [],
    }

    setExercises([...exercises, newExercise])
    setCurrentExercise('')
  }

  const handleAddSet = (exerciseIndex: number) => {
    const updatedExercises = [...exercises]
    updatedExercises[exerciseIndex].sets.push({
      reps: 10,
      weight: 0,
      completed: false,
    })
    setExercises(updatedExercises)
  }

  const handleUpdateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: 'reps' | 'weight',
    value: number
  ) => {
    const updatedExercises = [...exercises]
    updatedExercises[exerciseIndex].sets[setIndex][field] = value
    setExercises(updatedExercises)
  }

  const handleCreateWorkout = async () => {
    if (!user || !workoutName.trim() || exercises.length === 0) return

    if (selectedWorkout && selectedWorkout.id) {
      await updateWorkoutHook.mutateAsync({
        uid: user.uid,
        workoutId: selectedWorkout.id,
        workout: {
          name: workoutName.trim(),
          exercises,
        },
      })
    } else {
      await createWorkout.mutateAsync({
        uid: user.uid,
        workout: {
          name: workoutName.trim(),
          exercises,
        },
      })
    }

    setWorkoutName('')
    setExercises([])
    setSelectedWorkout(null)
    setShowCreateForm(false)
  }

  const handleGenerateWorkout = async () => {
    if (!aiInput.trim()) return

    setIsGenerating(true)
    try {
      const preferences = parseWorkoutPreferences(aiInput)
      const response = await generateWorkoutRoutine(preferences)

      if (response.error) {
        alert(`Error generating workout: ${response.error}`)
      } else {
        setAiGeneratedDays(response.days)
      }
    } catch (error) {
      console.error('Error generating workout:', error)
      alert('Failed to generate workout. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCreateFromAI = async () => {
    if (!user || !selectedAIDay || !aiWorkoutName.trim()) return

    await createWorkout.mutateAsync({
      uid: user.uid,
      workout: {
        name: aiWorkoutName.trim(),
        exercises: selectedAIDay.exercises,
      },
    })

    setAiWorkoutName('')
    setSelectedAIDay(null)
    setAiGeneratedDays([])
    setAiInput('')
    setShowAIForm(false)
  }

  const handleStartLogging = (workout: Workout) => {
    setSelectedWorkout(workout)
    setLoggedExercises(
      workout.exercises.map((ex) => ({
        ...ex,
        sets: ex.sets.map((set) => ({ ...set, completed: false })),
      }))
    )
    setShowLogForm(true)
  }

  const handleCompleteAllSets = (exerciseIndex: number) => {
    const updated = [...loggedExercises]
    updated[exerciseIndex].sets = updated[exerciseIndex].sets.map((s) => ({
      ...s,
      completed: true,
    }))
    setLoggedExercises(updated)
  }

  const handleUpdateLoggedSet = (
    exerciseIndex: number,
    setIndex: number,
    field: 'reps' | 'weight',
    value: number
  ) => {
    const updated = [...loggedExercises]
    updated[exerciseIndex].sets[setIndex][field] = value
    setLoggedExercises(updated)
  }

  const handleToggleSetComplete = (exerciseIndex: number, setIndex: number) => {
    const updated = [...loggedExercises]
    updated[exerciseIndex].sets[setIndex].completed =
      !updated[exerciseIndex].sets[setIndex].completed
    setLoggedExercises(updated)
  }

  const handleLogWorkout = async () => {
    if (!user || !selectedWorkout) return

    const totalVolume = loggedExercises.reduce((sum, ex) => {
      return (
        sum +
        ex.sets.reduce((setSum, set) => {
          return set.completed ? setSum + set.reps * set.weight : setSum
        }, 0)
      )
    }, 0)

    await logWorkout.mutateAsync({
      uid: user.uid,
      workoutLog: {
        workoutId: selectedWorkout.id || '',
        workoutName: selectedWorkout.name,
        date: today,
        exercises: loggedExercises,
        totalVolume,
      },
    })

    setShowLogForm(false)
    setSelectedWorkout(null)
    setLoggedExercises([])
  }

  return (
    <AuthGuard>
      <div className='flex min-h-screen flex-col md:flex-row'>
        <SidebarNav />
        <main className='flex-1 pb-16 md:pb-0 md:ml-64'>
          <div className='container mx-auto px-4 py-8 max-w-7xl'>
            {/* Header */}
            <div className='mb-8 flex items-center justify-between'>
              <div>
                <div className='flex items-center gap-3 mb-2'>
                  <div className='p-2 rounded-lg bg-primary/10'>
                    <Dumbbell className='w-6 h-6 text-primary' />
                  </div>
                  <h1 className='text-3xl font-bold tracking-tight'>
                    Workouts
                  </h1>
                </div>
                <p className='text-muted-foreground mt-2'>
                  Create routines and track your training sessions
                </p>
              </div>
              <div className='flex gap-2'>
                <Button
                  onClick={() => setShowAIForm(true)}
                  variant='outline'
                  className='shadow-sm hover:shadow-md transition-shadow'
                >
                  <Wand2 className='mr-2 h-4 w-4' />
                  AI Generate
                </Button>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className='shadow-md hover:shadow-lg transition-shadow'
                >
                  <Plus className='mr-2 h-4 w-4' />
                  New Workout
                </Button>
              </div>
            </div>

            {/* AI Workout Generator Form */}
            {showAIForm && (
              <Card className='mb-6 border-2 shadow-lg'>
                <div className='h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500'></div>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <div className='p-1.5 rounded-md bg-purple-100 dark:bg-purple-950'>
                      <Wand2 className='h-5 w-5 text-purple-600 dark:text-purple-400' />
                    </div>
                    AI Workout Generator
                  </CardTitle>
                  <CardDescription>
                    Describe your workout preferences and AI will create a
                    personalized routine
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='ai-input'>Workout Preferences</Label>
                      <textarea
                        id='ai-input'
                        placeholder="e.g., 'Generate a 4-day split on Monday, Tuesday, Thursday, Friday focusing on chest, back, legs, and shoulders. 60 minutes per session with dumbbells and barbells. Intermediate level.'"
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        className='flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                      />
                      <p className='text-xs text-muted-foreground mt-2'>
                        Include: number of days, which days of week, focus areas
                        (chest, back, legs, etc.), duration, equipment, and
                        experience level
                      </p>
                    </div>

                    {!selectedAIDay && aiGeneratedDays.length === 0 && (
                      <div className='flex gap-2'>
                        <Button
                          onClick={handleGenerateWorkout}
                          disabled={!aiInput.trim() || isGenerating}
                          className='flex-1'
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className='mr-2 h-4 w-4' />
                              Generate Workout
                            </>
                          )}
                        </Button>
                        <Button
                          variant='outline'
                          onClick={() => setShowAIForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}

                    {/* AI Generated Days */}
                    {aiGeneratedDays.length > 0 && !selectedAIDay && (
                      <div className='space-y-4'>
                        <h3 className='font-semibold flex items-center gap-2'>
                          <Sparkles className='w-4 h-4 text-primary' />
                          Generated Workout Days
                        </h3>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          {aiGeneratedDays.map((day, idx) => (
                            <Card
                              key={idx}
                              className='cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200'
                              onClick={() => setSelectedAIDay(day)}
                            >
                              <CardHeader className='pb-3'>
                                <CardTitle className='text-base'>
                                  {day.day}
                                </CardTitle>
                                <CardDescription>
                                  {day.focusArea}
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                  <Dumbbell className='w-4 h-4' />
                                  <span>{day.exercises.length} exercises</span>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                        <Button
                          variant='outline'
                          onClick={() => {
                            setAiGeneratedDays([])
                            setAiInput('')
                          }}
                        >
                          Back
                        </Button>
                      </div>
                    )}

                    {/* Selected AI Day Details */}
                    {selectedAIDay && (
                      <div className='space-y-4'>
                        <div className='space-y-2'>
                          <Label htmlFor='ai-workout-name'>
                            Workout Routine Name
                          </Label>
                          <Input
                            id='ai-workout-name'
                            placeholder={`e.g., ${selectedAIDay.day} - ${selectedAIDay.focusArea}`}
                            value={aiWorkoutName}
                            onChange={(e) => setAiWorkoutName(e.target.value)}
                          />
                        </div>

                        <div>
                          <h4 className='font-semibold mb-3 flex items-center gap-2'>
                            <Dumbbell className='w-4 h-4 text-primary' />
                            {selectedAIDay.day} Workout
                          </h4>
                          <div className='space-y-3'>
                            {selectedAIDay.exercises.map(
                              (exercise: Exercise, exIdx: number) => (
                                <Card
                                  key={exIdx}
                                  className='bg-muted/30 border-muted'
                                >
                                  <CardContent className='pt-4'>
                                    <p className='font-medium mb-2'>
                                      {exercise.name}
                                    </p>
                                    <div className='space-y-1 text-sm'>
                                      {exercise.sets.map((set, setIdx) => (
                                        <p
                                          key={setIdx}
                                          className='text-muted-foreground'
                                        >
                                          Set {setIdx + 1}: {set.reps} reps
                                        </p>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>
                              )
                            )}
                          </div>
                        </div>

                        <div className='flex gap-2'>
                          <Button
                            onClick={handleCreateFromAI}
                            disabled={
                              !aiWorkoutName.trim() || createWorkout.isPending
                            }
                            className='flex-1'
                          >
                            {createWorkout.isPending ? (
                              <>
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                Creating...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className='mr-2 h-4 w-4' />
                                Save Workout
                              </>
                            )}
                          </Button>
                          <Button
                            variant='outline'
                            onClick={() => {
                              setSelectedAIDay(null)
                              setAiWorkoutName('')
                            }}
                          >
                            Back
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Create Workout Form */}
            {showCreateForm && (
              <Card className='mb-6 border-2 shadow-lg'>
                <div className='h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500'></div>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Plus className='w-5 h-5' />
                    {selectedWorkout
                      ? 'Edit Workout Routine'
                      : 'Create Workout Routine'}
                  </CardTitle>
                  <CardDescription>
                    Define exercises and sets for your routine
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='workout-name'>Workout Name</Label>
                      <Input
                        id='workout-name'
                        placeholder='e.g., Push Day, Leg Day'
                        value={workoutName}
                        onChange={(e) => setWorkoutName(e.target.value)}
                        className='text-base'
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label>Exercises</Label>
                      <div className='flex gap-2'>
                        <Input
                          placeholder='Exercise name'
                          value={currentExercise}
                          onChange={(e) => setCurrentExercise(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddExercise()
                            }
                          }}
                        />
                        <Button onClick={handleAddExercise} variant='outline'>
                          <Plus className='w-4 h-4 mr-2' />
                          Add
                        </Button>
                      </div>
                    </div>

                    {exercises.map((exercise, exIndex) => (
                      <Card key={exIndex} className='shadow-sm'>
                        <CardHeader className='pb-3'>
                          <div className='flex items-center justify-between'>
                            <CardTitle className='text-lg flex items-center gap-2'>
                              <Dumbbell className='w-4 h-4 text-primary' />
                              {exercise.name}
                            </CardTitle>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => {
                                setExercises(
                                  exercises.filter((_, i) => i !== exIndex)
                                )
                              }}
                              className='hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950'
                            >
                              <Trash2 className='w-4 h-4' />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className='space-y-2'>
                            {exercise.sets.map((set, setIndex) => (
                              <div
                                key={setIndex}
                                className='flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors'
                              >
                                <span className='text-sm font-medium text-muted-foreground w-14'>
                                  Set {setIndex + 1}
                                </span>
                                <Input
                                  type='number'
                                  placeholder='Reps'
                                  value={set.reps}
                                  onChange={(e) =>
                                    handleUpdateSet(
                                      exIndex,
                                      setIndex,
                                      'reps',
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className='w-20'
                                />
                                <span className='text-sm text-muted-foreground font-bold'>
                                  ×
                                </span>
                                <Input
                                  type='number'
                                  placeholder='Weight (kg)'
                                  value={set.weight}
                                  onChange={(e) =>
                                    handleUpdateSet(
                                      exIndex,
                                      setIndex,
                                      'weight',
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className='w-24'
                                />
                                <span className='text-xs text-muted-foreground'>
                                  kg
                                </span>
                              </div>
                            ))}
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleAddSet(exIndex)}
                              className='w-full'
                            >
                              <Plus className='w-4 h-4 mr-2' />
                              Add Set
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <div className='flex gap-2'>
                      <Button
                        onClick={handleCreateWorkout}
                        disabled={
                          !workoutName.trim() ||
                          exercises.length === 0 ||
                          createWorkout.isPending
                        }
                        className='flex-1'
                      >
                        {createWorkout.isPending ? (
                          <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            {selectedWorkout ? 'Updating...' : 'Creating...'}
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className='mr-2 h-4 w-4' />
                            {selectedWorkout
                              ? 'Update Workout'
                              : 'Create Workout'}
                          </>
                        )}
                      </Button>
                      <Button
                        variant='outline'
                        onClick={() => {
                          setShowCreateForm(false)
                          setSelectedWorkout(null)
                          setWorkoutName('')
                          setExercises([])
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Log Workout Form */}
            {showLogForm && selectedWorkout && (
              <Card className='mb-6 border-2 shadow-lg'>
                <div className='h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500'></div>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Dumbbell className='w-5 h-5 text-primary' />
                    Log Workout: {selectedWorkout.name}
                  </CardTitle>
                  <CardDescription>
                    Track your sets, reps, and weight
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {loggedExercises.map((exercise, exIndex) => (
                      <Card key={exIndex} className='shadow-sm'>
                        <CardHeader className='pb-3'>
                          <CardTitle className='text-lg flex items-center gap-2'>
                            <Dumbbell className='w-4 h-4 text-primary' />
                            {exercise.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className='space-y-2'>
                            {exercise.sets.map((set, setIndex) => (
                              <div
                                key={setIndex}
                                className='flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors'
                              >
                                <button
                                  onClick={() =>
                                    handleToggleSetComplete(exIndex, setIndex)
                                  }
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                    set.completed
                                      ? 'bg-green-500 border-green-500'
                                      : 'border-muted-foreground hover:border-primary'
                                  }`}
                                >
                                  {set.completed && (
                                    <CheckCircle2 className='w-4 h-4 text-white' />
                                  )}
                                </button>
                                <span className='text-sm font-medium text-muted-foreground w-14'>
                                  Set {setIndex + 1}
                                </span>
                                <Input
                                  type='number'
                                  placeholder='Reps'
                                  value={set.reps}
                                  onChange={(e) =>
                                    handleUpdateLoggedSet(
                                      exIndex,
                                      setIndex,
                                      'reps',
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className='w-20'
                                />
                                <span className='text-sm text-muted-foreground font-bold'>
                                  ×
                                </span>
                                <Input
                                  type='number'
                                  placeholder='Weight (kg)'
                                  value={set.weight}
                                  onChange={(e) =>
                                    handleUpdateLoggedSet(
                                      exIndex,
                                      setIndex,
                                      'weight',
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className='w-24'
                                />
                                <span className='text-xs text-muted-foreground'>
                                  kg
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className='mt-3 flex gap-2'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleCompleteAllSets(exIndex)}
                              className='flex-1'
                            >
                              <CheckCircle2 className='w-4 h-4 mr-2' />
                              Complete All
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => {
                                const updated = [...loggedExercises]
                                updated[exIndex].sets = updated[
                                  exIndex
                                ].sets.map((s) => ({ ...s, completed: false }))
                                setLoggedExercises(updated)
                              }}
                            >
                              Reset
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <div className='flex gap-2'>
                      <Button
                        onClick={handleLogWorkout}
                        disabled={logWorkout.isPending}
                        className='flex-1'
                      >
                        {logWorkout.isPending ? (
                          <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Logging...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className='mr-2 h-4 w-4' />
                            Complete Workout
                          </>
                        )}
                      </Button>
                      <Button
                        variant='outline'
                        onClick={() => setShowLogForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Workout Routines */}
            <div className='mb-8'>
              <div className='flex items-center gap-2 mb-4'>
                <Trophy className='w-5 h-5 text-primary' />
                <h2 className='text-2xl font-semibold'>Your Routines</h2>
              </div>
              {workoutsLoading ? (
                <div className='flex items-center justify-center py-12'>
                  <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
                </div>
              ) : workouts && workouts.length > 0 ? (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {workouts.map((workout) => (
                    <Card
                      key={workout.id}
                      className='group shadow-md hover:shadow-lg transition-all duration-200'
                    >
                      <CardHeader>
                        <CardTitle className='flex items-center gap-2'>
                          <Dumbbell className='w-5 h-5 text-primary' />
                          {workout.name}
                        </CardTitle>
                        <CardDescription className='flex items-center gap-1'>
                          <span>{workout.exercises.length} exercises</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className='space-y-2 mb-4'>
                          {workout.exercises
                            .slice(0, 3)
                            .map((exercise, idx) => (
                              <p
                                key={idx}
                                className='text-sm text-muted-foreground flex items-start gap-2'
                              >
                                <span className='text-primary mt-0.5'>•</span>
                                <span>
                                  {exercise.name} ({exercise.sets.length} sets)
                                </span>
                              </p>
                            ))}
                          {workout.exercises.length > 3 && (
                            <p className='text-sm text-muted-foreground flex items-start gap-2'>
                              <span className='text-primary mt-0.5'>•</span>
                              <span>+ {workout.exercises.length - 3} more</span>
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => handleStartLogging(workout)}
                          className='w-full mb-2 shadow-sm hover:shadow-md transition-shadow'
                        >
                          <Dumbbell className='mr-2 h-4 w-4' />
                          Start Workout
                        </Button>
                        <div className='grid grid-cols-2 gap-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => {
                              setShowCreateForm(true)
                              setWorkoutName(workout.name)
                              setExercises(workout.exercises)
                              setSelectedWorkout(workout)
                            }}
                            className='hover:border-primary/50 transition-colors'
                          >
                            <Edit className='w-4 h-4 mr-1' />
                            Edit
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={async () => {
                              if (!user) return
                              if (!workout.id) return
                              const ok = window.confirm(
                                `Delete workout "${workout.name}"? This cannot be undone.`
                              )
                              if (!ok) return
                              try {
                                await deleteWorkoutHook.mutateAsync({
                                  uid: user.uid,
                                  workoutId: workout.id,
                                })
                              } catch (err) {
                                console.error(err)
                                alert('Failed to delete workout')
                              }
                            }}
                            className='hover:border-red-500 hover:text-red-600 transition-colors'
                          >
                            <Trash2 className='w-4 h-4 mr-1' />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className='shadow-md'>
                  <CardContent className='py-16 text-center'>
                    <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4'>
                      <Dumbbell className='w-8 h-8 text-muted-foreground' />
                    </div>
                    <p className='text-muted-foreground text-lg mb-2'>
                      No workout routines yet
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      Create your first routine above!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Statistics */}
            {workoutLogs && workoutLogs.length > 0 && (
              <div className='space-y-6'>
                <div className='flex items-center gap-2'>
                  <BarChart3 className='w-5 h-5 text-primary' />
                  <h2 className='text-2xl font-semibold'>Statistics</h2>
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                  {/* Weekly Stats */}
                  {weeklyStats.length > 0 && (
                    <Card className='shadow-md hover:shadow-lg transition-shadow'>
                      <CardHeader>
                        <CardTitle className='flex items-center gap-2'>
                          <div className='p-1.5 rounded-md bg-primary/10'>
                            <TrendingUp className='h-5 w-5 text-primary' />
                          </div>
                          Weekly Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='space-y-4'>
                          {weeklyStats.slice(0, 4).map((week, idx) => (
                            <div
                              key={week.week}
                              className='p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 hover:scale-[1.02] transition-transform'
                            >
                              <div className='flex justify-between items-center mb-2'>
                                <span className='font-semibold text-lg'>
                                  {week.week}
                                </span>
                                <span className='inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium'>
                                  <Dumbbell className='w-3 h-3' />
                                  {week.workoutCount}
                                </span>
                              </div>
                              <div className='flex items-center gap-2'>
                                <BarChart3 className='w-4 h-4 text-muted-foreground' />
                                <p className='text-sm text-muted-foreground'>
                                  Total Volume:{' '}
                                  <span className='font-semibold text-foreground'>
                                    {Math.round(week.totalVolume)} kg
                                  </span>
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Top Exercises */}
                  {exerciseStats.length > 0 && (
                    <Card className='shadow-md hover:shadow-lg transition-shadow'>
                      <CardHeader>
                        <CardTitle className='flex items-center gap-2'>
                          <div className='p-1.5 rounded-md bg-purple-100 dark:bg-purple-950'>
                            <Trophy className='h-5 w-5 text-purple-600 dark:text-purple-400' />
                          </div>
                          Top Exercises
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='space-y-3'>
                          {exerciseStats.slice(0, 5).map((stat, idx) => (
                            <div
                              key={stat.exerciseName}
                              className='p-4 rounded-xl border-2 border-transparent hover:border-primary/30 hover:bg-muted/50 transition-all'
                            >
                              <div className='flex items-start justify-between gap-4'>
                                <div className='flex-1'>
                                  <div className='flex items-center gap-2 mb-2'>
                                    <span className='flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold'>
                                      {idx + 1}
                                    </span>
                                    <p className='font-semibold'>
                                      {stat.exerciseName}
                                    </p>
                                  </div>
                                  <div className='flex flex-wrap gap-2 text-xs'>
                                    <span className='inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'>
                                      <Dumbbell className='w-3 h-3' />
                                      {stat.workoutCount} workouts
                                    </span>
                                    <span className='inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'>
                                      {stat.totalSets} sets
                                    </span>
                                  </div>
                                </div>
                                <div className='text-right'>
                                  <p className='text-2xl font-bold text-primary'>
                                    {Math.round(stat.totalVolume)}
                                  </p>
                                  <p className='text-xs text-muted-foreground'>
                                    kg total
                                  </p>
                                  <p className='text-xs text-muted-foreground mt-1'>
                                    Avg: {stat.averageWeight} kg
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
        <BottomNav />
      </div>
    </AuthGuard>
  )
}
