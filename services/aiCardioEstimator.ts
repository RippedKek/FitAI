import { GoogleGenerativeAI } from '@google/generative-ai'

export interface CardioInput {
  method: 'steps' | 'time'
  steps?: number
  durationMinutes?: number
  avgPaceMinPerKm?: number
  distanceKm?: number
}

export interface UserProfileForEstimation {
  weight: number
  height?: number
  age?: number
  gender?: string
}

/**
 * Estimate calories burned for a cardio activity using Gemini AI as primary
 * fallback to a simple MET-based heuristic if AI fails.
 */
export async function estimateCardioCalories(
  user: UserProfileForEstimation,
  cardio: CardioInput
): Promise<number> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  // Try AI estimation first if API key exists
  if (apiKey) {
    try {
      const client = new GoogleGenerativeAI(apiKey)
      const model = client.getGenerativeModel({
        model: 'gemini-2.5-flash-lite',
      })

      const prompt = `Estimate calories burned for a running session.
User: age=${user.age || 'unknown'}, height=${
        user.height || 'unknown'
      } cm, weight=${user.weight} kg, gender=${user.gender || 'unknown'}.
Activity details: ${JSON.stringify(cardio)}

Return only a single number indicating estimated calories burned (rounded).`

      const res = await model.generateContent(prompt)
      const text = res.response.text().trim()
      // Extract number from response
      const numMatch = text.match(/([0-9]+(?:\.[0-9]+)?)/)
      if (numMatch) {
        return Math.round(parseFloat(numMatch[1]))
      }
    } catch (error) {
      console.warn(
        'AI cardio estimation failed, falling back to heuristic',
        error
      )
    }
  }

  // Fallback heuristic using METs for running based on pace
  // If we have duration and pace, compute calories = MET * weight_kg * duration_hours
  // Choose MET by pace (min/km)
  const weight = user.weight
  let met = 8 // default moderate

  if (cardio.avgPaceMinPerKm) {
    const pace = cardio.avgPaceMinPerKm
    if (pace <= 4.5) met = 13
    else if (pace <= 5.5) met = 11
    else if (pace <= 6.5) met = 10
    else if (pace <= 7.5) met = 9
    else if (pace <= 8.5) met = 8
    else met = 7
  }

  let durationHours = 0
  if (cardio.durationMinutes) durationHours = cardio.durationMinutes / 60
  else if (cardio.steps && cardio.distanceKm && cardio.avgPaceMinPerKm) {
    durationHours = (cardio.distanceKm * cardio.avgPaceMinPerKm) / 60
  } else if (cardio.steps && !cardio.distanceKm) {
    // estimate distance from steps (avg stride ~0.78m)
    const km = (cardio.steps * 0.78) / 1000
    const assumedPace = cardio.avgPaceMinPerKm || 6
    durationHours = (km * assumedPace) / 60
  }

  const calories = met * weight * durationHours
  return Math.round(calories || 0)
}
