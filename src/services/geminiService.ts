
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, ScanMode, AIMealSuggestion, Language } from "../types";

// Prefer Vite client env, fallback to Node env for builds
const defaultApiKey = (import.meta as any)?.env?.VITE_GEMINI_API_KEY || (import.meta as any)?.env?.GEMINI_API_KEY || process.env.API_KEY;

// Helper to get the most preferred API key (Local Custom Key > Env Key)
const getApiKey = (): string => {
  const customKey = localStorage.getItem('vitalize_custom_api_key');
  if (customKey && customKey.trim().length > 10) {
    return customKey;
  }
  if (!defaultApiKey) {
    console.error('VITE_GEMINI_API_KEY is not set. Please check your .env file.');
  }
  return defaultApiKey || '';
};

// Helper to get lang name
const getLangName = (lang: Language) => lang === 'ru' ? 'Russian' : lang === 'uz' ? 'Uzbek' : 'English';

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          portionSize: { type: Type.STRING },
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fat: { type: Type.NUMBER },
          confidence: { type: Type.STRING },
        },
        required: ["name", "portionSize", "calories", "protein", "carbs", "fat", "confidence"],
      },
    },
    summary: {
      type: Type.OBJECT,
      properties: {
        totalCalories: { type: Type.NUMBER },
        totalProtein: { type: Type.NUMBER },
        totalCarbs: { type: Type.NUMBER },
        totalFat: { type: Type.NUMBER },
        healthScore: { type: Type.NUMBER },
        advice: { type: Type.STRING },
        micros: {
          type: Type.OBJECT,
          properties: {
            vitaminA: { type: Type.STRING, description: "e.g. 15% DV" },
            vitaminC: { type: Type.STRING, description: "e.g. 20mg" },
            calcium: { type: Type.STRING },
            iron: { type: Type.STRING },
          },
          required: ["vitaminA", "vitaminC", "calcium", "iron"]
        }
      },
      required: ["totalCalories", "totalProtein", "totalCarbs", "totalFat", "healthScore", "advice", "micros"],
    },
  },
  required: ["items", "summary"],
};

// Wrapper to handle Multi-Key Rotation
const makeGeminiRequest = async (prompt: string | any, isImage: boolean = false, mimeType: string = '') => {
  const keysString = getApiKey();
  const keys = keysString.split(',').map(k => k.trim()).filter(k => k.length > 0);

  let lastError;

  for (const apiKey of keys) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const model = "gemini-2.5-flash";

      let contents: any;
      if (isImage) {
        contents = {
          parts: [
            { inlineData: { data: prompt, mimeType: mimeType } },
            { text: "Analyze this food." } // Prompt is injected via config in this SDK version or handled below
          ]
        };
        // For GenAI SDK 1.30+, simpler to just pass the prompt text in the parts if needed, 
        // but our function signature splits them. 
        // Let's stick to the prompt structure used in previous working version but rotate the client.
      } else {
        contents = prompt;
      }

      // We actually need to pass the prompt TEXT into the generateContent call.
      // The `analyzeFoodImage` function below constructs the complex object. 
      // This wrapper is a bit simplistic for the complex image payload.
      // Let's refactor the Logic inside the main functions to loop instead.
      throw new Error("Use specific functions");
    } catch (e) {
      lastError = e;
      continue;
    }
  }
};

// --- REAL IMPLEMENTATION WITH ROTATION ---

const executeWithRotation = async (operation: (ai: GoogleGenAI) => Promise<any>) => {
  const keysString = getApiKey();
  const keys = keysString.split(',').map(k => k.trim()).filter(k => k.length > 0);
  let lastError;

  for (const apiKey of keys) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      return await operation(ai);
    } catch (error: any) {
      console.warn(`Key ending in ...${apiKey.slice(-4)} failed:`, error.message);
      if (error.message.includes('429') || error.message.includes('403')) {
        lastError = error;
        continue; // Try next key
      }
      throw error; // If it's not a rate limit, throw immediately
    }
  }
  throw lastError || new Error("All API keys exhausted or invalid.");
};

