
import React, { useState } from 'react';
import { UserProfile, Language } from '../types';
import { calculateTargets, calculateBMR, calculateTDEE, calculateBodyFat, calculateAge } from '../services/storageService';
import { t } from '../translations';
import { ArrowRight, Check, Activity, Globe, Ruler, Brain, ChevronLeft, Target } from 'lucide-react';

interface OnboardingProps {
   initialProfile: UserProfile;
   onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ initialProfile, onComplete }) => {
   const [step, setStep] = useState(1);

   const defaultProfile: UserProfile = {
      name: '',
      language: 'en',
      setupCompleted: false,
      dob: '1990-01-01',
      age: 30,
      weight: 70,
      height: 170,
      neck: 0,
      waist: 0,
      hip: 0,
      bodyFat: null,
      gender: 'male',
      activityLevel: 'sedentary',
      goalType: 'maintain',
      calorieGoal: 2000,
      proteinGoal: 150,
      carbsGoal: 200,
      fatGoal: 65,
      waterGoal: 2000,
      stepGoal: 10000,
      dailySteps: 0,
      connectedApps: [],
      isPremium: false,
      currentStreak: 0,
      lastLogDate: '',
      weightHistory: []
   };

   const [profile, setProfile] = useState<UserProfile>(initialProfile || defaultProfile);

   const nextStep = () => setStep(s => s + 1);
   const prevStep = () => setStep(s => s - 1);

   const handleFinish = () => {
      const age = calculateAge(profile.dob);
      const bodyFat = calculateBodyFat(profile);
      const updatedProfile = { ...profile, age, bodyFat };

      const targets = calculateTargets(updatedProfile);

      onComplete({
         ...updatedProfile,
         ...targets,
         setupCompleted: true
      });
   };

   const updateProfile = (key: keyof UserProfile, value: any) => {
      setProfile(prev => ({ ...prev, [key]: value }));
   };

   // Live Calculations for Review Step
   const liveAge = calculateAge(profile.dob);
   const liveBodyFat = calculateBodyFat({ ...profile, age: liveAge });
   const liveProfile = { ...profile, age: liveAge, bodyFat: liveBodyFat };
   const bmr = calculateBMR(liveProfile);
   const tdee = calculateTDEE(liveProfile);
   const { calorieGoal } = calculateTargets(liveProfile);

   return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-900 font-sans">

         {/* Step Indicator */}
         <div className="w-full max-w-md mb-8">
            <div className="flex justify-between text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
               <span>Step {step} of 6</span>
               <span>{Math.round((step / 6) * 100)}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
               <div className="h-full bg-indigo-600 transition-all duration-500 ease-out" style={{ width: `${(step / 6) * 100}%` }} />
            </div>
         </div>

         <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 animate-fade-in relative">

            {/* Navigation Header */}
            {step > 1 && (
               <button onClick={prevStep} className="absolute top-8 left-8 text-slate-400 hover:text-slate-800 transition-colors">
                  <ChevronLeft size={24} />
               </button>
            )}

            {/* Step 1: Language */}
            {step === 1 && (
               <div className="space-y-6 pt-4">
                  <div className="text-center">
                     <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Globe className="text-indigo-600" size={32} />
                     </div>
                     <h1 className="text-2xl font-bold mb-2">{t('onboarding.welcome_title', profile.language)}</h1>
                     <p className="text-slate-500 text-sm leading-relaxed">{t('onboarding.welcome_desc', profile.language)}</p>
                  </div>

                  <div className="space-y-3">
                     {(['en', 'ru', 'uz'] as Language[]).map(lang => (
                        <button
                           key={lang}
                           onClick={() => updateProfile('language', lang)}
                           className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${profile.language === lang ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}
                        >
                           <span className="font-bold text-lg">
                              {lang === 'en' ? 'English' : lang === 'ru' ? 'Русский' : 'O\'zbekcha'}
                           </span>
                           {profile.language === lang && <Check size={20} />}
                        </button>
                     ))}
                  </div>

                  <button onClick={nextStep} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold mt-4 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 active:scale-95 transition-all">
                     {t('common.next', profile.language)} <ArrowRight size={20} />
                  </button>
               </div>
            )}

            {/* Step 2: Basic Bio */}
            {step === 2 && (
               <div className="space-y-6 pt-4">
                  <div className="text-center mb-8">
                     <h2 className="text-2xl font-bold">{t('onboarding.personal_details', profile.language)}</h2>
                  </div>

                  <div className="space-y-4">
                     <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 ml-1">{t('onboarding.name', profile.language)}</label>
                        <input type="text" value={profile.name} onChange={e => updateProfile('name', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-indigo-500 font-medium" />
                     </div>
                     <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 ml-1">{t('onboarding.dob', profile.language)}</label>
                        <input type="date" value={profile.dob} onChange={e => updateProfile('dob', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-indigo-500 font-medium" />
                     </div>
                     <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 ml-1">{t('onboarding.gender', profile.language)}</label>
                        <div className="grid grid-cols-2 gap-3">
                           <button
                              onClick={() => updateProfile('gender', 'male')}
                              className={`p-3.5 rounded-xl border font-bold text-sm transition-all ${profile.gender === 'male' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500'}`}
                           >
                              {t('onboarding.male', profile.language)}
                           </button>
                           <button
                              onClick={() => updateProfile('gender', 'female')}
                              className={`p-3.5 rounded-xl border font-bold text-sm transition-all ${profile.gender === 'female' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-slate-200 text-slate-500'}`}
                           >
                              {t('onboarding.female', profile.language)}
                           </button>
                        </div>
                     </div>
                  </div>
                  <button onClick={nextStep} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold mt-4 shadow-lg active:scale-95 transition-all">{t('common.next', profile.language)}</button>
               </div>
            )}

            {/* Step 3: Measurements */}
            {step === 3 && (
               <div className="space-y-6 pt-4">
                  <div className="text-center mb-6">
                     <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Ruler className="text-emerald-600" size={24} />
                     </div>
                     <h2 className="text-2xl font-bold">{t('onboarding.measurements', profile.language)}</h2>
                     <p className="text-xs text-slate-400 mt-2 px-4">{t('onboarding.details_desc', profile.language)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">{t('onboarding.weight', profile.language)}</label>
                        <input type="number" placeholder="kg" value={profile.weight || ''} onChange={e => updateProfile('weight', Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 text-center font-bold" />
                     </div>
                     <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">{t('onboarding.height', profile.language)}</label>
                        <input type="number" placeholder="cm" value={profile.height || ''} onChange={e => updateProfile('height', Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 text-center font-bold" />
                     </div>
                     <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">{t('onboarding.neck', profile.language)}</label>
                        <input type="number" placeholder="cm" value={profile.neck || ''} onChange={e => updateProfile('neck', Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 text-center font-bold" />
                     </div>
                     <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">{t('onboarding.waist', profile.language)}</label>
                        <input type="number" placeholder="cm" value={profile.waist || ''} onChange={e => updateProfile('waist', Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 text-center font-bold" />
                     </div>
                     {profile.gender === 'female' && (
                        <div className="col-span-2">
                           <label className="block text-xs font-bold uppercase text-slate-400 mb-1">{t('onboarding.hip', profile.language)}</label>
                           <input type="number" placeholder="cm" value={profile.hip || ''} onChange={e => updateProfile('hip', Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 text-center font-bold" />
                        </div>
                     )}
                  </div>
                  <button onClick={nextStep} disabled={!profile.weight || !profile.height} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold mt-4 shadow-lg disabled:opacity-50 active:scale-95 transition-all">{t('common.next', profile.language)}</button>
               </div>
            )}

            {/* Step 4: Activity */}
            {step === 4 && (
               <div className="space-y-6 pt-4">
                  <div className="text-center mb-6">
                     <h2 className="text-2xl font-bold">{t('onboarding.activity', profile.language)}</h2>
                  </div>

                  <div className="space-y-2">
                     {['sedentary', 'light', 'moderate', 'active', 'athlete'].map(lvl => (
                        <button
                           key={lvl}
                           onClick={() => updateProfile('activityLevel', lvl)}
                           className={`w-full p-4 rounded-xl text-left border transition-all flex items-center justify-between group ${profile.activityLevel === lvl ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-100 hover:bg-slate-50'}`}
                        >
                           <div>
                              <p className={`text-sm font-bold ${profile.activityLevel === lvl ? 'text-indigo-900' : 'text-slate-700'}`}>{t(`onboarding.${lvl}`, profile.language).split('(')[0]}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{t(`onboarding.${lvl}`, profile.language).split('(')[1]?.replace(')', '')}</p>
                           </div>
                           {profile.activityLevel === lvl && <Check size={18} className="text-indigo-600" />}
                        </button>
                     ))}
                  </div>
                  <button onClick={nextStep} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold mt-4 shadow-lg active:scale-95 transition-all">{t('common.next', profile.language)}</button>
               </div>
            )}

            {/* Step 5: Goal */}
            {step === 5 && (
               <div className="space-y-6 pt-4">
                  <div className="text-center mb-6">
                     <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Target className="text-orange-600" size={24} />
                     </div>
                     <h2 className="text-2xl font-bold">{t('onboarding.goal_title', profile.language)}</h2>
                  </div>

                  <div className="grid gap-3">
                     {['lose', 'maintain', 'gain'].map(g => (
                        <button
                           key={g}
                           onClick={() => updateProfile('goalType', g)}
                           className={`p-6 rounded-2xl text-center border-2 transition-all hover:scale-[1.02] ${profile.goalType === g ? 'border-orange-500 bg-orange-50 text-orange-900 shadow-md' : 'border-slate-100 text-slate-600'}`}
                        >
                           <span className="font-bold text-lg">{t(`onboarding.goal_${g}`, profile.language)}</span>
                        </button>
                     ))}
                  </div>
                  <button onClick={nextStep} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold mt-4 shadow-lg active:scale-95 transition-all">{t('common.next', profile.language)}</button>
               </div>
            )}

            {/* Step 6: Scientific Review */}
            {step === 6 && (
               <div className="space-y-6 pt-4">
                  <div className="text-center">
                     <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Brain className="text-blue-600" size={24} />
                     </div>
                     <h2 className="text-2xl font-bold mb-1">{t('onboarding.science_title', profile.language)}</h2>
                  </div>

                  <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl space-y-6 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 opacity-10"><Activity size={100} /></div>

                     {liveBodyFat && (
                        <div className="flex justify-between items-end border-b border-white/10 pb-4">
                           <div>
                              <p className="text-sm text-slate-300 font-medium">{t('onboarding.body_fat', profile.language)}</p>
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">US Navy Method</p>
                           </div>
                           <p className="text-3xl font-bold text-emerald-400">{liveBodyFat.toFixed(1)}%</p>
                        </div>
                     )}

                     <div className="flex justify-between items-end border-b border-white/10 pb-4">
                        <div>
                           <p className="text-sm text-slate-300 font-medium">BMR</p>
                           <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{liveBodyFat ? 'Katch-McArdle' : 'Mifflin-St Jeor'}</p>
                        </div>
                        <p className="text-2xl font-bold">{bmr}</p>
                     </div>

                     <div className="pt-2">
                        <p className="text-sm text-center text-indigo-200 mb-2 font-bold uppercase tracking-widest">{t('onboarding.plan_expl', profile.language)}</p>
                        <div className="bg-white/10 rounded-2xl p-4 text-center backdrop-blur-sm border border-white/10">
                           <p className="text-5xl font-extrabold tracking-tight">{calorieGoal} <span className="text-lg font-normal text-slate-400">kcal</span></p>
                        </div>
                     </div>
                  </div>

                  <button onClick={handleFinish} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-xl shadow-indigo-200 active:scale-95 transition-all">{t('common.finish', profile.language)}</button>
               </div>
            )}

         </div>
      </div>
   );
};

export default Onboarding;
