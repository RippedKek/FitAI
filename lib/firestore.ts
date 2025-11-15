import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  Timestamp,
  type DocumentData,
  type QuerySnapshot,
} from 'firebase/firestore'
import { db } from './firebase'

// Type definitions
export interface UserProfile {
  weight: number
  height: number
  age: number
  gender: 'male' | 'female' | 'other'
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  goal: 'lose' | 'maintain' | 'gain'
  targetWeight?: number // Target weight for goal-based calculations
  targetCalories?: number
  targetProtein?: number
  targetCarbs?: number
  targetFat?: number
  estimatedWeeksToGoal?: number // Estimated weeks to reach target weight
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface MealItem {
  name: string
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface DailyIntake {
  date: string // YYYY-MM-DD format
  meals: MealItem[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Workout {
  id?: string
  name: string
  exercises: Exercise[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Exercise {
  name: string
  sets: Set[]
}

export interface Set {
  reps: number
  weight: number
  completed: boolean
}

export interface WorkoutLog {
  workoutId: string
  workoutName: string
  id?: string
  date: string // YYYY-MM-DD format
  exercises: Exercise[]
  totalVolume: number
  duration?: number // in minutes
  notes?: string
  createdAt: Timestamp
}

export interface Achievement {
  id?: string
  key: string
  title: string
  description?: string
  level?: number
  unlockedAt?: Timestamp
  meta?: DocumentData
}

/**
 * Get user profile
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const profileRef = doc(db, 'users', uid, 'profile', 'data')
    const profileSnap = await getDoc(profileRef)

    if (profileSnap.exists()) {
      return profileSnap.data() as UserProfile
    }
    return null
  } catch (error) {
    console.error('Error getting user profile:', error)
    throw error
  }
}

/**
 * Create or update user profile
 */
export async function setUserProfile(
  uid: string,
  profile: Partial<UserProfile>
) {
  try {
    const profileRef = doc(db, 'users', uid, 'profile', 'data')
    const profileSnap = await getDoc(profileRef)

    const profileData: Partial<UserProfile> = {
      ...profile,
      updatedAt: Timestamp.now(),
    }

    if (profileSnap.exists()) {
      await updateDoc(profileRef, profileData)
    } else {
      await setDoc(profileRef, {
        ...profileData,
        createdAt: Timestamp.now(),
      } as UserProfile)
    }
  } catch (error) {
    console.error('Error setting user profile:', error)
    throw error
  }
}

/**
 * Get daily intake for a specific date
 */
export async function getDailyIntake(
  uid: string,
  date: string
): Promise<DailyIntake | null> {
  try {
    const intakeRef = doc(db, 'users', uid, 'intake', date)
    const intakeSnap = await getDoc(intakeRef)

    if (intakeSnap.exists()) {
      return intakeSnap.data() as DailyIntake
    }
    return null
  } catch (error) {
    console.error('Error getting daily intake:', error)
    throw error
  }
}

/**
 * Add meal to daily intake
 */
export async function addMealToIntake(
  uid: string,
  date: string,
  meal: MealItem
) {
  try {
    const intakeRef = doc(db, 'users', uid, 'intake', date)
    const intakeSnap = await getDoc(intakeRef)

    const now = Timestamp.now()

    if (intakeSnap.exists()) {
      const currentData = intakeSnap.data() as DailyIntake
      const updatedMeals = [...currentData.meals, meal]

      await updateDoc(intakeRef, {
        meals: updatedMeals,
        totalCalories: updatedMeals.reduce((sum, m) => sum + m.calories, 0),
        totalProtein: updatedMeals.reduce((sum, m) => sum + m.protein, 0),
        totalCarbs: updatedMeals.reduce((sum, m) => sum + m.carbs, 0),
        totalFat: updatedMeals.reduce((sum, m) => sum + m.fat, 0),
        updatedAt: now,
      })
    } else {
      await setDoc(intakeRef, {
        date,
        meals: [meal],
        totalCalories: meal.calories,
        totalProtein: meal.protein,
        totalCarbs: meal.carbs,
        totalFat: meal.fat,
        createdAt: now,
        updatedAt: now,
      } as DailyIntake)
    }
  } catch (error) {
    console.error('Error adding meal to intake:', error)
    throw error
  }
}

/**
 * Get all workouts for a user
 */
export async function getUserWorkouts(uid: string): Promise<Workout[]> {
  try {
    const workoutsRef = collection(db, 'users', uid, 'workouts')
    const workoutsSnap = await getDocs(workoutsRef)

    return workoutsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Workout[]
  } catch (error) {
    console.error('Error getting user workouts:', error)
    throw error
  }
}

/**
 * Get a single workout by ID
 */
export async function getWorkout(
  uid: string,
  workoutId: string
): Promise<Workout | null> {
  try {
    const workoutRef = doc(db, 'users', uid, 'workouts', workoutId)
    const workoutSnap = await getDoc(workoutRef)

    if (workoutSnap.exists()) {
      return {
        id: workoutSnap.id,
        ...workoutSnap.data(),
      } as Workout
    }
    return null
  } catch (error) {
    console.error('Error getting workout:', error)
    throw error
  }
}

/**
 * Create a new workout
 */
export async function createWorkout(
  uid: string,
  workout: Omit<Workout, 'createdAt' | 'updatedAt'>
) {
  try {
    const workoutsRef = collection(db, 'users', uid, 'workouts')
    const now = Timestamp.now()

    await addDoc(workoutsRef, {
      ...workout,
      createdAt: now,
      updatedAt: now,
    })
  } catch (error) {
    console.error('Error creating workout:', error)
    throw error
  }
}

/**
 * Update an existing workout
 */
export async function updateWorkout(
  uid: string,
  workoutId: string,
  workout: Partial<Workout>
) {
  try {
    const workoutRef = doc(db, 'users', uid, 'workouts', workoutId)
    const now = Timestamp.now()
    await updateDoc(workoutRef, {
      ...workout,
      updatedAt: now,
    } as DocumentData)
  } catch (error) {
    console.error('Error updating workout:', error)
    throw error
  }
}

/**
 * Log a workout session
 */
export async function logWorkout(
  uid: string,
  workoutLog: Omit<WorkoutLog, 'createdAt'>
) {
  try {
    const logsRef = collection(db, 'users', uid, 'workoutLogs')
    const now = Timestamp.now()

    await addDoc(logsRef, {
      ...workoutLog,
      createdAt: now,
    })
  } catch (error) {
    console.error('Error logging workout:', error)
    throw error
  }
}

/**
 * Update daily intake (used for removing meals)
 */
export async function updateDailyIntake(
  uid: string,
  date: string,
  intake: Partial<DailyIntake>
) {
  try {
    const intakeRef = doc(db, 'users', uid, 'intake', date)
    const now = Timestamp.now()

    await updateDoc(intakeRef, {
      ...intake,
      updatedAt: now,
    })
  } catch (error) {
    console.error('Error updating daily intake:', error)
    throw error
  }
}

/**
 * Get workout logs for a date range
 */
export async function getWorkoutLogs(
  uid: string,
  startDate?: string,
  endDate?: string
): Promise<WorkoutLog[]> {
  try {
    const logsRef = collection(db, 'users', uid, 'workoutLogs')
    let q = query(logsRef)

    if (startDate) {
      q = query(q, where('date', '>=', startDate))
    }
    if (endDate) {
      q = query(q, where('date', '<=', endDate))
    }

    const logsSnap = await getDocs(q)

    return logsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as WorkoutLog[]
  } catch (error) {
    console.error('Error getting workout logs:', error)
    throw error
  }
}

/**
 * Get user achievements
 */
export async function getUserAchievements(uid: string): Promise<Achievement[]> {
  try {
    const achRef = collection(db, 'users', uid, 'achievements')
    const snap = await getDocs(achRef)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Achievement[]
  } catch (error) {
    console.error('Error getting achievements:', error)
    throw error
  }
}

/**
 * Upsert (create/update) an achievement for a user
 */
export async function upsertAchievement(
  uid: string,
  achievementId: string,
  data: Partial<Achievement>
) {
  try {
    const ref = doc(db, 'users', uid, 'achievements', achievementId)
    const now = Timestamp.now()
    await setDoc(ref, { ...data, updatedAt: now }, { merge: true })
  } catch (error) {
    console.error('Error upserting achievement:', error)
    throw error
  }
}

/**
 * Delete a workout routine
 */
export async function deleteWorkout(uid: string, workoutId: string) {
  try {
    const workoutRef = doc(db, 'users', uid, 'workouts', workoutId)
    await deleteDoc(workoutRef)
  } catch (error) {
    console.error('Error deleting workout:', error)
    throw error
  }
}

/**
 * Update a workout log (used for editing logged sets/stats)
 */
export async function updateWorkoutLog(
  uid: string,
  logId: string,
  updated: Partial<WorkoutLog>
) {
  try {
    const logRef = doc(db, 'users', uid, 'workoutLogs', logId)
    const now = Timestamp.now()
    await updateDoc(logRef, {
      ...updated,
      updatedAt: now,
    } as DocumentData)
  } catch (error) {
    console.error('Error updating workout log:', error)
    throw error
  }
}

/**
 * Delete a workout log
 */
export async function deleteWorkoutLog(uid: string, logId: string) {
  try {
    const logRef = doc(db, 'users', uid, 'workoutLogs', logId)
    await deleteDoc(logRef)
  } catch (error) {
    console.error('Error deleting workout log:', error)
    throw error
  }
}
