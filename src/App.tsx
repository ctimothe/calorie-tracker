
import React, { useState } from 'react';
import { AppState, AnalysisResult, AppView, ScanMode } from './types';
import { analyzeFoodImage, parseFoodText } from './services/geminiService';
import { saveWaterIntake, syncWaterToSupabase, getWaterIntake } from './services/storageService';
import { useAuth } from './hooks/useAuth';
import { useUserProfile } from './hooks/useUserProfile';
import { useFoodLog } from './hooks/useFoodLog';
import UploadArea from './components/UploadArea';
import NutritionCard from './components/NutritionCard';
import Dashboard from './components/Dashboard';
import BottomNav from './components/BottomNav';
import HistoryLog from './components/HistoryLog';
import UserProfileView from './components/UserProfileView';
import RecommendationsView from './components/RecommendationsView';
import AIChef from './components/AIChef';
import Onboarding from './components/Onboarding';
import Auth from './components/Auth';
import { MainLayout } from './components/layout/MainLayout';
import { AlertCircle, Utensils, Loader2, User } from 'lucide-react';
import { t } from './translations';

const App: React.FC = () => {
  // Hooks
  const { user, loading: loadingAuth } = useAuth();
  const { profile, loading: loadingProfile, updateProfile, setProfile } = useUserProfile();
  const { logs, addLog, deleteLog } = useFoodLog();

  // Navigation State
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);

  // Scanner State
  const [scanState, setScanState] = useState<AppState>(AppState.IDLE);
  const [scanResult, setScanResult] = useState<AnalysisResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Store scanned image for upload (user's actual photo)
  const [scannedImage, setScannedImage] = useState<{ base64: string; mimeType: string } | null>(null);

  // Handlers
  const handleOnboardingComplete = async (newProfile: any) => {
    await updateProfile(newProfile);
  };

  const handleImageSelected = async (base64: string, mimeType: string, mode: ScanMode) => {
    setScanState(AppState.ANALYZING);
    setScanError(null);
    setScannedImage({ base64: `data:${mimeType};base64,${base64}`, mimeType });

    try {
      const lang = profile?.language || 'uz';
      const data = await analyzeFoodImage(base64, mimeType, mode, lang);
      setScanResult(data);
      setScanState(AppState.SUCCESS);
    } catch (err: any) {
      console.error("Analysis failed:", err);
      let errorMessage = "Failed to analyze image.";
      const errString = (err.message || err.toString()).toLowerCase();
      if (errString.includes("429")) errorMessage = "API Limit Reached.";
      else if (errString.includes("api key")) errorMessage = "API Key Error.";

      setScanError(errorMessage);
      setScanState(AppState.ERROR);
    }
  };

  const handleTextAnalyze = async (text: string) => {
    setScanState(AppState.ANALYZING);
    setScanError(null);
    setScannedImage(null);
    try {
      const lang = profile?.language || 'uz';
      const data = await parseFoodText(text, lang);
      setScanResult(data);
      setScanState(AppState.SUCCESS);
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setScanError("Failed to analyze text. Try again.");
      setScanState(AppState.ERROR);
    }
  };

  const handleSaveMeal = async (mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack', adjustedResult: AnalysisResult) => {
    const resultToSave = adjustedResult || scanResult;
    if (!resultToSave) return;

    await addLog(mealType, resultToSave, scannedImage);

    // Clear scanned image after save
    setScannedImage(null);
    setScanState(AppState.IDLE);
    setScanResult(null);
    setCurrentView(AppView.DASHBOARD);

    // Update Streak logic could be moved to useUserProfile/useEffect but kept simple here or moved later
    // For now we assume the profile update is handled if we want to handle streak. 
    // Ideally useFoodLog or a higher level hook handles this side effect. 
    // Let's implement streak update here for now to maintain parity.
    if (profile && user) {
      const today = new Date().toDateString();
      const lastLog = profile.lastLogDate ? new Date(profile.lastLogDate).toDateString() : '';

      if (today !== lastLog) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        let newStreak = profile.currentStreak;
        if (lastLog === yesterday.toDateString()) newStreak += 1;
        else newStreak = 1; // Reset if broke streak, or 1 if first time today

        const updatedProfile = { ...profile, currentStreak: newStreak, lastLogDate: new Date().toISOString() };
        updateProfile(updatedProfile);
      }
    }
  };

  const handleQuickLog = async (entry: { name: string; calories: number; protein?: number; carbs?: number; fat?: number }) => {
    // Manually construct AnalysisResult for quick log
    const quickResult: AnalysisResult = {
      scanType: 'text',
      summary: {
        totalCalories: entry.calories,
        totalProtein: entry.protein || 0,
        totalCarbs: entry.carbs || 0,
        totalFat: entry.fat || 0,
        healthScore: 50,
        advice: ''
      },
      items: [{
        name: entry.name,
        portionSize: '1',
        calories: entry.calories,
        protein: entry.protein || 0,
        carbs: entry.carbs || 0,
        fat: entry.fat || 0,
        confidence: 'auto'
      }]
    };
    await addLog('Snack', quickResult, null);
  };

  const handleWaterChange = async (amount: number) => {
    if (!user) return;
    const currentDate = new Date().toDateString();
    const stored = localStorage.getItem('vitalize_water');
    const parsed = stored ? JSON.parse(stored) : null;
    const base = parsed && parsed.date === currentDate ? parsed.amount : 0;
    const newAmount = Math.max(0, base + amount);
    saveWaterIntake(newAmount);
    await syncWaterToSupabase(user.id, newAmount);
  };

  // Rendering
  if (loadingAuth) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth onLoginSuccess={() => { }} />;
  }

  if (loadingProfile && !profile) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 flex-col gap-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-slate-400 font-medium">Syncing FitYo'l...</p>
      </div>
    );
  }

  if (!profile || !profile.setupCompleted) {
    // If hooks didn't find profile, we might need to initialize or show onboarding
    // For now assuming Onboarding handles "no profile" case
    return <Onboarding initialProfile={profile || undefined} onComplete={handleOnboardingComplete} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard profile={profile} logs={logs} onNavigate={setCurrentView} />;
      case AppView.HISTORY:
        return <HistoryLog logs={logs} profile={profile} />;
      case AppView.CHEF:
        return <AIChef profile={profile} logs={logs} />;
      case AppView.PROFILE:
        return <UserProfileView profile={profile} onUpdate={updateProfile} />;
      case AppView.RECOMMENDATIONS:
        return <RecommendationsView profile={profile} logs={logs} onQuickLog={handleQuickLog} onWaterChange={handleWaterChange} onDeleteLog={deleteLog} />;
      case AppView.SCAN:
        return (
          <div className="flex flex-col items-center w-full min-h-full">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 self-start">
              {t('scan.title', profile.language)}
            </h2>

            {scanState === AppState.ERROR && (
              <div className="w-full bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-rose-900">Error</h3>
                  <p className="text-sm text-rose-700">{scanError}</p>
                  <button onClick={() => setScanState(AppState.IDLE)} className="text-xs font-bold text-rose-700 mt-2">Try Again</button>
                </div>
              </div>
            )}

            {scanState !== AppState.SUCCESS ? (
              <UploadArea
                onImageSelected={handleImageSelected}
                onTextAnalyze={handleTextAnalyze}
                isAnalyzing={scanState === AppState.ANALYZING}
                language={profile.language}
              />
            ) : (
              scanResult && (
                <NutritionCard
                  result={scanResult}
                  onSave={handleSaveMeal}
                  onCancel={() => {
                    setScanState(AppState.IDLE);
                    setScanResult(null);
                    setScannedImage(null);
                  }}
                  language={profile.language}
                />
              )
            )}
          </div>
        );
    }
  };

  return (
    <MainLayout>
      <div className="bg-surface-50/80 backdrop-blur-md border-b border-surface-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="bg-brand-600 p-1.5 rounded-lg shadow-sm">
            <Utensils className="text-white w-4 h-4" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-content">FitYo'l</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase font-bold text-content-subtle bg-surface-100 px-2 py-1 rounded border border-surface-200">
            {profile.language.toUpperCase()}
          </span>
          <button
            onClick={() => setCurrentView(AppView.PROFILE)}
            className="h-9 w-9 rounded-full bg-content-subtle/10 flex items-center justify-center text-content font-bold shadow-sm hover:bg-content-subtle/20 transition-colors active:scale-95"
            aria-label={t('nav.profile', profile.language)}
          >
            {profile.name ? profile.name.charAt(0).toUpperCase() : <User size={16} />}
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 scroll-smooth pb-28" style={{ paddingBottom: 'max(7rem, calc(7rem + env(safe-area-inset-bottom)))' }}>
        {renderContent()}
      </main>

      <BottomNav currentView={currentView} onNavigate={setCurrentView} language={profile.language} />
    </MainLayout>
  );
};

export default App;
