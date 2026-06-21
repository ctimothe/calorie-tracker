
import { MealLog, UserProfile, FastingState } from '../types';
import { supabase } from './supabase';

const STORAGE_KEYS = {
  PROFILE: 'vitalize_profile',
  LOGS: 'vitalize_logs',
  WATER: 'vitalize_water',
  FASTING: 'vitalize_fasting'
};

export const DEFAULT_PROFILE: UserProfile = {
  name: '',
  language: 'uz', // CHANGED TO UZBEK DEFAULT
  setupCompleted: false,
  dob: '2000-01-01',
  age: 25,
  weight: 70,
  height: 170,
  neck: 0,
  waist: 0,
  hip: 0,
  bodyFat: null,
  gender: 'male',
  activityLevel: 'moderate',
  goalType: 'lose',
  calorieGoal: 2000,
  proteinGoal: 150,
  carbsGoal: 200,
  fatGoal: 65,
  isPremium: false,
  waterGoal: 2500,
  stepGoal: 10000,
  dailySteps: 0,
  connectedApps: [],
  currentStreak: 0,
  lastLogDate: '',
  weightHistory: []
};

// --- SYNC FUNCTIONS ---

export const fetchUserData = async (userId: string): Promise<{ profile: UserProfile | null, logs: MealLog[] }> => {
  try {
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
    const { data: logsData } = await supabase.from('meal_logs').select('*').eq('user_id', userId).order('timestamp', { ascending: false });
    const { data: weightData } = await supabase.from('weight_logs').select('*').eq('user_id', userId).order('created_at', { ascending: true });

    let finalProfile = profileData ? { ...DEFAULT_PROFILE, ...profileData } : null;

    // CamelCase conversion for DB snake_case columns
    if (finalProfile) {
      finalProfile.setupCompleted = profileData.setup_completed;
      finalProfile.activityLevel = profileData.activity_level;
      finalProfile.goalType = profileData.goal_type;
      finalProfile.calorieGoal = profileData.calorie_goal;
      finalProfile.proteinGoal = profileData.protein_goal;
      finalProfile.carbsGoal = profileData.carbs_goal;
      finalProfile.fatGoal = profileData.fat_goal;
      finalProfile.bodyFat = profileData.body_fat;
      finalProfile.currentStreak = profileData.current_streak;
      finalProfile.lastLogDate = profileData.last_log_date;
      finalProfile.dailySteps = profileData.daily_steps || 0;
      finalProfile.stepGoal = profileData.step_goal || 10000;

      if (weightData) {
        finalProfile.weightHistory = weightData.map((w: any) => ({
          date: w.date,
          weight: w.weight
        }));
      }
    }

    // Map meal logs from snake_case to camelCase including image fields
    const mappedLogs: MealLog[] = (logsData || []).map((log: any) => ({
      id: log.id,
      date: log.date,
      timestamp: log.timestamp,
      mealType: log.meal_type,
      summary: log.summary,
      items: log.items,
      image: log.image,
      image_url: log.image_url,
      image_thumb: log.image_thumb,
      image_source: log.image_source,
      icon_emoji: log.icon_emoji
    }));

    return { profile: finalProfile, logs: mappedLogs };
  } catch (e) {
    console.error("Supabase Sync Error:", e);
    return { profile: null, logs: [] };
  }
};

export const syncProfileToSupabase = async (profile: UserProfile, userId: string) => {
  // We construct the payload manually to ensure types match DB columns
  const payload = {
    id: userId,
    email: profile.email,
    name: profile.name,
    language: profile.language,
    setup_completed: profile.setupCompleted,
    dob: profile.dob,
    age: profile.age,
    weight: profile.weight,
    height: profile.height,
    neck: profile.neck,
    waist: profile.waist,
    hip: profile.hip,
    body_fat: profile.bodyFat,
    gender: profile.gender,
    activity_level: profile.activityLevel,
    goal_type: profile.goalType,
    calorie_goal: profile.calorieGoal,
    protein_goal: profile.proteinGoal,
    carbs_goal: profile.carbsGoal,
    fat_goal: profile.fatGoal,
    current_streak: profile.currentStreak,
    last_log_date: profile.lastLogDate,
    daily_steps: profile.dailySteps,
    step_goal: profile.stepGoal
  };

  const { error } = await supabase.from('profiles').upsert(payload);

  if (error) {
    // Log the full error object as JSON so it's readable
    console.error("Failed to sync profile:", JSON.stringify(error, null, 2));
  }
};

