/**
 * AI Workout Generator Service
 * Uses Google Gemini SDK to generate personalized workout routines with sets and reps
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Exercise, Set } from '@/lib/firestore'

export interface WorkoutGenerationRequest {
  days: number
  daysOfWeek: string[] // e.g., ["Monday", "Tuesday", "Friday"]
  focusAreas: string[] // e.g., ["chest", "legs", "back", "cardio"]
  duration: number // in minutes
  equipment?: string[] // e.g., ["dumbbells", "barbell", "machines"]
  experience?: 'beginner' | 'intermediate' | 'advanced'
}

export interface GeneratedWorkoutDay {
  day: string
  focusArea: string
  exercises: Exercise[]
}

export interface WorkoutGenerationResponse {
  days: GeneratedWorkoutDay[]
  error?: string
}

/**
 * Generate a workout routine using Gemini AI
 */
export async function generateWorkoutRoutine(
  request: WorkoutGenerationRequest
): Promise<WorkoutGenerationResponse> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

  if (!apiKey) {
    return {
      days: [],
      error: 'Gemini API key not configured',
    }
  }

  try {
    const equipmentText = request.equipment?.length
      ? `Available equipment: ${request.equipment.join(', ')}`
      : 'Using bodyweight and basic equipment'

    const prompt = `You are a professional fitness coach. Generate a detailed workout routine based on these specifications:

Workout Days: ${request.days} days per week (${request.daysOfWeek.join(', ')})
Focus Areas: ${request.focusAreas.join(', ')}
Session Duration: ${request.duration} minutes per session
Experience Level: ${request.experience || 'intermediate'}
${equipmentText}

For each workout day, create a list of exercises with:
- Exercise name
- Number of sets
- Reps per set
- Rest period in seconds (optional)

Format the response as a valid JSON array with this structure:
[
  {
    "day": "Monday",
    "focusArea": "chest",
    "exercises": [
      {
        "name": "Bench Press",
        "sets": [
          {"reps": 8, "weight": 0, "completed": false},
          {"reps": 8, "weight": 0, "completed": false},
          {"reps": 8, "weight": 0, "completed": false}
        ]
      },
      {
        "name": "Incline Dumbbell Press",
        "sets": [
          {"reps": 10, "weight": 0, "completed": false},
          {"reps": 10, "weight": 0, "completed": false},
          {"reps": 10, "weight": 0, "completed": false}
        ]
      }
    ]
  }
]

Key requirements:
- Each workout should fit within the ${request.duration} minute duration
- Include 6-10 exercises per session
- Vary rep ranges (heavy 6-8 reps, moderate 8-12 reps, light 12-15 reps)
- Include warm-up exercises at the beginning
- Rest periods should be realistic
- Match the focus areas for each day
- Make it appropriate for ${request.experience || 'intermediate'} level

Return ONLY valid JSON, no other text.`

    const client = new GoogleGenerativeAI(apiKey)
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

    const result = await model.generateContent(prompt)
    const content = result.response.text().trim()

    // Extract JSON from response
    let jsonString = content
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      jsonString = jsonMatch[0]
    }

    const parsedDays = JSON.parse(jsonString)

    // Validate the structure
    if (!Array.isArray(parsedDays)) {
      return {
        days: [],
        error: 'Invalid workout format received from AI',
      }
    }

    const validatedDays: GeneratedWorkoutDay[] = parsedDays.map((day) => ({
      day: day.day || '',
      focusArea: day.focusArea || '',
      exercises: (day.exercises || []).map((exercise: any) => ({
        name: exercise.name || '',
        sets: (exercise.sets || []).map((set: any) => ({
          reps: parseInt(set.reps) || 0,
          weight: parseFloat(set.weight) || 0,
          completed: false,
        })),
      })),
    }))

    return {
      days: validatedDays,
    }
  } catch (error) {
    console.error('Error generating workout:', error)
    return {
      days: [],
      error:
        error instanceof Error
          ? error.message
          : 'Failed to generate workout routine',
    }
  }
}

/**
 * Parse user input preferences and generate a workout request
 */
export function parseWorkoutPreferences(
  userInput: string
): WorkoutGenerationRequest {
  // This is a simple parser - can be enhanced with NLP if needed
  const lowerInput = userInput.toLowerCase()

  // Extract number of days (look for "X days" pattern)
  const daysMatch = userInput.match(/(\d+)\s*(days?|per week)/i)
  const days = daysMatch ? parseInt(daysMatch[1]) : 4

  // Extract days of week
  const daysOfWeek: string[] = []
  const dayNames = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ]
  dayNames.forEach((day) => {
    if (lowerInput.includes(day)) {
      daysOfWeek.push(day.charAt(0).toUpperCase() + day.slice(1))
    }
  })

  // If no specific days mentioned, generate a default schedule
  if (daysOfWeek.length === 0) {
    const defaultSchedules: Record<number, string[]> = {
      3: ['Monday', 'Wednesday', 'Friday'],
      4: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
      5: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      6: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    }
    daysOfWeek.push(...(defaultSchedules[days] || defaultSchedules[4]))
  }

  // Extract focus areas
  const focusKeywords: Record<string, string[]> = {
    chest: ['chest', 'pecs', 'push'],
    back: ['back', 'lats', 'pull'],
    legs: ['legs', 'quads', 'glutes', 'hamstring', 'calves'],
    shoulders: ['shoulders', 'delts', 'shoulder'],
    arms: ['arms', 'biceps', 'triceps', 'forearms'],
    core: ['core', 'abs', 'abdominal'],
    cardio: ['cardio', 'running', 'hiit'],
    fullbody: ['fullbody', 'full body', 'total body'],
  }

  const focusAreas: string[] = []
  Object.entries(focusKeywords).forEach(
    ([focus, keywords]: [string, string[]]) => {
      if (keywords.some((keyword: string) => lowerInput.includes(keyword))) {
        focusAreas.push(focus)
      }
    }
  )

  // Default to a balanced split if no specific focus mentioned
  if (focusAreas.length === 0) {
    if (days === 3) {
      focusAreas.push('fullbody')
    } else if (days === 4) {
      focusAreas.push('chest', 'back', 'legs', 'shoulders')
    } else {
      focusAreas.push('chest', 'back', 'legs', 'shoulders', 'arms')
    }
  }

  // Extract duration
  const durationMatch = userInput.match(/(\d+)\s*(minutes?|mins?|hr|hours?)/i)
  const duration = durationMatch ? parseInt(durationMatch[1]) : 60

  // Extract equipment
  const equipmentKeywords = [
    'dumbbells',
    'barbell',
    'machines',
    'cables',
    'bodyweight',
    'resistance bands',
  ]
  const equipment: string[] = []
  equipmentKeywords.forEach((equip) => {
    if (lowerInput.includes(equip)) {
      equipment.push(equip)
    }
  })

  // Extract experience level
  let experience: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
  if (lowerInput.includes('beginner') || lowerInput.includes('start')) {
    experience = 'beginner'
  } else if (lowerInput.includes('advanced') || lowerInput.includes('expert')) {
    experience = 'advanced'
  }

  return {
    days,
    daysOfWeek,
    focusAreas,
    duration,
    equipment: equipment.length > 0 ? equipment : undefined,
    experience,
  }
}
