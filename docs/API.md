# API Documentation

## Google Gemini AI Integration

### Overview

NutriScan AI uses Google's Gemini AI API for food image analysis. The integration is handled through the `geminiService.ts` module.

## Authentication

### API Key Setup

```typescript
// .env.local
VITE_GEMINI_API_KEY=your_api_key_here
```

The API key is accessed via Vite's environment variable system:

```typescript
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
```

## Service Methods

### analyzeFoodImage()

Analyzes a food image and returns nutritional information.

**Signature:**
```typescript
async function analyzeFoodImage(
  base64: string,
  mimeType: string
): Promise<AnalysisResult>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `base64` | `string` | Base64-encoded image data (without data URL prefix) |
| `mimeType` | `string` | MIME type of the image (e.g., 'image/jpeg', 'image/png') |

**Returns:** `Promise<AnalysisResult>`

**Example Usage:**
```typescript
import { analyzeFoodImage } from './services/geminiService';

const handleUpload = async (file: File) => {
  const reader = new FileReader();
  
  reader.onload = async (e) => {
    const base64 = e.target?.result as string;
    const [, data] = base64.split(','); // Remove data URL prefix
    
    try {
      const result = await analyzeFoodImage(data, file.type);
      console.log(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };
  
  reader.readAsDataURL(file);
};
```

## Response Format

### AnalysisResult Interface

```typescript
interface AnalysisResult {
  totalCalories: number;        // Total calories for all food items
  macros: MacroNutrients;       // Macronutrient breakdown
  foods: FoodItem[];            // Individual food items
  healthInsights: string;       // AI-generated health insights
}
```

### MacroNutrients Interface

```typescript
interface MacroNutrients {
  protein: number;   // Grams of protein
  carbs: number;     // Grams of carbohydrates
  fats: number;      // Grams of fats
}
```

### FoodItem Interface

```typescript
interface FoodItem {
  name: string;       // Food item name
  portion: string;    // Portion size estimate
  calories: number;   // Calories for this item
}
```

### Example Response

```json
{
  "totalCalories": 850,
  "macros": {
    "protein": 45,
    "carbs": 78,
    "fats": 32
  },
  "foods": [
    {
      "name": "Grilled Chicken Breast",
      "portion": "6 oz (170g)",
      "calories": 280
    },
    {
      "name": "Brown Rice",
      "portion": "1 cup cooked",
      "calories": 215
    },
    {
      "name": "Mixed Vegetables",
      "portion": "1.5 cups",
      "calories": 105
    },
    {
      "name": "Olive Oil (cooking)",
      "portion": "1 tablespoon",
      "calories": 120
    }
  ],
  "healthInsights": "This is a well-balanced meal with a good protein-to-carb ratio. The lean chicken provides high-quality protein, while brown rice offers complex carbohydrates and fiber. Consider reducing the oil slightly if trying to lower overall calorie intake."
}
```

## Prompt Engineering

### Custom Prompt Structure

The service uses a carefully crafted prompt to ensure accurate and consistent results:

```typescript
const prompt = `Analyze this food image and provide detailed nutritional information.

Instructions:
1. Identify all visible food items
2. Estimate portion sizes realistically
3. Consider cooking methods (fried, grilled, etc.)
4. Account for hidden ingredients (oil, butter, sauces)
5. Provide realistic calorie estimates

Return ONLY a valid JSON object with this exact structure:
{
  "totalCalories": <number>,
  "macros": {
    "protein": <number in grams>,
    "carbs": <number in grams>,
    "fats": <number in grams>
  },
  "foods": [
    {
      "name": "<food name>",
      "portion": "<portion size>",
      "calories": <number>
    }
  ],
  "healthInsights": "<brief health insights>"
}`;
```

## Error Handling

### Error Types

```typescript
class GeminiAPIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeminiAPIError';
  }
}
```

### Common Errors

| Error | Description | Solution |
|-------|-------------|----------|
| `API key not configured` | Missing VITE_GEMINI_API_KEY | Add API key to .env.local |
| `Network request failed` | Connection issue | Check internet connection |
| `Invalid response format` | Malformed JSON from API | Retry or contact support |
| `Rate limit exceeded` | Too many requests | Wait and retry with exponential backoff |
| `Invalid image format` | Unsupported MIME type | Use JPEG, PNG, or WebP |

### Error Handling Example

```typescript
try {
  const result = await analyzeFoodImage(base64, mimeType);
  // Handle success
} catch (error) {
  if (error instanceof GeminiAPIError) {
    // Handle API-specific errors
    console.error('API Error:', error.message);
  } else {
    // Handle other errors
    console.error('Unexpected error:', error);
  }
}
```

## Rate Limiting

### Current Limits (Free Tier)

- **Requests per minute:** 60
- **Requests per day:** 1,500
- **Max image size:** 10MB
- **Concurrent requests:** 5

### Best Practices

1. **Debounce rapid uploads**
   ```typescript
   const debouncedAnalyze = debounce(analyzeFoodImage, 1000);
   ```

2. **Cache results**
   ```typescript
   const cache = new Map<string, AnalysisResult>();
   ```

3. **Implement retry logic**
   ```typescript
   async function analyzeWithRetry(base64: string, mimeType: string, retries = 3) {
     for (let i = 0; i < retries; i++) {
       try {
         return await analyzeFoodImage(base64, mimeType);
       } catch (error) {
         if (i === retries - 1) throw error;
         await delay(Math.pow(2, i) * 1000); // Exponential backoff
       }
     }
   }
   ```

## Future API Endpoints

### Planned Backend API

Once the backend is implemented, the following endpoints will be available:

#### POST /api/analyze
Analyze food image (same as current Gemini integration)

#### GET /api/history
Retrieve user's meal history

#### POST /api/meals
Save analyzed meal

#### GET /api/nutrition/stats
Get nutrition statistics over time

#### POST /api/recipes/import
Import and analyze recipe from URL

---

**Last Updated:** February 2, 2026  
**API Version:** Gemini 1.5 Pro  
**Author:** Christophe Timothe
