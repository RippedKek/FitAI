/**
 * Nutrition Calculator Service
 * Calculates personalized nutrition targets based on user profile
 */

import type { UserProfile } from '@/lib/firestore'

/**
 * Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
 */
function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female' | 'other'
): number {
  // Height in cm, weight in kg
  const heightCm = height
  const weightKg = weight

  // Base BMR calculation
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age

  // Gender adjustment
  if (gender === 'male') {
    bmr += 5
  } else if (gender === 'female') {
    bmr -= 161
  } else {
    // For 'other', use average
    bmr -= 78
  }

  return bmr
}

/**
 * Get activity multiplier based on activity level
 */
function getActivityMultiplier(
  activityLevel: UserProfile['activityLevel']
): number {
  const multipliers = {
    sedentary: 1.2, // Little to no exercise
    light: 1.375, // Light exercise 1-3 days/week
    moderate: 1.55, // Moderate exercise 3-5 days/week
    active: 1.725, // Hard exercise 6-7 days/week
    very_active: 1.9, // Very hard exercise, physical job
  }

  return multipliers[activityLevel]
}

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 */
function calculateTDEE(
  bmr: number,
  activityLevel: UserProfile['activityLevel']
): number {
  return bmr * getActivityMultiplier(activityLevel)
}

/**
 * Calculate target calories based on goal
 */
function calculateTargetCalories(
  tdee: number,
  goal: UserProfile['goal']
): number {
  const adjustments = {
    lose: -500, // 500 calorie deficit for ~1 lb/week loss
    maintain: 0,
    gain: 500, // 500 calorie surplus for ~1 lb/week gain
  }

  return Math.round(tdee + adjustments[goal])
}

/**
 * Calculate macronutrient targets
 * Uses standard ratios: Protein 30%, Carbs 40%, Fat 30%
 * Adjusts based on goal (higher protein for weight loss, higher carbs for gain)
 */
function calculateMacroTargets(
  calories: number,
  goal: UserProfile['goal'],
  weight: number
): {
  protein: number
  carbs: number
  fat: number
} {
  // Protein: 1.6-2.2g per kg of body weight (higher for weight loss)
  const proteinPerKg = goal === 'lose' ? 2.2 : goal === 'gain' ? 1.8 : 2.0
  const protein = Math.round(weight * proteinPerKg)

  // Remaining calories after protein (protein = 4 cal/g)
  const remainingCalories = calories - protein * 4

  // Carbs and Fat split based on goal
  let carbRatio: number
  let fatRatio: number

  if (goal === 'lose') {
    // Lower carbs, higher fat for weight loss
    carbRatio = 0.35
    fatRatio = 0.65
  } else if (goal === 'gain') {
    // Higher carbs for weight gain
    carbRatio = 0.55
    fatRatio = 0.45
  } else {
    // Balanced for maintenance
    carbRatio = 0.45
    fatRatio = 0.55
  }

  // Carbs = 4 cal/g, Fat = 9 cal/g
  const carbCalories = remainingCalories * carbRatio
  const fatCalories = remainingCalories * fatRatio

  const carbs = Math.round(carbCalories / 4)
  const fat = Math.round(fatCalories / 9)

  return {
    protein,
    carbs,
    fat,
  }
}

/**
 * Calculate all nutrition targets based on user profile
 */
export function calculateNutritionTargets(
  profile: Omit<
    UserProfile,
    | 'targetCalories'
    | 'targetProtein'
    | 'targetCarbs'
    | 'targetFat'
    | 'createdAt'
    | 'updatedAt'
  >
): {
  targetCalories: number
  targetProtein: number
  targetCarbs: number
  targetFat: number
} {
  const bmr = calculateBMR(
    profile.weight,
    profile.height,
    profile.age,
    profile.gender
  )
  const tdee = calculateTDEE(bmr, profile.activityLevel)
  const targetCalories = calculateTargetCalories(tdee, profile.goal)
  const macros = calculateMacroTargets(
    targetCalories,
    profile.goal,
    profile.weight
  )

  return {
    targetCalories,
    targetProtein: macros.protein,
    targetCarbs: macros.carbs,
    targetFat: macros.fat,
  }
}

/**
 * Calculate nutrition targets based on target weight instead of current weight
 * Useful for users who have a goal weight in mind
 */
export function calculateNutritionTargetsFromTargetWeight(
  currentWeight: number,
  targetWeight: number,
  height: number,
  age: number,
  gender: 'male' | 'female' | 'other',
  activityLevel: UserProfile['activityLevel'],
  goal: UserProfile['goal']
): {
  targetCalories: number
  targetProtein: number
  targetCarbs: number
  targetFat: number
  estimatedWeeksToGoal: number
} {
  // Use target weight for BMR calculation instead of current weight
  const bmr = calculateBMR(targetWeight, height, age, gender)
  const tdee = calculateTDEE(bmr, activityLevel)
  const targetCalories = calculateTargetCalories(tdee, goal)
  const macros = calculateMacroTargets(targetCalories, goal, targetWeight)

  // Estimate weeks to reach goal weight
  // Assuming ~0.5 kg (~1 lb) per week for weight loss, 0.25 kg per week for gain
  const weightDifference = Math.abs(targetWeight - currentWeight)
  const weeklyChange = goal === 'lose' ? 0.5 : 0.25
  const estimatedWeeksToGoal = Math.round(weightDifference / weeklyChange)

  return {
    targetCalories,
    targetProtein: macros.protein,
    targetCarbs: macros.carbs,
    targetFat: macros.fat,
    estimatedWeeksToGoal,
  }
}
