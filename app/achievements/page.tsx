'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  useUserProfile,
  useUpsertAchievement,
  useUserAchievements,
  useDailyIntake,
} from '@/hooks/useFirestore'
import { getDailyIntake } from '@/lib/firestore'
import { format, subDays } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Award, Sparkles, TrendingUp } from 'lucide-react'
import { AuthGuard } from '@/components/layout/auth-guard'
import { SidebarNav } from '@/components/layout/sidebar-nav'
import { BottomNav } from '@/components/layout/bottom-nav'

type AchievementDef = {
  id: string
  key: string
  title: string
  description: string
  metric: 'protein' | 'carbs'
  thresholdDays: number
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: 'protein_7',
    key: 'protein_7',
    title: 'Protein: 1 Week',
    description: 'Hit protein target 7 days in a row',
    metric: 'protein',
    thresholdDays: 7,
  },
  {
    id: 'protein_14',
    key: 'protein_14',
    title: 'Protein: 2 Weeks',
    description: 'Hit protein target 14 days in a row',
    metric: 'protein',
    thresholdDays: 14,
  },
  {
    id: 'protein_21',
    key: 'protein_21',
    title: 'Protein: 3 Weeks',
    description: 'Hit protein target 21 days in a row',
    metric: 'protein',
    thresholdDays: 21,
  },
  {
    id: 'protein_30',
    key: 'protein_30',
    title: 'Protein: 1 Month',
    description: 'Hit protein target 30 days in a row',
    metric: 'protein',
    thresholdDays: 30,
  },
  {
    id: 'carbs_7',
    key: 'carbs_7',
    title: 'Carbs: 1 Week',
    description: 'Hit carbs target 7 days in a row',
    metric: 'carbs',
    thresholdDays: 7,
  },
  {
    id: 'carbs_14',
    key: 'carbs_14',
    title: 'Carbs: 2 Weeks',
    description: 'Hit carbs target 14 days in a row',
    metric: 'carbs',
    thresholdDays: 14,
  },
  {
    id: 'carbs_21',
    key: 'carbs_21',
    title: 'Carbs: 3 Weeks',
    description: 'Hit carbs target 21 days in a row',
    metric: 'carbs',
    thresholdDays: 21,
  },
  {
    id: 'carbs_30',
    key: 'carbs_30',
    title: 'Carbs: 1 Month',
    description: 'Hit carbs target 30 days in a row',
    metric: 'carbs',
    thresholdDays: 30,
  },
]

