
import React, { useState } from 'react';
import { UserProfile, MealLog, AppView } from '../types';
import { getHealthConnections } from '../services/healthService';
import { t } from '../translations';
import { getMealEmoji } from '../services/foodEmojiService';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Flame, Droplet, Wheat, Dumbbell, Info, Footprints, Lock, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardProps {
  profile: UserProfile;
  logs: MealLog[];
  onNavigate?: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ profile, logs, onNavigate }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Steps - read only, synced from health apps
  const steps = profile.dailySteps || 0;

  // Check if user has connected health apps
  const healthConnections = getHealthConnections();
  const hasHealthConnection = healthConnections.some(c => c.connected);

  // Logs for today
  const todayLogs = logs.filter(log => new Date(log.date).toDateString() === new Date().toDateString());

  const consumed = todayLogs.reduce((acc, log) => ({
    calories: acc.calories + log.summary.totalCalories,
    protein: acc.protein + log.summary.totalProtein,
    carbs: acc.carbs + log.summary.totalCarbs,
    fat: acc.fat + log.summary.totalFat
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  // Active Calories: Approx 0.04 kcal per step
  const activeCalories = Math.round(steps * 0.04);
  const totalDailyBudget = profile.calorieGoal + activeCalories;
  const remainingCalories = Math.max(0, totalDailyBudget - consumed.calories);

  const progress = Math.min(100, (consumed.calories / totalDailyBudget) * 100);

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

      {/* Header with Streak */}
      <motion.div variants={itemVariants} className="flex justify-between items-center pt-2">
        <div>
          <h2 className="text-3xl font-display font-bold text-content tracking-tight">{t('dashboard.today', profile.language)}</h2>
          <p className="text-xs font-bold text-content-subtle capitalize tracking-wide mt-0.5">{new Date().toLocaleDateString(profile.language === 'en' ? 'en-US' : profile.language === 'ru' ? 'ru-RU' : 'uz-UZ', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-1.5 bg-orange-50/80 px-4 py-2 rounded-2xl border border-orange-100 shadow-sm">
          <Flame size={16} className="text-orange-500 fill-orange-500 mb-0.5" />
          <span className="text-sm font-black text-orange-600 uppercase tracking-wide whitespace-nowrap">{profile.currentStreak} {t('dashboard.streak', profile.language)}</span>
        </div>
      </motion.div>

      {/* Main Calorie Card (Dynamic TDEE) */}
      <motion.div variants={itemVariants} className="glass-panel p-8 rounded-[2rem] relative overflow-hidden group ring-1 ring-white/60">

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-400/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none mix-blend-multiply" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-400/20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none mix-blend-multiply" />

        <button onClick={() => setShowTooltip(!showTooltip)} className="absolute top-5 right-5 text-content-subtle/50 hover:text-brand-600 z-20 transition-colors p-2">
          <Info size={20} />
        </button>

        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-white/95 backdrop-blur-md z-30 p-6 flex flex-col justify-center text-center rounded-[2rem]"
            >
              <p className="text-base text-content mb-4 font-bold font-display">{t('dashboard.dynamic_goal', profile.language)}: {totalDailyBudget} kcal</p>
              <div className="space-y-3 text-xs text-content-subtle font-medium bg-surface-50 p-5 rounded-2xl border border-surface-100">
                <p className="flex justify-between items-center">
                  <span>{t('dashboard.base_bmr', profile.language)}:</span>
                  <span className="font-bold text-content text-sm">{profile.calorieGoal}</span>
                </p>
                <div className="h-px bg-surface-200"></div>
                <p className="flex justify-between items-center">
                  <span>+ {t('dashboard.activity', profile.language)}:</span>
                  <span className="font-bold text-emerald-600 text-sm">+{activeCalories}</span>
                </p>
                <p className="text-[10px] text-right text-content-subtle/70">({steps.toLocaleString()} {t('dashboard.steps', profile.language).toLowerCase()})</p>
              </div>
              <button onClick={() => setShowTooltip(false)} className="mt-6 text-white bg-brand-600 py-3 rounded-xl font-bold text-sm hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/30">{t('common.close', profile.language)}</button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between relative z-10 mb-8">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle">{t('dashboard.calories_left', profile.language)}</p>
            <h3 className="text-6xl font-display font-black text-content tracking-tighter tabular-nums">{Math.round(remainingCalories)}</h3>
            <p className="text-xs text-content-subtle font-bold tracking-wide flex items-baseline gap-1">
              {t('dashboard.goal', profile.language)}: <span className="text-content">{totalDailyBudget}</span>
              {activeCalories > 0 && <span className="text-emerald-500 text-[10px] font-black uppercase tracking-wider">(+{activeCalories})</span>}
            </p>
          </div>

          <div className="h-32 w-32 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[{ value: consumed.calories }, { value: remainingCalories }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={60}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={10}
                  paddingAngle={4}
                >
                  <Cell fill="#16a34a" /> {/* brand-600 */}
                  <Cell fill="rgba(203, 213, 225, 0.3)" /> {/* surface-300 */}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-brand-50 p-4 rounded-full shadow-inner ring-4 ring-white">
                <Flame className="w-6 h-6 text-brand-500 fill-brand-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full bg-surface-100/50 rounded-full h-4 overflow-hidden p-1 box-content border border-surface-200/50 shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="bg-gradient-to-r from-brand-500 to-emerald-400 h-full rounded-full shadow-[0_2px_10px_rgba(34,197,94,0.3)] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20" />
          </motion.div>
        </div>
      </motion.div>

      {/* Step Tracker - Locked until health app connected */}
      <motion.div variants={itemVariants} className="glass-panel p-6 rounded-3xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-content flex items-center gap-2 text-xs uppercase tracking-wider">
            <Footprints className="text-pink-500 fill-pink-500" size={16} />
            {t('dashboard.steps', profile.language)}
          </h3>
          {hasHealthConnection && (
            <span className="text-[10px] font-black text-pink-600 bg-pink-50 px-2 py-1 rounded-lg border border-pink-100">
              {Math.round((steps / profile.stepGoal) * 100)}%
            </span>
          )}
        </div>

        {hasHealthConnection ? (
          // Connected - show actual steps
          <>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-display font-black text-content tracking-tight">{steps.toLocaleString()}</span>
              <span className="text-xs text-content-subtle font-bold uppercase tracking-wider">/ {profile.stepGoal.toLocaleString()}</span>
            </div>
            <p className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 bg-emerald-50 w-fit px-3 py-1.5 rounded-xl border border-emerald-100">
              <Flame size={12} className="fill-current" /> {activeCalories} {t('dashboard.active_calories', profile.language)}
            </p>
          </>
        ) : (
          // Not connected - show lock overlay
          <div className="relative">
            <div className="blur-sm select-none pointer-events-none opacity-50">
              <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-extrabold text-content-subtle">0</span>
                <span className="text-sm text-content-subtle font-medium mb-1.5">/ {profile.stepGoal.toLocaleString()}</span>
              </div>
              <p className="text-xs text-content-subtle font-bold flex items-center gap-1">
                <Flame size={12} /> 0 {t('dashboard.active_calories', profile.language)}
              </p>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center -mt-2">
              <button
                onClick={() => onNavigate && onNavigate(AppView.PROFILE)}
                className="flex items-center gap-2 bg-content text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xl active:scale-95 transition-all hover:bg-black"
              >
                <Lock size={12} />
                {t('health.connect', profile.language)}
              </button>
              <p className="text-[10px] text-content-subtle mt-2 text-center font-medium max-w-[200px]">{t('health.tap_to_connect', profile.language)}</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Macros Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
        {[
          { icon: Dumbbell, color: 'blue', label: 'protein', value: consumed.protein, goal: profile.proteinGoal, unit: 'g', text: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: Wheat, color: 'emerald', label: 'carbs', value: consumed.carbs, goal: profile.carbsGoal, unit: 'g', text: 'text-emerald-600', bg: 'bg-emerald-50' },
          { icon: Droplet, color: 'amber', label: 'fat', value: consumed.fat, goal: profile.fatGoal, unit: 'g', text: 'text-amber-600', bg: 'bg-amber-50' }
        ].map((macro) => {
          const Icon = macro.icon;
          const percentage = Math.min(100, (macro.value / macro.goal) * 100);

          return (
            <div key={macro.label} className="glass-panel rounded-2xl p-4 flex flex-col items-center justify-center space-y-3 shadow-sm hover:shadow-md transition-shadow group">
              <div className={`p-2.5 rounded-2xl ${macro.bg} ${macro.text} shadow-sm ring-1 ring-inset ring-black/5`}>
                <Icon size={18} className="fill-current" />
              </div>
              <div className="text-center">
                <span className="block text-xl font-display font-black text-content tracking-tight">{Math.round(macro.value)}<span className="text-[10px] font-bold text-content-subtle ml-0.5 uppercase">{macro.unit}</span></span>
                <span className="text-[10px] font-bold text-content-subtle uppercase tracking-wider">{t(`dashboard.${macro.label}`, profile.language)}</span>
              </div>
              <div className={`w-full bg-surface-100 rounded-full h-1.5 overflow-hidden`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className={`${macro.bg.replace('bg-', 'bg-').replace('-50', '-500')} h-full rounded-full`}
                />
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants}>
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="text-xs font-bold text-content-subtle uppercase tracking-widest">{t('dashboard.recent_meals', profile.language)}</h3>
          {todayLogs.length > 0 && (
            <button
              onClick={() => onNavigate && onNavigate(AppView.HISTORY)}
              className="text-xs text-brand-600 font-bold hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              {t('common.see_all', profile.language) || 'All'}
            </button>
          )}
        </div>
        {todayLogs.length === 0 ? (
          <div className="text-center py-12 glass-panel rounded-3xl border-dashed border-surface-200">
            <div className="w-16 h-16 bg-surface-50 rounded-full flex items-center justify-center mx-auto mb-3 text-surface-300">
              <Info size={32} />
            </div>
            <p className="text-content-subtle text-sm font-medium">{t('dashboard.no_meals', profile.language)}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayLogs.slice(0, 3).map((log, index) => (
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                key={log.id}
                onClick={() => onNavigate && onNavigate(AppView.HISTORY)}
                className="w-full flex items-center justify-between glass-panel p-3 rounded-2xl hover:border-brand-200 hover:shadow-md active:scale-[0.98] transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  {/* Meal Icon */}
                  <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm shrink-0 bg-white border border-surface-100 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    {log.icon_emoji || getMealEmoji(log.items.map(i => i.name), log.mealType)}
                  </div>
                  <div>
                    <p className="font-bold text-content text-sm">{log.items[0]?.name || log.mealType}</p>
                    <p className="text-[10px] font-bold text-content-subtle uppercase tracking-wider line-clamp-1 mt-0.5">{log.items.length > 1 ? log.items.slice(1).map(i => i.name).join(', ') : log.mealType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right bg-surface-50 px-2 py-1 rounded-lg border border-surface-100">
                    <span className="block font-black text-content text-sm">{log.summary.totalCalories}</span>
                    <span className="text-[8px] font-bold text-content-subtle uppercase">kcal</span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-surface-100 flex items-center justify-center text-content-subtle group-hover:bg-brand-50 group-hover:text-brand-500 transition-colors">
                    <ChevronRight size={14} />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>

    </motion.div>
  );
};

export default Dashboard;
