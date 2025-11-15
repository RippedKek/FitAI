'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useUserProfile, useUpdateProfile } from '@/hooks/useFirestore'
import {
  calculateNutritionTargets,
  calculateNutritionTargetsFromTargetWeight,
} from '@/services/nutritionCalculator'
import { signOut } from '@/lib/auth'
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
import { useRouter } from 'next/navigation'
import {
  Loader2,
  Settings,
  User,
  Target,
  Flame,
  Drumstick,
  Wheat,
  Droplet,
  Mail,
  LogOut,
  CheckCircle2,
  TrendingUp,
  Scale,
} from 'lucide-react'
import type { UserProfile } from '@/lib/firestore'

export default function SettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { data: profile, isLoading } = useUserProfile(user?.uid || null)
  const updateProfile = useUpdateProfile()

  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    age: '',
    gender: 'male' as UserProfile['gender'],
    activityLevel: 'moderate' as UserProfile['activityLevel'],
    goal: 'maintain' as UserProfile['goal'],
    targetWeight: '',
  })

  const [showTargetWeight, setShowTargetWeight] = useState(false)
  const [calculatedTargets, setCalculatedTargets] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (profile) {
      setFormData({
        weight: profile.weight.toString(),
        height: profile.height.toString(),
        age: profile.age.toString(),
        gender: profile.gender,
        activityLevel: profile.activityLevel,
        goal: profile.goal,
        targetWeight: profile.targetWeight?.toString() || '',
      })
      setShowTargetWeight(!!profile.targetWeight)
    }
  }, [profile])

  useEffect(() => {
    if (
      showTargetWeight &&
      formData.targetWeight &&
      parseFloat(formData.targetWeight) > 0
    ) {
      const targetWeight = parseFloat(formData.targetWeight)
      const weight = parseFloat(formData.weight)
      const height = parseFloat(formData.height)
      const age = parseInt(formData.age)

      if (
        !isNaN(targetWeight) &&
        !isNaN(weight) &&
        !isNaN(height) &&
        !isNaN(age)
      ) {
        const targets = calculateNutritionTargetsFromTargetWeight(
          weight,
          targetWeight,
          height,
          age,
          formData.gender,
          formData.activityLevel,
          formData.goal
        )
        setCalculatedTargets(targets)
      }
    } else {
      setCalculatedTargets(null)
    }
  }, [
    showTargetWeight,
    formData.targetWeight,
    formData.weight,
    formData.height,
    formData.age,
    formData.gender,
    formData.activityLevel,
    formData.goal,
  ])

  const handleSubmit = async () => {
    if (!user) return

    setError('')
    setSuccess('')
    setIsSaving(true)

    try {
      const weight = parseFloat(formData.weight)
      const height = parseFloat(formData.height)
      const age = parseInt(formData.age)

      if (isNaN(weight) || weight <= 0) {
        setError('Please enter a valid weight')
        setIsSaving(false)
        return
      }

      if (isNaN(height) || height <= 0) {
        setError('Please enter a valid height')
        setIsSaving(false)
        return
      }

      if (isNaN(age) || age <= 0 || age > 150) {
        setError('Please enter a valid age')
        setIsSaving(false)
        return
      }

      let targets: any
      let profileData: any = {
        weight,
        height,
        age,
        gender: formData.gender,
        activityLevel: formData.activityLevel,
        goal: formData.goal,
      }

      if (showTargetWeight && formData.targetWeight) {
        const targetWeight = parseFloat(formData.targetWeight)
        if (isNaN(targetWeight) || targetWeight <= 0) {
          setError('Please enter a valid target weight')
          setIsSaving(false)
          return
        }
        targets = calculateNutritionTargetsFromTargetWeight(
          weight,
          targetWeight,
          height,
          age,
          formData.gender,
          formData.activityLevel,
          formData.goal
        )
        profileData.targetWeight = targetWeight
        profileData.estimatedWeeksToGoal = targets.estimatedWeeksToGoal
      } else {
        targets = calculateNutritionTargets({
          weight,
          height,
          age,
          gender: formData.gender,
          activityLevel: formData.activityLevel,
          goal: formData.goal,
        })
      }

      await updateProfile.mutateAsync({
        uid: user.uid,
        profile: {
          ...profileData,
          ...targets,
        },
      })

      setSuccess(
        'Profile updated successfully! Your nutrition targets have been recalculated.'
      )
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth')
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <div className='flex min-h-screen items-center justify-center'>
          <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
        </div>
      </AuthGuard>
    )
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
                  <Settings className='w-6 h-6 text-primary' />
                </div>
                <h1 className='text-3xl font-bold tracking-tight'>Settings</h1>
              </div>
              <p className='text-muted-foreground mt-2'>
                Manage your profile and nutrition targets
              </p>
            </div>

            {/* Profile Form */}
            <Card className='mb-6 border-2 shadow-lg'>
              <div className='h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'></div>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <div className='p-1.5 rounded-md bg-primary/10'>
                    <User className='w-5 h-5 text-primary' />
                  </div>
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your information to get personalized nutrition targets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div className='space-y-2'>
                      <Label
                        htmlFor='weight'
                        className='flex items-center gap-2'
                      >
                        <Scale className='w-4 h-4 text-muted-foreground' />
                        Weight (kg)
                      </Label>
                      <Input
                        id='weight'
                        type='number'
                        step='0.1'
                        min='0'
                        value={formData.weight}
                        onChange={(e) =>
                          setFormData({ ...formData, weight: e.target.value })
                        }
                        required
                        className='text-base'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label
                        htmlFor='height'
                        className='flex items-center gap-2'
                      >
                        <TrendingUp className='w-4 h-4 text-muted-foreground' />
                        Height (cm)
                      </Label>
                      <Input
                        id='height'
                        type='number'
                        step='0.1'
                        min='0'
                        value={formData.height}
                        onChange={(e) =>
                          setFormData({ ...formData, height: e.target.value })
                        }
                        required
                        className='text-base'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='age' className='flex items-center gap-2'>
                        <User className='w-4 h-4 text-muted-foreground' />
                        Age
                      </Label>
                      <Input
                        id='age'
                        type='number'
                        min='1'
                        max='150'
                        value={formData.age}
                        onChange={(e) =>
                          setFormData({ ...formData, age: e.target.value })
                        }
                        required
                        className='text-base'
                      />
                    </div>
                  </div>

                  <div className='border-t pt-6'>
                    <div className='flex items-center space-x-2 mb-4 p-3 rounded-lg hover:bg-muted/50 transition-colors'>
                      <input
                        type='checkbox'
                        id='useTargetWeight'
                        checked={showTargetWeight}
                        onChange={(e) => setShowTargetWeight(e.target.checked)}
                        className='w-4 h-4 rounded border-gray-300'
                      />
                      <Label
                        htmlFor='useTargetWeight'
                        className='font-semibold cursor-pointer flex items-center gap-2'
                      >
                        <Target className='w-4 h-4 text-primary' />
                        Calculate based on target weight
                      </Label>
                    </div>
                    {showTargetWeight && (
                      <div className='space-y-2 p-4 rounded-lg bg-primary/5 border-2 border-primary/20'>
                        <Label
                          htmlFor='targetWeight'
                          className='flex items-center gap-2 font-semibold'
                        >
                          <Target className='w-4 h-4 text-primary' />
                          Target Weight (kg)
                        </Label>
                        <Input
                          id='targetWeight'
                          type='number'
                          step='0.1'
                          min='0'
                          value={formData.targetWeight}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              targetWeight: e.target.value,
                            })
                          }
                          placeholder='Enter your goal weight'
                          className='text-base'
                        />
                        {calculatedTargets && (
                          <div className='flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg mt-2'>
                            <CheckCircle2 className='w-4 h-4 text-green-600 dark:text-green-400' />
                            <p className='text-sm text-green-800 dark:text-green-200'>
                              Estimated time to reach goal:{' '}
                              <span className='font-bold'>
                                {calculatedTargets.estimatedWeeksToGoal} weeks
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='gender'>Gender</Label>
                    <select
                      id='gender'
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gender: e.target.value as UserProfile['gender'],
                        })
                      }
                      className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                      required
                    >
                      <option value='male'>Male</option>
                      <option value='female'>Female</option>
                      <option value='other'>Other</option>
                    </select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='activityLevel'>Activity Level</Label>
                    <select
                      id='activityLevel'
                      value={formData.activityLevel}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          activityLevel: e.target
                            .value as UserProfile['activityLevel'],
                        })
                      }
                      className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                      required
                    >
                      <option value='sedentary'>
                        Sedentary (little to no exercise)
                      </option>
                      <option value='light'>
                        Light (exercise 1-3 days/week)
                      </option>
                      <option value='moderate'>
                        Moderate (exercise 3-5 days/week)
                      </option>
                      <option value='active'>
                        Active (exercise 6-7 days/week)
                      </option>
                      <option value='very_active'>
                        Very Active (hard exercise, physical job)
                      </option>
                    </select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='goal'>Goal</Label>
                    <select
                      id='goal'
                      value={formData.goal}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          goal: e.target.value as UserProfile['goal'],
                        })
                      }
                      className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                      required
                    >
                      <option value='lose'>Lose Weight</option>
                      <option value='maintain'>Maintain Weight</option>
                      <option value='gain'>Gain Weight</option>
                    </select>
                  </div>

                  {error && (
                    <div className='rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950 dark:text-red-400 border border-red-200 dark:border-red-900'>
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className='rounded-lg bg-green-50 p-4 text-sm text-green-600 dark:bg-green-950 dark:text-green-400 border border-green-200 dark:border-green-900 flex items-center gap-2'>
                      <CheckCircle2 className='w-4 h-4' />
                      {success}
                    </div>
                  )}

                  <Button
                    type='button'
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className='w-full py-6 text-base shadow-md hover:shadow-lg transition-shadow'
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className='mr-2 h-5 w-5' />
                        Save Profile
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Current Targets */}
            {profile && (profile.targetCalories || profile.targetProtein) && (
              <Card className='mb-6 shadow-lg'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <div className='p-1.5 rounded-md bg-green-100 dark:bg-green-950'>
                      <Target className='w-5 h-5 text-green-600 dark:text-green-400' />
                    </div>
                    Current Nutrition Targets
                  </CardTitle>
                  <CardDescription>
                    Calculated based on your profile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {profile.targetWeight && (
                    <div className='mb-6 p-4 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-xl border-2 border-primary/20'>
                      <div className='flex items-center gap-2 mb-2'>
                        <Target className='w-5 h-5 text-primary' />
                        <p className='text-sm font-semibold'>Your Goal</p>
                      </div>
                      <p className='text-lg font-bold'>
                        {profile.weight} kg → {profile.targetWeight} kg
                      </p>
                      {profile.estimatedWeeksToGoal && (
                        <p className='text-sm text-muted-foreground mt-1'>
                          Estimated: {profile.estimatedWeeksToGoal} weeks
                        </p>
                      )}
                    </div>
                  )}
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                    <div className='p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 hover:scale-105 transition-transform duration-200'>
                      <div className='flex items-center gap-2 mb-2'>
                        <Flame className='w-4 h-4 text-primary' />
                        <p className='text-sm font-medium text-muted-foreground'>
                          Calories
                        </p>
                      </div>
                      <p className='text-3xl font-bold'>
                        {profile.targetCalories || 'N/A'}
                      </p>
                      <p className='text-xs text-muted-foreground mt-1'>
                        kcal/day
                      </p>
                    </div>
                    <div className='p-4 rounded-xl bg-gradient-to-br from-blue-500/5 to-blue-500/10 hover:scale-105 transition-transform duration-200'>
                      <div className='flex items-center gap-2 mb-2'>
                        <Drumstick className='w-4 h-4 text-blue-600' />
                        <p className='text-sm font-medium text-muted-foreground'>
                          Protein
                        </p>
                      </div>
                      <p className='text-3xl font-bold'>
                        {profile.targetProtein || 'N/A'}
                      </p>
                      <p className='text-xs text-muted-foreground mt-1'>
                        grams
                      </p>
                    </div>
                    <div className='p-4 rounded-xl bg-gradient-to-br from-amber-500/5 to-amber-500/10 hover:scale-105 transition-transform duration-200'>
                      <div className='flex items-center gap-2 mb-2'>
                        <Wheat className='w-4 h-4 text-amber-600' />
                        <p className='text-sm font-medium text-muted-foreground'>
                          Carbs
                        </p>
                      </div>
                      <p className='text-3xl font-bold'>
                        {profile.targetCarbs || 'N/A'}
                      </p>
                      <p className='text-xs text-muted-foreground mt-1'>
                        grams
                      </p>
                    </div>
                    <div className='p-4 rounded-xl bg-gradient-to-br from-purple-500/5 to-purple-500/10 hover:scale-105 transition-transform duration-200'>
                      <div className='flex items-center gap-2 mb-2'>
                        <Droplet className='w-4 h-4 text-purple-600' />
                        <p className='text-sm font-medium text-muted-foreground'>
                          Fat
                        </p>
                      </div>
                      <p className='text-3xl font-bold'>
                        {profile.targetFat || 'N/A'}
                      </p>
                      <p className='text-xs text-muted-foreground mt-1'>
                        grams
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Account Actions */}
            <Card className='shadow-lg'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <div className='p-1.5 rounded-md bg-red-100 dark:bg-red-950'>
                    <Mail className='w-5 h-5 text-red-600 dark:text-red-400' />
                  </div>
                  Account
                </CardTitle>
                <CardDescription>Manage your account settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='p-4 rounded-lg bg-muted/50'>
                    <p className='text-sm font-medium mb-1 flex items-center gap-2'>
                      <Mail className='w-4 h-4 text-muted-foreground' />
                      Email
                    </p>
                    <p className='text-sm font-semibold'>
                      {user?.email || 'N/A'}
                    </p>
                  </div>
                  <Button
                    variant='destructive'
                    onClick={handleSignOut}
                    className='w-full py-6 text-base shadow-md hover:shadow-lg transition-shadow'
                  >
                    <LogOut className='w-5 h-5 mr-2' />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <BottomNav />
      </div>
    </AuthGuard>
  )
}