export const syncLogToSupabase = async (log: MealLog, userId: string) => {
  const { error } = await supabase.from('meal_logs').insert({
    id: log.id, // Use the client-generated ID
    user_id: userId,
    date: log.date,
    timestamp: log.timestamp,
    meal_type: log.mealType,
    summary: log.summary,
    items: log.items,
    image_url: log.image_url || null,
    image_thumb: log.image_thumb || null,
    image_source: log.image_source || null,
    icon_emoji: log.icon_emoji || null
  });
  if (error) console.error("Failed to sync log:", JSON.stringify(error, null, 2));
};

// Upload a data URL (base64) image to Supabase Storage and return public URL and thumb URL
export const uploadImageToSupabase = async (userId: string, logId: string, dataUrl: string, contentType: string) => {
  try {
    // Convert dataURL to blob
    const dataURLtoBlob = (dataurl: string) => {
      const arr = dataurl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    };

    const blob = dataURLtoBlob(dataUrl);
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const bucket = 'meal_images';
    const path = `${userId}/${logId}.${ext}`;

    // Upload blob to Supabase storage bucket (upsert true)
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, blob, { upsert: true });
    if (uploadError) {
      console.warn('Failed to upload image to Supabase:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    const publicUrl = data?.publicUrl || null;

    // If we have no public URL, return null
    if (!publicUrl) return { url: null, thumb: null };

    // A simple thumb transform: use the same URL, but allow the client to request a smaller width via params later
    const thumbUrl = publicUrl; // We can apply transforms in the client if needed
    return { url: publicUrl, thumb: thumbUrl };
  } catch (e) {
    console.error('uploadImageToSupabase error:', e);
    return { url: null, thumb: null };
  }
};

export const syncWeightToSupabase = async (weight: number, userId: string) => {
  const date = new Date().toISOString();
  const { error } = await supabase.from('weight_logs').insert({ user_id: userId, weight: weight, date: date });
  if (error) console.error("Failed to sync weight:", JSON.stringify(error, null, 2));
};

export const addWeightLog = async (weight: number) => {
  const { data } = await supabase.auth.getSession();
  if (data.session?.user.id) {
    await syncWeightToSupabase(weight, data.session.user.id);
  }
};

// --- LOCAL HELPERS ---

export const getProfile = (): UserProfile => {
  const stored = localStorage.getItem(STORAGE_KEYS.PROFILE);
  return stored ? JSON.parse(stored) : DEFAULT_PROFILE;
};

export const saveProfileLocal = (profile: UserProfile): void => {
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
};

export const getLogsLocal = (): MealLog[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.LOGS);
  return stored ? JSON.parse(stored) : [];
};

export const saveLogsLocal = (logs: MealLog[]): void => {
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
};

export const deleteLogLocal = (id: string): MealLog[] => {
  const logs = getLogsLocal().filter(l => l.id !== id);
  saveLogsLocal(logs);
  return logs;
};

export const deleteLogFromSupabase = async (id: string, userId: string) => {
  try {
    const { error } = await supabase.from('meal_logs').delete().eq('id', id).eq('user_id', userId);
    if (error) console.error('Failed to delete log from supabase:', JSON.stringify(error, null, 2));
  } catch (e) {
    console.error('Supabase delete error', e);
  }
};

// --- SCIENTIFIC CALCULATIONS ---