export default function AchievementsPage() {
  const { user } = useAuth()
  const { data: profile } = useUserProfile(user?.uid || null)
  const { data: achievements } = useUserAchievements(user?.uid || null)
  const upsert = useUpsertAchievement()

  const [loading, setLoading] = useState(false)
  const [streaks, setStreaks] = useState<{ protein: number; carbs: number }>({
    protein: 0,
    carbs: 0,
  })

  // compute recent intake for the last 60 days (safe cover for up to 30-day achievements)
  useEffect(() => {
    if (!user || !profile) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const days = 60
        const dates = Array.from({ length: days }).map((_, i) =>
          format(subDays(new Date(), i), 'yyyy-MM-dd')
        )
        // fetch all daily intake documents in parallel
        const results = await Promise.all(
          dates.map((d) => getDailyIntake(user.uid, d).catch(() => null))
        )

        // helper to compute current consecutive streak ending today
        const computeStreak = (
          metric: 'protein' | 'carbs',
          targetVal: number
        ) => {
          let streak = 0
          for (let i = 0; i < dates.length; i++) {
            const intake = results[i]
            const value = intake
              ? metric === 'protein'
                ? intake.totalProtein
                : intake.totalCarbs
              : 0
            if (value >= targetVal) {
              streak += 1
            } else {
              break
            }
          }
          return streak
        }

        const proteinTarget = profile.targetProtein || 150
        const carbsTarget = profile.targetCarbs || 250

        const proteinStreak = computeStreak('protein', proteinTarget)
        const carbsStreak = computeStreak('carbs', carbsTarget)

        if (!cancelled) {
          setStreaks({ protein: proteinStreak, carbs: carbsStreak })
        }

        // Upsert achievements for thresholds that are met
        for (const def of ACHIEVEMENT_DEFS) {
          const met =
            def.metric === 'protein'
              ? proteinStreak >= def.thresholdDays
              : carbsStreak >= def.thresholdDays
          if (met) {
            // mark unlocked
            await upsert.mutateAsync({
              uid: user.uid,
              achievementId: def.id,
              data: {
                key: def.key,
                title: def.title,
                description: def.description,
                unlockedAt: new Date().toISOString(),
                level: 1,
              },
            })
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user, profile])

  const byMetric = useMemo(() => {
    return ACHIEVEMENT_DEFS.reduce((acc, def) => {
      acc[def.metric] = acc[def.metric] || []
      const unlocked = achievements?.find((a) => a.key === def.key)
      acc[def.metric].push({ def, unlocked })
      return acc
    }, {} as Record<string, Array<{ def: AchievementDef; unlocked?: any }>>)
  }, [achievements])

  const totalUnlocked = useMemo(() => achievements?.length || 0, [achievements])
  const totalAchievements = ACHIEVEMENT_DEFS.length

  if (!user) return null

  return (
    <AuthGuard>
      <div className='flex min-h-screen flex-col md:flex-row bg-gradient-to-br from-background via-background to-muted/20'>
        <SidebarNav />
        <main className='flex-1 pb-16 md:pb-0 md:ml-64'>
          <div className='container mx-auto px-4 py-8 max-w-7xl'>
            {/* Header Section */}
            <div className='mb-8'>
              <div className='flex items-center gap-3 mb-3'>
                <div className='p-2 rounded-xl bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 border border-yellow-400/30'>
                  <Trophy className='w-8 h-8 text-yellow-500' />
                </div>
                <h1 className='text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent'>
                  Achievements
                </h1>
              </div>
              <p className='text-muted-foreground text-lg ml-16'>
                Earn trophies for consistent nutrition habits. Build your
                streaks from 1 week to 1 month.
              </p>
            </div>

            {/* Stats Overview */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
              <Card className='border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg'>
                <CardContent className='pt-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm text-muted-foreground mb-1'>
                        Total Unlocked
                      </p>
                      <p className='text-3xl font-bold'>
                        {totalUnlocked}/{totalAchievements}
                      </p>
                    </div>
                    <Sparkles className='w-10 h-10 text-yellow-400' />
                  </div>
                </CardContent>
              </Card>

              <Card className='border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg'>
                <CardContent className='pt-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm text-muted-foreground mb-1'>
                        Protein Streak
                      </p>
                      <p className='text-3xl font-bold text-blue-500'>
                        {streaks.protein} days
                      </p>
                    </div>
                    <TrendingUp className='w-10 h-10 text-blue-500' />
                  </div>
                </CardContent>
              </Card>

              <Card className='border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg'>
                <CardContent className='pt-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm text-muted-foreground mb-1'>
                        Carbs Streak
                      </p>
                      <p className='text-3xl font-bold text-green-500'>
                        {streaks.carbs} days
                      </p>
                    </div>
                    <TrendingUp className='w-10 h-10 text-green-500' />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Achievement Cards */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {(['protein', 'carbs'] as const).map((metric) => (
                <Card
                  key={metric}
                  className='border-2 hover:shadow-xl transition-all duration-300'
                >
                  <CardHeader className='pb-4'>
                    <CardTitle className='flex items-center gap-3'>
                      <div
                        className={`p-2 rounded-lg ${
                          metric === 'protein'
                            ? 'bg-blue-500/10'
                            : 'bg-green-500/10'
                        }`}
                      >
                        <Award
                          className={`w-6 h-6 ${
                            metric === 'protein'
                              ? 'text-blue-500'
                              : 'text-green-500'
                          }`}
                        />
                      </div>
                      <div>
                        <div className='text-xl'>
                          {metric === 'protein'
                            ? 'Protein Streaks'
                            : 'Carbs Streaks'}
                        </div>
                        <div className='text-sm font-normal text-muted-foreground'>
                          Current: {streaks[metric]} day
                          {streaks[metric] !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      {byMetric[metric].map(({ def, unlocked }) => {
                        const progress = Math.min(
                          (streaks[metric] / def.thresholdDays) * 100,
                          100
                        )
                        return (
                          <div
                            key={def.id}
                            className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                              unlocked
                                ? 'bg-gradient-to-r from-yellow-400/5 to-yellow-600/5 border-yellow-400/30 hover:border-yellow-400/50 shadow-sm'
                                : 'bg-card border-border hover:border-muted-foreground/30'
                            }`}
                          >
                            {/* Progress bar background */}
                            {!unlocked && (
                              <div
                                className='absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 transition-all duration-500'
                                style={{ width: `${progress}%` }}
                              />
                            )}

                            <div className='relative flex items-center justify-between p-4'>
                              <div className='flex items-center gap-4'>
                                <div
                                  className={`relative ${
                                    unlocked ? 'animate-pulse' : ''
                                  }`}
                                >
                                  <Trophy
                                    className={`w-8 h-8 transition-all duration-300 ${
                                      unlocked
                                        ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                                        : 'text-gray-400 group-hover:text-gray-300'
                                    }`}
                                  />
                                  {unlocked && (
                                    <Sparkles className='absolute -top-1 -right-1 w-4 h-4 text-yellow-300' />
                                  )}
                                </div>
                                <div>
                                  <div className='font-semibold text-base mb-0.5'>
                                    {def.title}
                                  </div>
                                  <div className='text-sm text-muted-foreground'>
                                    {def.description}
                                  </div>
                                  {!unlocked && (
                                    <div className='text-xs text-muted-foreground mt-1'>
                                      Progress: {streaks[metric]}/
                                      {def.thresholdDays} days (
                                      {Math.round(progress)}%)
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className='flex flex-col items-end gap-1'>
                                <div
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    unlocked
                                      ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                                      : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {unlocked
                                    ? '✓ Unlocked'
                                    : `${def.thresholdDays}d goal`}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    </AuthGuard>
  )
}
