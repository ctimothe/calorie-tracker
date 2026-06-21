
import React from 'react';
import { AppView, Language } from '../types';
import { t } from '../translations';
import { LayoutDashboard, History, ScanLine, Target, ChefHat } from 'lucide-react';
import { motion } from 'framer-motion';

interface BottomNavProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  language: Language;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate, language }) => {
  const navItems = [
    { view: AppView.DASHBOARD, icon: LayoutDashboard, label: t('nav.home', language) },
    { view: AppView.CHEF, icon: ChefHat, label: t('nav.chef', language) },
    { view: AppView.SCAN, icon: ScanLine, label: t('nav.scan', language), primary: true },
    { view: AppView.HISTORY, icon: History, label: t('nav.logs', language) },
    { view: AppView.RECOMMENDATIONS, icon: Target, label: t('nav.recommendations', language) },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-4 px-4 sm:pb-6 sm:px-0 flex justify-center pointer-events-none" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
      <div className="bg-surface-900/90 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-sm p-2 flex items-center justify-between shadow-2xl shadow-surface-900/20 relative pointer-events-auto ring-1 ring-white/5 mx-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.view;
          const Icon = item.icon;

          if (item.primary) {
            return (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className="relative w-14 h-14 -mt-6 bg-brand-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-500/40 hover:bg-brand-500 hover:scale-105 active:scale-95 transition-all ring-8 ring-surface-50"
              >
                <Icon size={24} strokeWidth={2.5} />
              </button>
            )
          }

          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${isActive ? 'text-white' : 'text-surface-400 hover:text-white'}`}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-white/10 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className="relative z-10" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
