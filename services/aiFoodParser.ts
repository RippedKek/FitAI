/**
 * AI Food Parser Service
 * Uses Google Gemini SDK to parse natural language food input into structured meal data
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

export interface ParsedMeal {
  name: string
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface FoodParsingResponse {
  meals: ParsedMeal[]
  error?: string
}

/**
 * Parse natural language food input using Gemini AI
 */
export async function parseFoodInput(
  input: string
): Promise<FoodParsingResponse> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

  if (!apiKey) {
    return {
      meals: [],
      error: 'Gemini API key not configured',
    }
  }

  try {
    const client = new GoogleGenerativeAI(apiKey)
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

    const prompt = `You are a nutrition expert. Parse the following food input and extract meal information. 
Return ONLY a valid JSON array of meal objects. Each meal object should have:
- name: string (the food item name)
- category: "breakfast" | "lunch" | "dinner" | "snack" (infer from time of day or context, default to "snack" if unclear)
- calories: number (estimated calories)
- protein: number (grams of protein)
- carbs: number (grams of carbohydrates)
- fat: number (grams of fat)

If multiple items are mentioned, create separate meal objects for each.

Input: "${input}"

Return only the JSON array, no other text. Example format:
[{"name": "Grilled chicken breast", "category": "lunch", "calories": 231, "protein": 43.5, "carbs": 0, "fat": 5}, {"name": "Brown rice", "category": "lunch", "calories": 216, "protein": 5, "carbs": 45, "fat": 1.8}]`

    const result = await model.generateContent(prompt)
    const content = result.response.text().trim()

    // Extract JSON from response (handle cases where AI adds extra text)
    let jsonString = content
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      jsonString = jsonMatch[0]
    }

    const meals: ParsedMeal[] = JSON.parse(jsonString)

    // Validate and sanitize the parsed meals
    const validatedMeals = meals
      .filter((meal) => {
        return (
          meal.name &&
          typeof meal.calories === 'number' &&
          typeof meal.protein === 'number' &&
          typeof meal.carbs === 'number' &&
          typeof meal.fat === 'number' &&
          ['breakfast', 'lunch', 'dinner', 'snack'].includes(meal.category)
        )
      })
      .map((meal) => ({
        name: meal.name.trim(),
        category: meal.category,
        calories: Math.max(0, Math.round(meal.calories)),
        protein: Math.max(0, Math.round(meal.protein * 10) / 10),
        carbs: Math.max(0, Math.round(meal.carbs * 10) / 10),
        fat: Math.max(0, Math.round(meal.fat * 10) / 10),
      }))

    return {
      meals: validatedMeals,
    }
  } catch (error: any) {
    console.error('Error parsing food input:', error)
    return {
      meals: [],
      error: error.message || 'Failed to parse food input',
    }
  }
}
