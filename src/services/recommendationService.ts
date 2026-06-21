import { UserProfile, MealLog, Language, AIMealSuggestion } from '../types';
import { getMealSuggestions } from './geminiService';

export interface QuickSuggestion {
  id: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  reason?: string;
  source?: 'rule' | 'ai';
  description?: string;
  prepTime?: string;
}

// Localized reason strings
const reasons: Record<string, Record<Language, string>> = {
  carb_budget: {
    uz: 'Uglevod byudjeti mavjud',
    en: 'Carb budget available',
    ru: 'Есть запас углеводов'
  },
  protein_deficit: {
    uz: 'Oqsil yetishmovchiligi',
    en: 'Protein deficit',
    ru: 'Недостаток белка'
  },
  calories_available: {
    uz: 'Kaloriya mavjud',
    en: 'Calories available',
    ru: 'Есть запас калорий'
  },
  low_fat: {
    uz: 'Yog\' yetishmovchiligi',
    en: 'Fat deficit',
    ru: 'Недостаток жиров'
  },
  balanced_meal: {
    uz: 'Balanslangan taom',
    en: 'Balanced meal option',
    ru: 'Сбалансированный вариант'
  }
};

// Localized suggestion names
const suggestionNames: Record<string, Record<Language, string>> = {
  bread_slice: {
    uz: '1 bo\'lak non',
    en: '1 slice of bread',
    ru: '1 ломтик хлеба'
  },
  boiled_egg: {
    uz: '1 ta qaynatilgan tuxum',
    en: '1 boiled egg',
    ru: '1 вареное яйцо'
  },
  greek_yogurt: {
    uz: 'Grek yogurti (150g)',
    en: 'Greek yogurt (150g)',
    ru: 'Греческий йогурт (150г)'
  },
  banana: {
    uz: '1 ta banan',
    en: '1 banana',
    ru: '1 банан'
  },
  almonds: {
    uz: 'Bodom (30g)',
    en: 'Almonds (30g)',
    ru: 'Миндаль (30г)'
  }
};

export const getQuickSuggestions = (profile: UserProfile, logs: MealLog[]): QuickSuggestion[] => {
  const lang = profile.language || 'uz';
  const todayLogs = logs.filter(log => new Date(log.date).toDateString() === new Date().toDateString());
  const consumed = todayLogs.reduce((acc, log) => ({
    calories: acc.calories + log.summary.totalCalories,
    protein: acc.protein + log.summary.totalProtein,
    carbs: acc.carbs + log.summary.totalCarbs,
    fat: acc.fat + log.summary.totalFat
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const activeCalories = Math.round((profile.dailySteps || 0) * 0.04);
  const totalDailyBudget = profile.calorieGoal + activeCalories;
  const remainingCalories = Math.max(0, totalDailyBudget - consumed.calories);
  const remainingCarbs = Math.max(0, profile.carbsGoal - consumed.carbs);
  const remainingProtein = Math.max(0, profile.proteinGoal - consumed.protein);
  const remainingFat = Math.max(0, profile.fatGoal - consumed.fat);

  const suggestions: QuickSuggestion[] = [];

  // Bread suggestion - only if carb budget allows
  if (remainingCarbs >= 15 && remainingCalories >= 70) {
    suggestions.push({ 
      id: 'bread-slice', 
      name: suggestionNames.bread_slice[lang], 
      calories: 70, 
      carbs: 15, 
      protein: 2,
      reason: reasons.carb_budget[lang],
      source: 'rule'
    });
  }

  // Protein-rich options
  if (remainingProtein >= 6 && remainingCalories >= 70) {
    suggestions.push({ 
      id: 'boiled-egg', 
      name: suggestionNames.boiled_egg[lang], 
      calories: 70, 
      protein: 6, 
      fat: 5,
      reason: reasons.protein_deficit[lang],
      source: 'rule'
    });
  }

  // Greek yogurt for protein + calcium
  if (remainingProtein >= 10 && remainingCalories >= 100 && suggestions.length < 4) {
    suggestions.push({ 
      id: 'greek-yogurt', 
      name: suggestionNames.greek_yogurt[lang], 
      calories: 100, 
      protein: 10, 
      carbs: 6,
      reason: reasons.protein_deficit[lang],
      source: 'rule'
    });
  }

  // Banana for quick energy / carbs
  if (remainingCarbs >= 25 && remainingCalories >= 90 && suggestions.length < 4) {
    suggestions.push({ 
      id: 'banana', 
      name: suggestionNames.banana[lang], 
      calories: 90, 
      carbs: 23, 
      protein: 1,
      reason: reasons.carb_budget[lang],
      source: 'rule'
    });
  }

  // Healthy fats - almonds
  if (remainingFat >= 14 && remainingCalories >= 170 && suggestions.length < 4) {
    suggestions.push({ 
      id: 'almonds', 
      name: suggestionNames.almonds[lang], 
      calories: 170, 
      fat: 14, 
      protein: 6,
      reason: reasons.low_fat[lang],
      source: 'rule'
    });
  }

  // Return max 3 most relevant suggestions
  return suggestions.slice(0, 3);
};

/**
 * Get AI-powered suggestions with fallback to rule-based
 * Call this async function for personalized recommendations
 */
export const getAISuggestions = async (
  profile: UserProfile,
  logs: MealLog[],
  type: 'snack' | 'meal' = 'snack'
): Promise<{ suggestions: QuickSuggestion[]; source: 'ai' | 'rule'; error?: string }> => {
  const lang = profile.language || 'uz';
  
  // Calculate remaining calories
  const todayLogs = logs.filter(log => new Date(log.date).toDateString() === new Date().toDateString());
  const consumed = todayLogs.reduce((acc, log) => acc + log.summary.totalCalories, 0);
  const activeCalories = Math.round((profile.dailySteps || 0) * 0.04);
  const totalDailyBudget = profile.calorieGoal + activeCalories;
  const remainingCalories = Math.max(0, totalDailyBudget - consumed);

  // Don't call AI if very few calories left
  if (remainingCalories < 50) {
    return { suggestions: [], source: 'rule' };
  }

  try {
    const aiResults = await getMealSuggestions(remainingCalories, type, lang);
    
    if (!aiResults || aiResults.length === 0) {
      // Fallback to rule-based
      return { suggestions: getQuickSuggestions(profile, logs), source: 'rule' };
    }

    // Convert AI results to QuickSuggestion format
    const suggestions: QuickSuggestion[] = aiResults.slice(0, 3).map((ai, idx) => ({
      id: `ai-${idx}-${Date.now()}`,
      name: ai.name,
      calories: ai.calories,
      protein: ai.protein,
      carbs: ai.carbs,
      fat: ai.fat,
      reason: ai.description,
      description: ai.description,
      prepTime: ai.prepTime,
      source: 'ai' as const
    }));

    return { suggestions, source: 'ai' };
  } catch (error) {
    console.warn('AI suggestions failed, using rule-based fallback:', error);
    // Fallback to rule-based suggestions
    return { 
      suggestions: getQuickSuggestions(profile, logs), 
      source: 'rule',
      error: error instanceof Error ? error.message : 'AI unavailable'
    };
  }
};
