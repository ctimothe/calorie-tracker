
import React, { useState } from 'react';
import { MealLog, UserProfile } from '../types';
import { t } from '../translations';
import { Calendar, ChevronRight, ChevronDown, BarChart3, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getMealEmoji } from '../services/foodEmojiService';
import { motion, AnimatePresence } from 'framer-motion';

interface HistoryLogProps {
  logs: MealLog[];
  profile: UserProfile;
}

const HistoryLog: React.FC<HistoryLogProps> = ({ logs, profile }) => {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const groupedLogs = logs.reduce((groups, log) => {
    const date = new Date(log.date).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(log);
    return groups;
  }, {} as Record<string, MealLog[]>);

  const dates = Object.keys(groupedLogs).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const getLast7DaysData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();

      const daysLogs = groupedLogs[dateStr] || [];
      const totalCals = daysLogs.reduce((acc, log) => acc + log.summary.totalCalories, 0);

      data.push({
        day: d.toLocaleDateString(profile.language === 'en' ? 'en-US' : 'ru-RU', { weekday: 'short' }),
        calories: totalCals,
        date: dateStr
      });
    }
    return data;
  };

  const weeklyData = getLast7DaysData();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  if (logs.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400 space-y-6">
        <div className="w-24 h-24 bg-white/50 rounded-full flex items-center justify-center shadow-inner blur-sm">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
            <Calendar className="w-8 h-8 text-slate-300" />
          </div>
        </div>
        <p className="font-medium text-slate-500">{t('dashboard.no_meals', profile.language)}</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-24"
    >

      {/* Weekly Analytics Chart */}
      <motion.div variants={itemVariants} className="glass-panel p-6 rounded-[2rem] relative overflow-hidden ring-1 ring-white/60">
        <div className="absolute top-0 right-0 w-40 h-40 bg-brand-400/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none mix-blend-multiply" />

        <div className="flex items-center justify-between mb-6 relative z-10">
          <h3 className="text-sm font-bold text-content flex items-center gap-2">
            <div className="p-2 bg-brand-100/50 rounded-xl text-brand-600">
              <TrendingUp size={16} />
            </div>
            Weekly Intake
          </h3>
          <span className="text-[10px] font-bold text-content-subtle uppercase tracking-widest bg-surface-50 border border-surface-100 px-2.5 py-1 rounded-lg">Last 7 Days</span>
        </div>

        <div className="h-48 w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }}
                dy={10}
              />
              <Tooltip
                cursor={{ fill: '#f1f5f9', radius: 8 }}
                contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 30px -5px rgb(0 0 0 / 0.1)', padding: '12px 16px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}
                formatter={(value: number) => [<span className="font-bold text-content">{value} kcal</span>, '']}
                labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}
              />
              <Bar dataKey="calories" radius={[6, 6, 6, 6]} barSize={24}>
                {weeklyData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.calories > profile.calorieGoal ? '#f87171' : entry.calories > 0 ? '#16a34a' : '#e2e8f0'}
                    className="transition-all hover:opacity-80 cursor-pointer"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {dates.map((date) => (
        <motion.div variants={itemVariants} key={date} className="space-y-3">
          <h3 className="text-xs font-bold text-content-subtle uppercase tracking-wider pl-4 sticky top-0 z-10 bg-surface-50/90 backdrop-blur-md py-3 w-full border-b border-transparent transition-all">
            {new Date(date).toLocaleDateString(profile.language === 'en' ? 'en-US' : 'ru-RU', { weekday: 'short', month: 'short', day: 'numeric' })}
          </h3>

          <div className="space-y-3">
            {groupedLogs[date].map((log) => {
              const isExpanded = expandedLogId === log.id;
              return (
                <motion.div
                  layout
                  key={log.id}
                  className={`bg-white rounded-2xl border transition-all overflow-hidden ${isExpanded ? 'shadow-xl border-brand-200 ring-2 ring-brand-100/50' : 'shadow-sm border-surface-100 hover:shadow-md hover:border-surface-200'}`}
                >
                  <button
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="w-full p-4 flex items-center justify-between text-left relative"
                  >
                    <div className="flex items-center gap-4 relative z-10 w-full overflow-hidden">
                      {/* Meal Icon - Emoji based on food type */}
                      <div className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center text-3xl transition-all duration-500 ${isExpanded ? 'bg-brand-50 rotate-6 scale-110' : 'bg-surface-50'}`}>
                        {log.icon_emoji || getMealEmoji(log.items.map(i => i.name), log.mealType)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start">
                          <p className={`font-bold text-sm truncate transition-colors ${isExpanded ? 'text-brand-700' : 'text-content'}`}>{log.items[0]?.name || log.mealType}</p>
                          <div className="text-right shrink-0 ml-2">
                            <span className="block font-black text-content text-sm">{log.summary.totalCalories}</span>
                          </div>
                        </div>
                        <p className="text-xs text-content-subtle truncate max-w-[200px] mb-2 font-medium">
                          {log.items.length > 1 ? log.items.slice(1).map(i => i.name).join(', ') : log.mealType}
                        </p>
                        <div className="flex gap-1.5">
                          <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md font-bold tracking-tight border border-blue-100">{log.summary.totalProtein}p</span>
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md font-bold tracking-tight border border-emerald-100">{log.summary.totalCarbs}c</span>
                          <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md font-bold tracking-tight border border-amber-100">{log.summary.totalFat}f</span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Expanded Details with User's Photo */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-surface-50/50"
                      >
                        <div className="px-4 pb-4">
                          {/* User's Actual Photo - Full Quality */}
                          {log.image_url && log.image_source === 'user' && (
                            <div className="mb-4 rounded-xl overflow-hidden shadow-sm ring-1 ring-black/5 bg-white">
                              <img
                                src={log.image_url}
                                alt={log.items[0]?.name || log.mealType}
                                className="w-full h-auto object-cover max-h-64"
                                loading="lazy"
                              />
                            </div>
                          )}

                          <div className="pt-2 border-t border-surface-200/50">
                            <div className="space-y-2 mt-2">
                              {log.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-white rounded-xl p-3 shadow-sm border border-surface-100">
                                  <div>
                                    <p className="font-bold text-sm text-content">{item.name}</p>
                                    <p className="text-xs text-content-subtle font-medium">{item.portionSize}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-black text-sm text-content">{item.calories} <span className="text-[10px] text-content-subtle font-normal ml-0.5">kcal</span></p>
                                    <div className="flex gap-1.5 justify-end mt-1 text-[10px] font-bold tracking-wide">
                                      <span className="text-blue-500">P:{item.protein}</span>
                                      <span className="text-emerald-500">C:{item.carbs}</span>
                                      <span className="text-amber-500">F:{item.fat}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {log.summary.advice && (
                              <div className="mt-4 p-4 bg-brand-50/50 border border-brand-100/60 rounded-xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-brand-400" />
                                <p className="text-xs text-brand-800 font-medium leading-relaxed italic">"{log.summary.advice}"</p>
                              </div>
                            )}

                            <div className="mt-4 flex justify-end">
                              <button className="text-xs font-bold text-red-500 hover:text-red-700 px-3 py-2 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1">
                                Delete Entry
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default HistoryLog;
