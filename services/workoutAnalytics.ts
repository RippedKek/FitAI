/**
 * Workout Analytics Service
 * Provides analytics and statistics for workout data
 */

import type { WorkoutLog } from '@/lib/firestore'

export interface ExerciseStats {
  exerciseName: string
  totalVolume: number
  totalSets: number
  totalReps: number
  averageWeight: number
  maxWeight: number
  workoutCount: number
}

export interface WeeklyStats {
  week: string // YYYY-WW format
  totalVolume: number
  workoutCount: number
  exercises: ExerciseStats[]
}

/**
 * Calculate total volume for a workout log
 */
export function calculateWorkoutVolume(log: WorkoutLog): number {
  let totalVolume = 0

  for (const exercise of log.exercises) {
    for (const set of exercise.sets) {
      if (set.completed) {
        totalVolume += set.reps * set.weight
      }
    }
  }

  return totalVolume
}

/**
 * Get exercise statistics from workout logs
 */
export function getExerciseStats(logs: WorkoutLog[]): ExerciseStats[] {
  const exerciseMap = new Map<string, ExerciseStats>()

  for (const log of logs) {
    for (const exercise of log.exercises) {
      const exerciseName = exercise.name

      if (!exerciseMap.has(exerciseName)) {
        exerciseMap.set(exerciseName, {
          exerciseName,
          totalVolume: 0,
          totalSets: 0,
          totalReps: 0,
          averageWeight: 0,
          maxWeight: 0,
          workoutCount: 0,
        })
      }

      const stats = exerciseMap.get(exerciseName)!
      stats.workoutCount += 1

      for (const set of exercise.sets) {
        if (set.completed) {
          stats.totalSets += 1
          stats.totalReps += set.reps
          const volume = set.reps * set.weight
          stats.totalVolume += volume
          stats.maxWeight = Math.max(stats.maxWeight, set.weight)
        }
      }
    }
  }

  // Calculate averages
  for (const stats of exerciseMap.values()) {
    if (stats.totalSets > 0) {
      const totalWeight = stats.totalVolume / stats.totalReps
      stats.averageWeight = Math.round(totalWeight * 10) / 10
    }
  }

  return Array.from(exerciseMap.values()).sort(
    (a, b) => b.totalVolume - a.totalVolume
  )
}

/**
 * Get weekly statistics from workout logs
 */
export function getWeeklyStats(logs: WorkoutLog[]): WeeklyStats[] {
  const weekMap = new Map<string, WorkoutLog[]>()

  // Group logs by week
  for (const log of logs) {
    const date = new Date(log.date)
    const year = date.getFullYear()
    const week = getWeekNumber(date)
    const weekKey = `${year}-W${week.toString().padStart(2, '0')}`

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, [])
    }
    weekMap.get(weekKey)!.push(log)
  }

  // Calculate stats for each week
  const weeklyStats: WeeklyStats[] = []

  for (const [week, weekLogs] of weekMap.entries()) {
    const totalVolume = weekLogs.reduce(
      (sum, log) => sum + (log.totalVolume || calculateWorkoutVolume(log)),
      0
    )
    const allExercises = weekLogs.flatMap((log) => log.exercises)
    const exerciseStats = getExerciseStats(weekLogs)

    weeklyStats.push({
      week,
      totalVolume,
      workoutCount: weekLogs.length,
      exercises: exerciseStats,
    })
  }

  // Sort by week (most recent first)
  return weeklyStats.sort((a, b) => b.week.localeCompare(a.week))
}

/**
 * Get week number from date
 */
function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  )
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

/**
 * Get top exercises by volume
 */
export function getTopExercises(
  logs: WorkoutLog[],
  limit: number = 5
): ExerciseStats[] {
  const stats = getExerciseStats(logs)
  return stats.slice(0, limit)
}

/**
 * Get total volume for a date range
 */
export function getTotalVolume(logs: WorkoutLog[]): number {
  return logs.reduce(
    (sum, log) => sum + (log.totalVolume || calculateWorkoutVolume(log)),
    0
  )
}
