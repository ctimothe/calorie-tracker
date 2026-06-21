
import React, { useState, useEffect } from 'react';
import { FastingState } from '../types';
import { getFastingState, saveFastingState, getProfile } from '../services/storageService';
import { Timer, Play, Square, Flame } from 'lucide-react';
import { t } from '../translations';
import { motion } from 'framer-motion';

const FastingWidget: React.FC = () => {
  const [state, setState] = useState<FastingState>(getFastingState());
  const [elapsed, setElapsed] = useState<number>(0);
  const profile = getProfile();

  useEffect(() => {
    let interval: any;

    const updateTimer = () => {
      if (state.isFasting && state.startTime) {
        const start = new Date(state.startTime).getTime();
        const now = new Date().getTime();
        setElapsed(now - start);
      } else {
        setElapsed(0);
      }
    };

    updateTimer();

    if (state.isFasting) {
      interval = setInterval(updateTimer, 60000); // Update every minute
    }

    return () => clearInterval(interval);
  }, [state]);

  const toggleFasting = () => {
    const newState: FastingState = {
      isFasting: !state.isFasting,
      startTime: !state.isFasting ? new Date().toISOString() : null,
      targetHours: state.targetHours
    };
    setState(newState);
    saveFastingState(newState);
  };

  const hoursElapsed = Math.floor(elapsed / (1000 * 60 * 60));
  const minutesElapsed = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));

  const progress = Math.min(100, (elapsed / (state.targetHours * 60 * 60 * 1000)) * 100);

  return (
    <div className="glass-panel p-6 rounded-2xl flex items-center justify-between relative overflow-hidden group">
      {state.isFasting && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-all duration-1000" />
      )}

      <div className="flex-1 relative z-10">
        <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wide">
          <Timer className={`${state.isFasting ? 'text-orange-500' : 'text-slate-400'}`} size={16} />
          {t('fasting.title', profile.language)}
        </h3>
        <p className="text-[10px] font-bold text-slate-400 mt-1 mb-4 uppercase tracking-wider">{t('fasting.target', profile.language)}: {state.targetHours} {t('fasting.hours', profile.language)}</p>

        {state.isFasting ? (
          <div>
            <p className="text-3xl font-black text-slate-800 tabular-nums leading-none">
              {hoursElapsed}:{minutesElapsed.toString().padStart(2, '0')}
              <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">hrs</span>
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">{t('fasting.active', profile.language)}</p>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs font-medium text-slate-400 leading-relaxed max-w-[150px]">{t('fasting.start_prompt', profile.language)}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-3 relative z-10">
        <div className="relative h-18 w-18">
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-100"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            />
            <path
              className={`${state.isFasting ? 'text-orange-500' : 'text-slate-300'} transition-all duration-1000 ease-out`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeDasharray={`${progress}, 100`}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          <button
            onClick={toggleFasting}
            className={`absolute inset-0 m-auto w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95 ${state.isFasting ? 'bg-slate-900 hover:bg-slate-800' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {state.isFasting ? <Square size={14} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FastingWidget;
