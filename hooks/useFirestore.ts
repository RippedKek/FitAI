'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getUserProfile,
  setUserProfile,
  getDailyIntake,
  addMealToIntake,
  updateDailyIntake,
  getUserWorkouts,
  createWorkout,
  logWorkout,
  getWorkoutLogs,
  type UserProfile,
  type MealItem,
  type Workout,
  type WorkoutLog,
  type DailyIntake,
} from '@/lib/firestore'

/**
 * Hook to get user profile
 */
export function useUserProfile(uid: string | null) {
  return useQuery({
    queryKey: ['userProfile', uid],
    queryFn: () => getUserProfile(uid!),
    enabled: !!uid,
  })
}

/**
 * Hook to update user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      uid,
      profile,
    }: {
      uid: string
      profile: Partial<UserProfile>
    }) => setUserProfile(uid, profile),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['userProfile', variables.uid],
      })
    },
  })
}

/**
 * Hook to get daily intake
 */
export function useDailyIntake(uid: string | null, date: string) {
  return useQuery({
    queryKey: ['dailyIntake', uid, date],
    queryFn: () => getDailyIntake(uid!, date),
    enabled: !!uid && !!date,
  })
}

/**
 * Hook to add meal to intake
 */
export function useAddMeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      uid,
      date,
      meal,
    }: {
      uid: string
      date: string
      meal: MealItem
    }) => addMealToIntake(uid, date, meal),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['dailyIntake', variables.uid, variables.date],
      })
    },
  })
}

/**
 * Hook to update daily intake
 */
export function useUpdateDailyIntake() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      uid,
      date,
      intake,
    }: {
      uid: string
      date: string
      intake: Partial<DailyIntake>
    }) => updateDailyIntake(uid, date, intake),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['dailyIntake', variables.uid, variables.date],
      })
    },
  })
}

/**
 * Hook to get user workouts
 */
export function useUserWorkouts(uid: string | null) {
  return useQuery({
    queryKey: ['userWorkouts', uid],
    queryFn: () => getUserWorkouts(uid!),
    enabled: !!uid,
  })
}

/**
 * Hook to create workout
 */
export function useCreateWorkout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      uid,
      workout,
    }: {
      uid: string
      workout: Omit<Workout, 'createdAt' | 'updatedAt'>
    }) => createWorkout(uid, workout),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['userWorkouts', variables.uid],
      })
    },
  })
}

/**
 * Hook to delete a workout
 */
export function useDeleteWorkout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ uid, workoutId }: { uid: string; workoutId: string }) =>
      // lazy import to avoid circulars
      import('@/lib/firestore').then((m) => m.deleteWorkout(uid, workoutId)),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['userWorkouts', variables.uid],
      })
    },
  })
}

/**
 * Hook to update an existing workout
 */
export function useUpdateWorkout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      uid,
      workoutId,
      workout,
    }: {
      uid: string
      workoutId: string
      workout: Partial<Workout>
    }) =>
      import('@/lib/firestore').then((m) =>
        m.updateWorkout(uid, workoutId, workout)
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['userWorkouts', variables.uid],
      })
    },
  })
}

/**
 * Hook to log workout
 */
export function useLogWorkout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      uid,
      workoutLog,
    }: {
      uid: string
      workoutLog: Omit<WorkoutLog, 'createdAt'>
    }) => logWorkout(uid, workoutLog),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['workoutLogs', variables.uid],
      })
    },
  })
}

/**
 * Hook to update a workout log
 */
export function useUpdateWorkoutLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      uid,
      logId,
      updated,
    }: {
      uid: string
      logId: string
      updated: Partial<WorkoutLog>
    }) =>
      import('@/lib/firestore').then((m) =>
        m.updateWorkoutLog(uid, logId, updated)
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['workoutLogs', variables.uid],
      })
    },
  })
}

/**
 * Hook to delete a workout log
 */
export function useDeleteWorkoutLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ uid, logId }: { uid: string; logId: string }) =>
      import('@/lib/firestore').then((m) => m.deleteWorkoutLog(uid, logId)),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['workoutLogs', variables.uid],
      })
    },
  })
}

/**
 * Hook to get workout logs
 */
export function useWorkoutLogs(
  uid: string | null,
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: ['workoutLogs', uid, startDate, endDate],
    queryFn: () => getWorkoutLogs(uid!, startDate, endDate),
    enabled: !!uid,
  })
}

/**
 * Hook to get user achievements
 */
export function useUserAchievements(uid: string | null) {
  return useQuery({
    queryKey: ['userAchievements', uid],
    queryFn: () =>
      import('@/lib/firestore').then((m) => m.getUserAchievements(uid!)),
    enabled: !!uid,
  })
}

/**
 * Hook to upsert an achievement
 */
export function useUpsertAchievement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      uid,
      achievementId,
      data,
    }: {
      uid: string
      achievementId: string
      data: any
    }) =>
      import('@/lib/firestore').then((m) =>
        m.upsertAchievement(uid, achievementId, data)
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['userAchievements', variables.uid],
      })
    },
  })
}