export const parseFoodText = async (text: string, lang: Language): Promise<AnalysisResult> => {
  const langName = getLangName(lang);
  const prompt = `
    Act as a professional nutritionist.
    User Input: "${text}"
    
    Task:
    1. Parse the natural language input into specific food items.
    2. Estimate calories and macros accurately.
    3. Estimate MICRONUTRIENTS (Vitamin A, Vitamin C, Calcium, Iron) based on standard values.
    4. Provide food names and nutritional advice in ${langName}.
    
    Return structured JSON with 'micros'.
  `;

  const response = await executeWithRotation(async (ai) => {
    return ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA
      }
    });
  });

  if (!response.text) throw new Error("No text response");
  const result = JSON.parse(response.text) as AnalysisResult;
  result.scanType = 'text';
  return result;
};

export const analyzeFoodImage = async (base64Image: string, mimeType: string, mode: ScanMode, lang: Language): Promise<AnalysisResult> => {
  const langName = getLangName(lang);
  let promptText = "";

  if (mode === ScanMode.LABEL) {
    promptText = `
      You are an advanced OCR system for Nutrition Facts.
      Extract: Serving Size, Calories, Protein, Carbs, Fat.
      ALSO EXTRACT: Vitamin A, Vitamin C, Calcium, Iron if listed (as % or mg).
      Translate summary to ${langName}.
      Return JSON.
     `;
  } else {
    promptText = `
      You are a Food Scientist. Analyze this image.
      1. Identify foods & cooking methods.
      2. Estimate Volume/Density.
      3. Calculate Calories/Macros.
      4. ESTIMATE MICRONUTRIENTS (Vit A, Vit C, Calcium, Iron) - this is critical for biohacking.
      5. Return names/advice in ${langName}.
      Return JSON.
     `;
  }

  // Normalize base64: strip data URL header if present
  const normalizedBase64 = base64Image.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

  const response = await executeWithRotation(async (ai) => {
    return ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { data: normalizedBase64, mimeType: mimeType } },
          { text: promptText },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA
      },
    });
  });

  const text = response.text;
  if (!text) throw new Error("No response text");

  const result = JSON.parse(text) as AnalysisResult;
  result.scanType = mode === ScanMode.LABEL ? 'label' : 'meal';
  return result;
};

export const getMealSuggestions = async (remainingCalories: number, type: string, lang: Language): Promise<AIMealSuggestion[]> => {
  const langName = getLangName(lang);
  const prompt = `
    I have ${remainingCalories} calories left. Suggest 5 ${type} options that fit within this budget.
    Make suggestions diverse and practical.
    OUTPUT LANGUAGE: ${langName}.
    Return JSON array.
  `;

  const response = await executeWithRotation(async (ai) => {
    return ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              calories: { type: Type.NUMBER },
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fat: { type: Type.NUMBER },
              prepTime: { type: Type.STRING }
            },
            required: ["name", "description", "calories", "protein", "carbs", "fat", "prepTime"]
          }
        }
      }
    });
  });

  return JSON.parse(response.text || "[]") as AIMealSuggestion[];
};

// Extended type for recipe details (used by AIChef detail modal)
interface RecipeDetailsResponse {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTime: string;
  ingredients: string[];
  steps: string[];
  tips: string;
  reviews: { source: string; rating: number; quote: string }[];
}

// Get full recipe details including ingredients, steps, and mock reviews
export const getRecipeDetails = async (meal: AIMealSuggestion, lang: Language): Promise<RecipeDetailsResponse> => {
  const langName = getLangName(lang);
  const prompt = `
    Create a detailed recipe for: "${meal.name}" (${meal.description})
    This dish has approximately ${meal.calories} calories.

    Provide:
    1. A list of 6-10 ingredients with quantities
    2. Step-by-step cooking instructions (4-8 steps)
    3. One helpful cooking tip
    4. 2-3 fake community reviews (realistic names, 4-5 star ratings, short quotes)

    OUTPUT LANGUAGE: ${langName}.
    Return JSON.
  `;

  const response = await executeWithRotation(async (ai) => {
    return ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ingredients: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            tips: { type: Type.STRING },
            reviews: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  source: { type: Type.STRING },
                  rating: { type: Type.NUMBER },
                  quote: { type: Type.STRING }
                },
                required: ["source", "rating", "quote"]
              }
            }
          },
          required: ["ingredients", "steps", "tips", "reviews"]
        }
      }
    });
  });

  const details = JSON.parse(response.text || "{}");

  return {
    ...meal,
    ingredients: details.ingredients || [],
    steps: details.steps || [],
    tips: details.tips || '',
    reviews: details.reviews || []
  };
};

