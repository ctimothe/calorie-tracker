
import React, { useState, useEffect } from 'react';
import { UserProfile, MealLog, AIMealSuggestion } from '../types';
import { getMealSuggestions, getRecipeDetails } from '../services/geminiService';
import { t } from '../translations';
import { ChefHat, Sparkles, Clock, Flame, ChevronRight, Loader2, X, Star, CheckCircle2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Extended type for detailed recipe view
interface RecipeDetails extends AIMealSuggestion {
  imageUrl?: string;
  ingredients: string[];
  steps: string[];
  tips: string;
  reviews: { source: string; rating: number; quote: string }[];
}

interface AIChefProps {
  profile: UserProfile;
  logs: MealLog[];
}

const AIChef: React.FC<AIChefProps> = ({ profile, logs }) => {
  const [suggestions, setSuggestions] = useState<AIMealSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Dinner');

  // Recipe detail modal state
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetails | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const today = new Date().toDateString();
  const consumed = logs
    .filter(log => new Date(log.date).toDateString() === today)
    .reduce((acc, log) => acc + log.summary.totalCalories, 0);

  const remaining = Math.max(0, profile.calorieGoal - consumed);

  // Auto-fetch on mount and when mealType changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const results = await getMealSuggestions(remaining, mealType, profile.language);
        setSuggestions(results);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, [mealType, remaining, profile.language]);

  // Handle recipe click → fetch details and show modal
  const handleRecipeClick = async (meal: AIMealSuggestion) => {
    setDetailLoading(true);
    try {
      const details = await getRecipeDetails(meal, profile.language);
      setSelectedRecipe(details as RecipeDetails);
    } catch (e) {
      console.error(e);
      // Fallback: show basic info if detail fetch fails
      setSelectedRecipe({
        ...meal,
        ingredients: ['Loading failed...'],
        steps: ['Could not load recipe steps.'],
        tips: '',
        reviews: []
      });
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in px-4">

      {/* Header */}
      <div className="bg-surface-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden ring-1 ring-white/10">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <ChefHat size={120} />
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2.5">
            <ChefHat className="text-brand-300" />
            {t('chef.title', profile.language)}
          </h2>
          <p className="text-surface-400 text-sm mt-2 font-medium">
            {t('chef.subtitle', profile.language)} <span className="text-white font-black">{remaining} kcal</span>.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="glass-panel rounded-2xl p-5 ring-1 ring-white/60">
        <label className="text-xs font-bold text-content-subtle uppercase tracking-wider mb-3 block">{t('chef.suggestion_for', profile.language)}</label>
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
          {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((type) => (
            <button
              key={type}
              onClick={() => setMealType(type as any)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${mealType === type ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' : 'bg-surface-100 text-content-subtle hover:bg-surface-200 hover:text-content'}`}
            >
              {t(`chef.${type.toLowerCase()}`, profile.language)}
            </button>
          ))}
        </div>

        {/* Generate button now just refreshes */}
        <button
          onClick={() => {
            // Force re-fetch by triggering effect
            setSuggestions([]);
            setLoading(true);
            getMealSuggestions(remaining, mealType, profile.language)
              .then(setSuggestions)
              .finally(() => setLoading(false));
          }}
          disabled={loading}
          className="w-full mt-4 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-70 disabled:scale-100 shadow-xl shadow-brand-500/25"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
          {t('chef.generate', profile.language)}
        </button>
      </div>

      {/* Results - 5 meal suggestions */}
      <div className="space-y-4">
        {loading ? (
          // Loading skeletons
          [...Array(5)].map((_, idx) => (
            <div key={idx} className="bg-white rounded-[2rem] p-6 shadow-sm border border-surface-100 ring-1 ring-black/5 animate-pulse">
              <div className="flex justify-between items-start mb-3">
                <div className="h-5 bg-surface-200 rounded w-2/3"></div>
                <div className="h-6 w-16 bg-surface-200 rounded-lg"></div>
              </div>
              <div className="h-4 bg-surface-100 rounded w-full mb-2"></div>
              <div className="h-4 bg-surface-100 rounded w-3/4 mb-5"></div>
              <div className="h-px bg-surface-100 mb-3.5"></div>
              <div className="flex gap-4">
                <div className="h-4 bg-surface-100 rounded w-20"></div>
                <div className="h-4 bg-surface-100 rounded w-16"></div>
                <div className="h-4 bg-surface-100 rounded w-16"></div>
              </div>
            </div>
          ))
        ) : suggestions.map((meal, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => handleRecipeClick(meal)}
            className="bg-white rounded-[2rem] p-6 shadow-sm border border-surface-100 hover:border-brand-200 transition-all cursor-pointer group hover:shadow-md ring-1 ring-black/5"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-content text-lg group-hover:text-brand-600 transition-colors font-display leading-tight">{meal.name}</h3>
              <span className="bg-orange-50 text-orange-600 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shrink-0 border border-orange-100">
                <Flame size={12} fill="currentColor" /> {meal.calories}
              </span>
            </div>
            <p className="text-content-subtle text-sm mb-5 leading-relaxed line-clamp-2">{meal.description}</p>

            <div className="flex items-center justify-between text-xs text-content-subtle border-t border-surface-100 pt-3.5">
              <div className="flex gap-4 font-bold tracking-wide">
                <span className="flex items-center gap-1.5"><Clock size={14} className="text-content-subtle" /> {meal.prepTime}</span>
                <span className="text-blue-600 bg-blue-50 px-1.5 rounded-md">P: {meal.protein}g</span>
                <span className="text-emerald-600 bg-emerald-50 px-1.5 rounded-md">C: {meal.carbs}g</span>
              </div>
              <ChevronRight size={18} className="text-content-subtle group-hover:text-brand-500 transition-colors" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recipe Detail Modal */}
      <AnimatePresence>
        {(selectedRecipe || detailLoading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => !detailLoading && setSelectedRecipe(null)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {detailLoading ? (
                <div className="p-8 flex flex-col items-center justify-center h-64">
                  <Loader2 size={32} className="text-brand-600 animate-spin mb-4" />
                  <p className="text-content-subtle font-medium">Loading recipe details...</p>
                </div>
              ) : selectedRecipe && (
                <>
                  {/* Modal Header */}
                  <div className="p-5 border-b border-surface-100 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-display font-bold text-content">{selectedRecipe.name}</h3>
                      <div className="flex items-center gap-3 mt-2 text-xs font-bold">
                        <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded-lg flex items-center gap-1">
                          <Flame size={12} fill="currentColor" /> {selectedRecipe.calories} kcal
                        </span>
                        <span className="text-content-subtle flex items-center gap-1">
                          <Clock size={12} /> {selectedRecipe.prepTime}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedRecipe(null)}
                      className="p-2 hover:bg-surface-100 rounded-xl transition-colors"
                    >
                      <X size={20} className="text-content-subtle" />
                    </button>
                  </div>

                  {/* Modal Content - Scrollable */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    {/* Macros */}
                    <div className="flex gap-3">
                      <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-blue-600">{selectedRecipe.protein}g</p>
                        <p className="text-xs font-medium text-blue-500">Protein</p>
                      </div>
                      <div className="flex-1 bg-emerald-50 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-emerald-600">{selectedRecipe.carbs}g</p>
                        <p className="text-xs font-medium text-emerald-500">Carbs</p>
                      </div>
                      <div className="flex-1 bg-amber-50 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-amber-600">{selectedRecipe.fat}g</p>
                        <p className="text-xs font-medium text-amber-500">Fat</p>
                      </div>
                    </div>

                    {/* Ingredients */}
                    <div>
                      <h4 className="font-bold text-content mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-brand-100 rounded-lg flex items-center justify-center text-brand-600 text-sm">🥗</span>
                        {t('chef.ingredients', profile.language) || 'Ingredients'}
                      </h4>
                      <ul className="space-y-2">
                        {selectedRecipe.ingredients.map((ing, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-content-subtle">
                            <CheckCircle2 size={16} className="text-brand-500 shrink-0 mt-0.5" />
                            {ing}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Steps */}
                    <div>
                      <h4 className="font-bold text-content mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 text-sm">📝</span>
                        {t('chef.steps', profile.language) || 'Steps'}
                      </h4>
                      <ol className="space-y-3">
                        {selectedRecipe.steps.map((step, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-content-subtle">
                            <span className="w-6 h-6 bg-surface-100 rounded-full flex items-center justify-center text-content font-bold text-xs shrink-0">{i + 1}</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Tips */}
                    {selectedRecipe.tips && (
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                        <h4 className="font-bold text-amber-800 mb-1 text-sm flex items-center gap-2">
                          <Sparkles size={14} className="text-amber-600" />
                          Pro Tip
                        </h4>
                        <p className="text-sm text-amber-700">{selectedRecipe.tips}</p>
                      </div>
                    )}

                    {/* Reviews */}
                    {selectedRecipe.reviews.length > 0 && (
                      <div>
                        <h4 className="font-bold text-content mb-3 flex items-center gap-2">
                          <Users size={16} className="text-content-subtle" />
                          Community Reviews
                        </h4>
                        <div className="space-y-3">
                          {selectedRecipe.reviews.map((review, i) => (
                            <div key={i} className="bg-surface-50 rounded-xl p-3 border border-surface-100">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-content-subtle">{review.source}</span>
                                <div className="flex">
                                  {[...Array(5)].map((_, si) => (
                                    <Star key={si} size={12} className={si < review.rating ? 'text-amber-400 fill-amber-400' : 'text-surface-200'} />
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-content-subtle italic">"{review.quote}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AIChef;