export const calculateAge = (dob: string): number => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// US Navy Method for Body Fat %
export const calculateBodyFat = (p: UserProfile): number | null => {
  if (!p.neck || !p.waist || !p.height) return null;

  // Log10 helper
  const log10 = (n: number) => Math.log(n) / Math.log(10);

  if (p.gender === 'male') {
    // Men: 86.010 * log10(abdomen - neck) - 70.041 * log10(height) + 36.76
    const val = p.waist - p.neck;
    if (val <= 0) return null; // Safety check
    const result = 86.010 * log10(val) - 70.041 * log10(p.height) + 36.76;
    return result > 0 ? result : null;
  } else {
    // Women: 163.205 * log10(waist + hip - neck) - 97.684 * log10(height) - 78.387
    if (!p.hip) return null;
    const val = p.waist + p.hip - p.neck;
    if (val <= 0) return null; // Safety check
    const result = 163.205 * log10(val) - 97.684 * log10(p.height) - 78.387;
    return result > 0 ? result : null;
  }
};

export const calculateBMR = (p: UserProfile): number => {
  // If Body Fat is available, use Katch-McArdle (Most Accurate)
  if (p.bodyFat && p.bodyFat > 5 && p.bodyFat < 60) {
    const leanBodyMass = p.weight * (1 - p.bodyFat / 100);
    return Math.round(370 + (21.6 * leanBodyMass));
  }

  // Fallback to Mifflin-St Jeor (Standard)
  let bmr = (10 * p.weight) + (6.25 * p.height) - (5 * p.age);
  bmr += p.gender === 'male' ? 5 : -161;
  return Math.round(bmr);
};

export const calculateTDEE = (p: UserProfile): number => {
  const bmr = calculateBMR(p);
  const multipliers: any = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    athlete: 1.9
  };
  return Math.round(bmr * (multipliers[p.activityLevel] || 1.2));
};

export const calculateTargets = (p: UserProfile) => {
  const tdee = calculateTDEE(p);
  let calorieGoal = tdee;

  if (p.goalType === 'lose') calorieGoal -= 500; // ~0.5kg/week loss
  if (p.goalType === 'gain') calorieGoal += 300; // Lean gain

  // Macro split (Balanced)
  const protein = Math.round((calorieGoal * 0.30) / 4);
  const fat = Math.round((calorieGoal * 0.30) / 9);
  const carbs = Math.round((calorieGoal * 0.40) / 4);

  return { calorieGoal, proteinGoal: protein, fatGoal: fat, carbsGoal: carbs };
};

export const getWaterIntake = (): number => {
  const today = new Date().toDateString();
  const stored = localStorage.getItem(STORAGE_KEYS.WATER);
  if (!stored) return 0;
  const data = JSON.parse(stored);
  if (data.date !== today) return 0;
  return data.amount;
};

export const saveWaterIntake = (amount: number): void => {
  const today = new Date().toDateString();
  localStorage.setItem(STORAGE_KEYS.WATER, JSON.stringify({ date: today, amount }));
};

// Sync hydration to Supabase - stores daily water intake
export const syncWaterToSupabase = async (userId: string, amount: number) => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  try {
    // Upsert: if row exists for user+date, update it; otherwise insert
    const { error } = await supabase
      .from('hydration_logs')
      .upsert(
        { user_id: userId, date: today, amount: amount, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,date' }
      );
    if (error) {
      // If table doesn't exist yet, log a warning but don't throw
      if (error.code === '42P01') {
        console.warn('hydration_logs table not found - hydration stored locally only');
      } else {
        console.error('Failed to sync hydration:', JSON.stringify(error, null, 2));
      }
    }
  } catch (e) {
    console.error('Supabase hydration sync error:', e);
  }
};

// Fetch today's hydration from Supabase
export const fetchWaterFromSupabase = async (userId: string): Promise<number | null> => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const { data, error } = await supabase
      .from('hydration_logs')
      .select('amount')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') return null; // No row found
      if (error.code === '42P01') return null; // Table doesn't exist
      console.error('Failed to fetch hydration:', JSON.stringify(error, null, 2));
      return null;
    }
    return data?.amount ?? null;
  } catch (e) {
    console.error('Supabase hydration fetch error:', e);
    return null;
  }
};

export const getFastingState = (): FastingState => {
  const stored = localStorage.getItem(STORAGE_KEYS.FASTING);
  if (!stored) return { isFasting: false, startTime: null, targetHours: 16 };
  return JSON.parse(stored);
};

export const saveFastingState = (state: FastingState): void => {
  localStorage.setItem(STORAGE_KEYS.FASTING, JSON.stringify(state));
};
