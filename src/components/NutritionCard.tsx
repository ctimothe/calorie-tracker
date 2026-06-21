
import React, { useState, useEffect } from 'react';
import { AnalysisResult, Language } from '../types';
import { t } from '../translations';
import { motion } from 'framer-motion';
import { Zap, CheckCircle, ArrowLeft, Microscope } from 'lucide-react';

interface NutritionCardProps {
  result: AnalysisResult;
  onSave: (mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack', adjustedResult: AnalysisResult) => void;
  onCancel: () => void;
  language: Language;
}

const NutritionCard: React.FC<NutritionCardProps> = ({ result, onSave, onCancel, language }) => {
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Lunch');
  const [editableResult, setEditableResult] = useState<AnalysisResult>(result);

  useEffect(() => {
    setEditableResult(result);
  }, [result]);

  const handleMacroChange = (field: 'totalCalories' | 'totalProtein' | 'totalCarbs' | 'totalFat', value: string) => {
    const numValue = parseInt(value) || 0;
    setEditableResult(prev => ({
      ...prev,
      summary: {
        ...prev.summary,
        [field]: numValue
      }
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-6"
    >
      <button
        onClick={onCancel}
        className="flex items-center text-content-subtle text-sm font-bold mb-2 hover:text-content transition-colors active:scale-95 origin-left"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> {t('common.back', language)}
      </button>

      {/* Summary Header */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden text-center group ring-1 ring-white/50">
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-400/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 flex flex-col items-center"
        >
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase font-bold mb-6 tracking-wide shadow-sm border ${editableResult.summary.healthScore >= 7 ? 'bg-brand-50/80 text-brand-700 border-brand-100' : 'bg-amber-50/80 text-amber-700 border-amber-100'}`}>
            <Zap size={12} className="fill-current" />
            {t('scan.health_score', language)}: {editableResult.summary.healthScore}/10
          </span>

          <div className="flex flex-col items-center mb-8">
            <div className="flex items-baseline justify-center gap-1">
              <input
                type="number"
                value={editableResult.summary.totalCalories}
                onChange={(e) => handleMacroChange('totalCalories', e.target.value)}
                className="text-7xl font-display font-black text-content text-center w-full max-w-[240px] bg-transparent focus:outline-none p-0 leading-none tracking-tighter drop-shadow-sm selection:bg-brand-100"
              />
            </div>
            <p className="text-content-subtle text-xs font-bold uppercase tracking-[0.2em] mt-2 ml-1">Calories</p>
          </div>

          <div className="bg-surface-50/60 backdrop-blur-md rounded-2xl p-4 border border-white/50 w-full shadow-sm">
            <p className="text-sm text-content-subtle italic leading-relaxed font-medium">
              "{editableResult.summary.advice}"
            </p>
          </div>
        </motion.div>
      </div>

      {/* Macros Grid (Editable) */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Protein', key: 'totalProtein', color: 'text-violet-600', bg: 'bg-violet-50/80 border-violet-100' },
          { label: 'Carbs', key: 'totalCarbs', color: 'text-amber-600', bg: 'bg-amber-50/80 border-amber-100' },
          { label: 'Fat', key: 'totalFat', color: 'text-sky-600', bg: 'bg-sky-50/80 border-sky-100' }
        ].map((macro) => (
          <div key={macro.key} className={`rounded-2xl p-4 flex flex-col items-center gap-1 border ${macro.bg}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${macro.color}`}>{macro.label}</span>
            <div className="flex items-baseline gap-0.5">
              <input
                type="number"
                value={editableResult.summary[macro.key as keyof typeof editableResult.summary] as number}
                onChange={(e) => handleMacroChange(macro.key as any, e.target.value)}
                className="w-full bg-transparent rounded-lg text-center font-display font-black text-2xl text-content-subtle py-1 focus:text-content focus:ring-0 outline-none p-0"
              />
            </div>
            <span className="text-[10px] text-content-subtle/70 font-bold">g</span>
          </div>
        ))}
      </div>

      {/* Micronutrients (Biohacking) */}
      {editableResult.summary.micros && (
        <div className="bg-surface-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-2xl shadow-surface-900/20 ring-1 ring-white/10">
          <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none mix-blend-overlay"><Microscope size={128} /></div>
          <h3 className="text-sm font-bold flex items-center gap-2 mb-5 text-brand-300 uppercase tracking-wider">
            <Microscope className="w-4 h-4" />
            {t('bio.title', language)}
          </h3>
          <div className="grid grid-cols-2 gap-3 relative z-10 text-sm">
            {Object.entries(editableResult.summary.micros).map(([key, val]) => (
              <div key={key} className="bg-white/5 p-3.5 rounded-2xl backdrop-blur-md border border-white/5 flex flex-col gap-1 hover:bg-white/10 transition-colors">
                <p className="text-[10px] text-surface-400 uppercase tracking-widest font-bold">{key}</p>
                <p className="font-display font-bold text-white tracking-wide text-lg">{val}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meal Type Selector */}
      <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-surface-200 flex gap-1">
        {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((type) => (
          <button
            key={type}
            onClick={() => setMealType(type as any)}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${mealType === type ? 'bg-surface-900 text-white shadow-md scale-100' : 'text-content-subtle hover:text-content hover:bg-surface-50'}`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Items List */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-content-subtle uppercase tracking-widest px-2">Composition</h3>
        <div className="space-y-3">
          {editableResult.items.map((item, idx) => (
            <div key={idx} className="bg-white p-4 rounded-2xl border border-surface-100 flex justify-between items-center shadow-sm hover:border-surface-200 transition-colors">
              <div className="flex flex-col">
                <h4 className="font-bold text-content text-sm">{item.name}</h4>
                <p className="text-xs text-content-subtle font-medium mt-0.5">{item.portionSize}</p>
              </div>
              <div className="bg-surface-50 px-3 py-1.5 rounded-xl border border-surface-100 min-w-[80px] text-center">
                <span className="font-bold text-content text-sm">{item.calories}</span>
                <span className="text-[10px] text-content-subtle font-bold ml-1 uppercase">kcal</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => onSave(mealType, editableResult)}
        className="w-full btn-primary py-4 rounded-2xl font-bold text-lg shadow-xl shadow-brand-500/30 flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all"
      >
        <CheckCircle size={22} strokeWidth={2.5} />
        {t('scan.add_log', language)}
      </button>

      <div className="h-4" /> {/* Spacer */}
    </motion.div>
  );
};

export default NutritionCard;
