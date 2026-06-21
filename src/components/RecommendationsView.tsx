
import React, { useState, useEffect } from 'react';
import { UserProfile, MealLog } from '../types';
import { getWaterIntake } from '../services/storageService';
import { t } from '../translations';
import { Droplet, Trophy, Plus, Minus, X, Undo2, Sparkles, RefreshCw, Flame } from 'lucide-react';
import { getQuickSuggestions, getAISuggestions, QuickSuggestion } from '../services/recommendationService';
import FastingWidget from './FastingWidget';
import { motion, AnimatePresence } from 'framer-motion';

interface RecommendationsViewProps {
   profile: UserProfile;
   logs: MealLog[];
   onQuickLog?: (entry: { name: string; calories: number; protein?: number; carbs?: number; fat?: number }) => Promise<string | void>;
   onWaterChange?: (amount: number) => void;
   onDeleteLog?: (id: string) => Promise<void>;
}

const RecommendationsView: React.FC<RecommendationsViewProps> = ({ profile, logs, onQuickLog, onWaterChange, onDeleteLog }) => {
   const [water, setWater] = useState<number>(() => getWaterIntake() || 0);
   const [bread, setBread] = useState<number>(0);
   const [joinedChallenge, setJoinedChallenge] = useState<boolean>(false);
   const [recentQuickLog, setRecentQuickLog] = useState<{ id: string; name: string; calories: number } | null>(null);
   const [toastVisible, setToastVisible] = useState<boolean>(false);

   // AI Suggestions state
   const [suggestions, setSuggestions] = useState<QuickSuggestion[]>([]);
   const [suggestionsSource, setSuggestionsSource] = useState<'rule' | 'ai'>('rule');
   const [suggestionsLoading, setSuggestionsLoading] = useState<boolean>(false);
   const [useAI, setUseAI] = useState<boolean>(false);

   // Load initial rule-based suggestions
   useEffect(() => {
      setSuggestions(getQuickSuggestions(profile, logs));
   }, [profile, logs]);

   // Fetch AI suggestions when toggled
   const fetchAISuggestions = async () => {
      setSuggestionsLoading(true);
      try {
         const result = await getAISuggestions(profile, logs, 'snack');
         setSuggestions(result.suggestions);
         setSuggestionsSource(result.source);
      } catch (e) {
         // Keep existing suggestions on error
         setSuggestionsSource('rule');
      } finally {
         setSuggestionsLoading(false);
      }
   };

   // When AI toggle changes, fetch AI or reset to rule-based
   useEffect(() => {
      if (useAI) {
         fetchAISuggestions();
      } else {
         setSuggestions(getQuickSuggestions(profile, logs));
         setSuggestionsSource('rule');
      }
   }, [useAI]);

   // Refresh water value when component mounts or logs change (indicating data refresh)
   useEffect(() => {
      setWater(getWaterIntake() || 0);
   }, [logs.length]);

   const todayLogs = logs.filter(log => new Date(log.date).toDateString() === new Date().toDateString());
   const consumed = todayLogs.reduce((acc, log) => ({
      calories: acc.calories + log.summary.totalCalories,
      carbs: acc.carbs + log.summary.totalCarbs
   }), { calories: 0, carbs: 0 });

   const breadCarbsPerSlice = 15; // grams per slice (approx)
   const maxBreadSlices = Math.max(0, Math.floor((profile.carbsGoal - consumed.carbs) / breadCarbsPerSlice));

   const addWater = (amount: number) => {
      const newVal = Math.max(0, water + amount);
      setWater(newVal);
      if (onWaterChange) onWaterChange(amount);
   };
   const changeBread = (amount: number) => setBread(prev => Math.max(0, Math.min(maxBreadSlices, prev + amount)));

   // Derived values
   const activeCalories = Math.round((profile.dailySteps || 0) * 0.04);
   const totalDailyBudget = profile.calorieGoal + activeCalories;
   const remaining = Math.max(0, totalDailyBudget - consumed.calories);

   // Quick log handler with toast animation
   const handleQuickAdd = async (entry: { name: string; calories: number; protein?: number; carbs?: number; fat?: number }) => {
      const id = await onQuickLog?.(entry);
      if (id) {
         setRecentQuickLog({ id: id as string, name: entry.name, calories: entry.calories });
         setToastVisible(true);
      }
   };

   // Undo handler
   const handleUndo = async () => {
      if (recentQuickLog?.id && onDeleteLog) {
         await onDeleteLog(recentQuickLog.id);
      }
      setToastVisible(false);
      setRecentQuickLog(null);
   };

   // Toast auto-dismiss
   useEffect(() => {
      if (!toastVisible) return;
      const timer = setTimeout(() => {
         setToastVisible(false);
         setRecentQuickLog(null);
      }, 5000);
      return () => clearTimeout(timer);
   }, [toastVisible]);

   const containerVariants = {
      hidden: { opacity: 0 },
      show: {
         opacity: 1,
         transition: {
            staggerChildren: 0.1
         }
      }
   };

   const itemVariants = {
      hidden: { opacity: 0, y: 20 },
      show: { opacity: 1, y: 0 }
   };

   return (
      <motion.div
         variants={containerVariants}
         initial="hidden"
         animate="show"
         className="space-y-6 pb-24 content-with-bottom-nav px-4"
      >
         <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            <div className="flex-1">
               <h2 className="text-3xl font-bold font-display text-content">{t('nav.recommendations', profile.language)}</h2>
               <p className="text-xs font-medium text-content-subtle mt-1">{t('dashboard.water', profile.language)} &amp; {t('dashboard.challenges', profile.language)}</p>
            </div>

            {/* Quick Status Pill */}
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/60 shadow-sm ring-1 ring-black/5">
               <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-content-subtle uppercase tracking-widest">{t('dashboard.calories_left', profile.language)}</span>
                  <span className="text-2xl font-display font-black text-content leading-none mt-0.5">{remaining}</span>
               </div>
               <div className="h-8 w-[1px] bg-surface-200 mx-1"></div>
               <div className="flex gap-2">
                  <button onClick={() => addWater(250)} className="w-9 h-9 rounded-xl bg-cyan-100/50 text-cyan-600 flex items-center justify-center hover:bg-cyan-200/50 active:scale-95 transition-all ring-1 ring-cyan-100">
                     <Droplet size={16} className="fill-current" />
                  </button>
                  <button onClick={() => handleQuickAdd({ name: 'Quick Snack', calories: 100 })} className="w-9 h-9 rounded-xl bg-amber-100/50 text-amber-600 flex items-center justify-center hover:bg-amber-200/50 active:scale-90 transition-all ring-1 ring-amber-100">
                     <Flame size={16} className="fill-current" />
                  </button>
               </div>
            </div>
         </motion.div>

         {/* Suggestions with AI Toggle */}
         <motion.div variants={itemVariants} className="space-y-3 mt-2">
            {/* AI Toggle Header */}
            <div className="flex items-center justify-between px-1">
               <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-content">{t('recommendations.suggestions', profile.language)}</span>
                  {suggestionsSource === 'ai' && (
                     <span className="flex items-center gap-1 text-[10px] font-bold text-purple-600 bg-purple-100/50 px-2.5 py-1 rounded-full border border-purple-100/50">
                        <Sparkles size={10} className="text-purple-600 fill-current" />
                        AI GEN
                     </span>
                  )}
               </div>
               <div className="flex items-center gap-2">
                  {useAI && (
                     <button
                        onClick={fetchAISuggestions}
                        disabled={suggestionsLoading}
                        className="p-2 rounded-lg hover:bg-surface-100 text-content-subtle disabled:opacity-50 transition-colors"
                     >
                        <RefreshCw size={14} className={suggestionsLoading ? 'animate-spin' : ''} />
                     </button>
                  )}
                  <button
                     onClick={() => setUseAI(!useAI)}
                     className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${useAI
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-white text-content-subtle shadow-sm border border-surface-200 hover:border-surface-300'
                        }`}
                  >
                     <Sparkles size={12} className={useAI ? 'fill-current' : ''} />
                     {useAI ? t('recommendations.ai_on', profile.language) : t('recommendations.ai_off', profile.language)}
                  </button>
               </div>
            </div>

            {/* Suggestions Horizontal Scroll */}
            <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
               {suggestionsLoading ? (
                  // Loading skeletons - horizontal
                  [...Array(3)].map((_, i) => (
                     <div key={i} className="glass-panel rounded-2xl p-4 w-[260px] shrink-0 snap-start animate-pulse">
                        <div className="h-4 bg-surface-200 rounded w-3/4 mb-3"></div>
                        <div className="h-3 bg-surface-100 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-surface-100 rounded w-2/3 mb-4"></div>
                        <div className="h-9 bg-surface-200 rounded-xl w-full"></div>
                     </div>
                  ))
               ) : suggestions.length > 0 ? (
                  suggestions.map(s => (
                     <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={s.id}
                        className="glass-panel rounded-2xl p-4 w-[260px] shrink-0 snap-start flex flex-col group hover:border-brand-200 transition-all ring-1 ring-white/60"
                     >
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                           <div className="font-bold text-sm text-content leading-snug line-clamp-2 flex-1">
                              {s.name}
                              {s.source === 'ai' && <Sparkles size={10} className="text-purple-500 fill-current inline ml-1" />}
                           </div>
                           <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 border border-orange-100">
                              {s.calories} kcal
                           </span>
                        </div>

                        {/* Macros Row */}
                        <div className="flex gap-2 text-[10px] font-bold mb-3">
                           {s.carbs !== undefined && <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md">{s.carbs}g carbs</span>}
                           {s.protein !== undefined && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">{s.protein}g protein</span>}
                        </div>

                        {/* Reason Badge */}
                        {s.reason && (
                           <div className="text-[10px] font-bold text-emerald-600 mb-3 truncate bg-emerald-50/50 px-2 py-1 rounded-lg border border-emerald-100/50">
                              {s.reason}
                           </div>
                        )}

                        {/* Action Button - pushed to bottom */}
                        <div className="mt-auto pt-2">
                           <button
                              onClick={() => handleQuickAdd({ name: s.name, calories: s.calories, protein: s.protein, carbs: s.carbs, fat: s.fat })}
                              className="w-full py-2.5 rounded-xl bg-surface-900 text-white text-xs font-bold hover:bg-black active:scale-95 transition-all shadow-lg shadow-surface-900/10"
                           >
                              {t('recommendations.add_to_log', profile.language)}
                           </button>
                        </div>
                     </motion.div>
                  ))
               ) : (
                  <div className="text-center py-8 glass-panel rounded-2xl w-full">
                     <p className="text-sm text-content-subtle font-medium">{t('recommendations.no_suggestions', profile.language)}</p>
                  </div>
               )}
            </div>
         </motion.div>

         {/* Water Tracker with Progress Ring */}
         <motion.div variants={itemVariants} className="bg-gradient-to-br from-cyan-50 to-white rounded-[2rem] p-6 border border-cyan-100 shadow-sm relative overflow-hidden ring-1 ring-white/60">
            <div className="absolute top-0 right-0 w-56 h-56 bg-cyan-400/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none mix-blend-multiply" />

            <div className="flex items-center justify-between relative z-10">
               <div className="flex items-center gap-6">
                  {/* Circular Progress Ring */}
                  <div className="relative w-24 h-24">
                     <svg className="w-24 h-24 -rotate-90" viewBox="0 0 64 64">
                        {/* Background circle */}
                        <circle
                           cx="32"
                           cy="32"
                           r="28"
                           fill="none"
                           stroke="#e0f2fe"
                           strokeWidth="4"
                        />
                        {/* Progress circle */}
                        <circle
                           cx="32"
                           cy="32"
                           r="28"
                           fill="none"
                           stroke="#06b6d4"
                           strokeWidth="4"
                           strokeLinecap="round"
                           strokeDasharray={`${Math.min(100, (water / profile.waterGoal) * 100) * 1.76} 176`}
                           className="transition-all duration-1000 ease-out"
                        />
                     </svg>
                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-cyan-50 rounded-full p-3 shadow-inner">
                           <Droplet className="fill-cyan-500 text-cyan-500 drop-shadow-sm" size={20} />
                        </div>
                     </div>
                  </div>
                  <div>
                     <h3 className="font-bold text-cyan-950 text-sm uppercase tracking-wider mb-1">
                        {t('dashboard.water', profile.language)}
                     </h3>
                     <div className="flex items-center gap-1">
                        <p className="text-4xl font-display font-black text-cyan-600 tracking-tight">{(water / 1000).toFixed(1)}</p>
                        <span className="text-sm font-bold text-cyan-400 mt-2">L</span>
                     </div>
                     <p className="text-[10px] font-bold text-cyan-400/80 uppercase tracking-widest mt-1 bg-cyan-50 px-2 py-1 rounded-lg inline-block">{t('dashboard.goal', profile.language)}: {(profile.waterGoal / 1000).toFixed(1)}L</p>
                  </div>
               </div>
               <div className="flex flex-col gap-2">
                  <button onClick={() => addWater(250)} className="w-11 h-11 rounded-2xl bg-cyan-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:bg-cyan-600 active:scale-95 transition-all">
                     <Plus size={22} />
                  </button>
                  <button onClick={() => addWater(-250)} className="w-11 h-11 rounded-2xl bg-white text-cyan-400 flex items-center justify-center shadow-sm border border-cyan-100 hover:bg-cyan-50 active:scale-90 transition-all">
                     <Minus size={22} />
                  </button>
               </div>
            </div>

            {/* Mini Weekly Progress Bar */}
            <div className="mt-8 pt-5 border-t border-cyan-100/50 relative z-10">
               <div className="flex items-center justify-between text-[10px] font-bold text-cyan-800 uppercase tracking-wider mb-3">
                  <span>{t('recommendations.weekly_hydration', profile.language)}</span>
                  <span className="bg-cyan-100 px-2 py-0.5 rounded-lg text-cyan-700">{Math.round((water / profile.waterGoal) * 100)}%</span>
               </div>
               <div className="flex gap-2.5 h-12 items-end">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                     const isToday = i === new Date().getDay() - 1 || (new Date().getDay() === 0 && i === 6);
                     const fillPercent = isToday ? Math.min(100, (water / profile.waterGoal) * 100) : (i < (new Date().getDay() || 7) - 1 ? 40 + Math.random() * 40 : 10);
                     return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                           <div className={`w-full rounded-lg relative flex items-end overflow-hidden transition-all group-hover:bg-cyan-100 ${isToday ? 'bg-cyan-100 h-full' : 'bg-surface-100 h-4/5'}`}>
                              <motion.div
                                 initial={{ height: 0 }}
                                 animate={{ height: `${fillPercent}%` }}
                                 transition={{ duration: 1, delay: i * 0.1 }}
                                 className={`w-full rounded-lg ${isToday ? 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'bg-cyan-200'}`}
                              />
                           </div>
                           <span className={`text-[9px] font-bold ${isToday ? 'text-cyan-600' : 'text-surface-300'}`}>
                              {day}
                           </span>
                        </div>
                     );
                  })}
               </div>
            </div>
         </motion.div>

         {/* Bread recommendation card */}
         <motion.div variants={itemVariants} className="glass-panel rounded-[2rem] p-6 ring-1 ring-white/60">
            <h3 className="font-bold text-content mb-2">{t('recommendations.bread.title', profile.language)}</h3>
            <p className="text-sm text-content-subtle font-medium mb-6 leading-relaxed bg-surface-50 p-3 rounded-xl border border-surface-100">{t('recommendations.bread.description', profile.language)}</p>

            <div className="flex items-center justify-between bg-white rounded-2xl p-2.5 mb-4 shadow-sm border border-surface-100">
               <button onClick={() => changeBread(-1)} className="w-12 h-12 rounded-xl bg-surface-50 shadow-sm border border-surface-100 flex items-center justify-center text-content-subtle hover:text-content hover:bg-white transition-colors">
                  <Minus size={20} />
               </button>

               <div className="text-center">
                  <div className="font-display font-black text-3xl text-content">{bread}</div>
                  <div className="text-[10px] font-bold text-content-subtle uppercase tracking-widest">{t('recommendations.bread.slices', profile.language)}</div>
               </div>

               <button onClick={() => changeBread(1)} className="w-12 h-12 rounded-xl bg-surface-50 shadow-sm border border-surface-100 flex items-center justify-center text-content-subtle hover:text-content hover:bg-white transition-colors">
                  <Plus size={20} />
               </button>
            </div>

            <div className="flex items-center justify-between">
               <span className="text-xs font-bold text-content-subtle ml-1">{bread * breadCarbsPerSlice}g carbs total</span>
               <button onClick={() => handleQuickAdd({ name: 'Bread slice', calories: 70, carbs: 15 })} className="text-xs px-4 py-2 bg-brand-50 text-brand-700 rounded-xl font-bold hover:bg-brand-100 active:scale-95 transition-all">
                  {t('recommendations.add_to_log', profile.language)}
               </button>
            </div>
         </motion.div>

         {/* Challenges (copied from Dashboard simplified) */}
         <motion.div variants={itemVariants} className="bg-surface-900 rounded-[2rem] p-6 text-white relative overflow-hidden shadow-2xl shadow-surface-900/20 ring-1 ring-white/10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

            <h3 className="font-bold text-sm uppercase tracking-wide mb-6 flex items-center gap-2.5 relative z-10">
               <Trophy size={18} className="text-yellow-400" />
               {t('dashboard.challenges', profile.language)}
            </h3>

            <div className="space-y-4 relative z-10">
               <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-sm border border-white/5">
                  <div className="flex justify-between items-center mb-3">
                     <span className="font-bold text-sm">{t('dashboard.sugar_challenge', profile.language)}</span>
                     <span className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded-lg text-white uppercase tracking-wider">{t('dashboard.day', profile.language)} 12</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                     <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '40%' }}
                        className="bg-gradient-to-r from-yellow-400 to-amber-500 h-full rounded-full"
                     />
                  </div>
               </div>
               <button onClick={() => setJoinedChallenge(prev => !prev)} className={`w-full py-3.5 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 ${joinedChallenge ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-white text-surface-900 hover:bg-surface-100'}`}>
                  {joinedChallenge ? (
                     <><Sparkles size={14} className="fill-current" /> {t('dashboard.joined', profile.language)}</>
                  ) : (
                     t('dashboard.join_challenge', profile.language)
                  )}
               </button>
            </div>
         </motion.div>

         {/* Keep fasting widget present so user can see it on Tavsiyalar too */}
         <FastingWidget />

         {/* Floating Toast for Quick Add Confirmation */}
         <AnimatePresence>
            {toastVisible && recentQuickLog && (
               <motion.div
                  initial={{ y: 50, opacity: 0, x: '-50%' }}
                  animate={{ y: 0, opacity: 1, x: '-50%' }}
                  exit={{ y: 20, opacity: 0, x: '-50%' }}
                  className="fixed bottom-24 left-1/2 z-50 w-full max-w-sm px-4"
               >
                  <div className="bg-surface-900/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10">
                     <div className="bg-emerald-500/20 p-2 rounded-full text-emerald-400">
                        <Flame size={18} className="fill-current" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate">{t('recommendations.added', profile.language)}: {recentQuickLog.name}</div>
                        <div className="text-xs text-surface-400 font-medium">+{recentQuickLog.calories} kcal</div>
                     </div>
                     <div className="flex items-center gap-2">
                        <button
                           onClick={handleUndo}
                           className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors"
                        >
                           <Undo2 size={12} />
                           {t('recommendations.undo', profile.language)}
                        </button>
                        <button
                           onClick={() => { setToastVisible(false); setRecentQuickLog(null); }}
                           className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                        >
                           <X size={14} />
                        </button>
                     </div>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>
      </motion.div>
   );
};

export default RecommendationsView;

