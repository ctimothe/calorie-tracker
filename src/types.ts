
export type Language = 'en' | 'ru' | 'uz';

export interface FoodItem {
  name: string;
  portionSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: string;
}

export interface Micronutrients {
  vitaminA: string;
  vitaminC: string;
  calcium: string;
  iron: string;
}

export interface NutritionSummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  healthScore: number;
  advice: string;
  micros?: Micronutrients;
}

export interface AnalysisResult {
  items: FoodItem[];
  summary: NutritionSummary;
  scanType: 'meal' | 'label' | 'text';
}

export interface MealLog {
  id: string;
  date: string;
  timestamp: number;
  summary: NutritionSummary;
  items: FoodItem[];
  image?: string;
  image_url?: string;
  image_thumb?: string;
  image_source?: 'user' | 'unsplash' | 'fallback';  // 'user' = user's actual photo, others = stock
  icon_emoji?: string;  // Emoji representing the meal for compact display
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
}

export interface WeightLog {
  date: string; // ISO string
  weight: number;
}

export interface UserProfile {
  id?: string;
  email?: string;
  name: string;
  language: Language;
  setupCompleted: boolean;
  
  // Scientific Bio-Metrics
  dob: string; // YYYY-MM-DD
  age: number; // Calculated from DOB
  weight: number; // kg
  height: number; // cm
  neck: number; // cm (New)
  waist: number; // cm (New)
  hip: number; // cm (New - Optional for men, required for women)
  bodyFat: number | null; // % (Calculated)
  gender: 'male' | 'female';
  
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';
  goalType: 'lose' | 'maintain' | 'gain';
  
  // Goals
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  waterGoal: number;
  
  // Activity / Hardware
  stepGoal: number;
  dailySteps: number;
  connectedApps: string[]; // 'apple_health', 'google_fit'

  // App State
  isPremium: boolean;
  currentStreak: number;
  lastLogDate: string;
  weightHistory: WeightLog[];
}

export interface FastingState {
  isFasting: boolean;
  startTime: string | null;
  targetHours: number;
}

export interface AIMealSuggestion {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTime: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  SCAN = 'SCAN',
  HISTORY = 'HISTORY',
  PROFILE = 'PROFILE',
  RECOMMENDATIONS = 'RECOMMENDATIONS',
  CHEF = 'CHEF'
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export enum ScanMode {
  MEAL = 'MEAL',
  LABEL = 'LABEL',
  TEXT = 'TEXT'
}
