
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Utensils, Mail, Lock, Loader2, ArrowRight, Chrome, Inbox } from 'lucide-react';
import { t } from '../translations';
import { Language } from '../types';

interface AuthProps {
  onLoginSuccess: () => void;
}

// Helper to get user-friendly error messages
const getAuthErrorMessage = (error: any, lang: Language, isSignup: boolean): string => {
  const msg = error?.message?.toLowerCase() || '';
  
  // Duplicate signup detection
  if (msg.includes('user already registered') || msg.includes('already been registered')) {
    return t('auth.error_duplicate', lang);
  }
  // Invalid login credentials
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return t('auth.error_invalid', lang);
  }
  // Weak password
  if (msg.includes('password') && (msg.includes('weak') || msg.includes('short') || msg.includes('at least'))) {
    return t('auth.error_weak_password', lang);
  }
  // Invalid email
  if (msg.includes('invalid') && msg.includes('email')) {
    return t('auth.error_invalid_email', lang);
  }
  // Rate limiting
  if (msg.includes('too many') || msg.includes('rate limit')) {
    return t('auth.error_rate_limit', lang);
  }
  // Google OAuth not enabled
  if (msg.includes('provider is not enabled')) {
    return t('auth.error_google_disabled', lang);
  }
  
  // Generic fallback
  return isSignup ? t('auth.error_signup_failed', lang) : t('auth.error_login_failed', lang);
};

const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Language State for Auth Screen (Defaults to Uzbek)
  const [lang, setLang] = useState<Language>('uz');
  
  // Verification State
  const [checkEmail, setCheckEmail] = useState(false);

  // Prevent body scroll when on auth page & handle mobile keyboard
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Success is handled by the onAuthStateChange listener in App.tsx
      } else {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { language: lang }, // Save preferred language to metadata on signup
            emailRedirectTo: window.location.origin // Ensure they return to the app
          } 
        });
        
        if (error) throw error;

        // CRITICAL: If session is null, it means Email Confirm is ON and required.
        if (data.user && !data.session) {
           setCheckEmail(true);
           setLoading(false);
           return; 
        }
      }
      onLoginSuccess();
    } catch (err: any) {
      setError(getAuthErrorMessage(err, lang, view === 'signup'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
           // Supabase handles the OAuth callback, then redirects to this URL
           redirectTo: window.location.origin,
           queryParams: {
             access_type: 'offline',
             prompt: 'consent',
           }
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(getAuthErrorMessage(err, lang, false));
    } finally {
      setLoading(false);
    }
  };

  // --- CONFIRMATION SCREEN ---
  if (checkEmail) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-[#f8fafc] p-4 font-sans overflow-hidden">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-slate-100 p-6 text-center space-y-5 animate-fade-in-up">
           <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <Inbox className="w-8 h-8 text-emerald-600" />
           </div>
           
           <div>
             <h2 className="text-xl font-bold text-slate-900 mb-2">{t('auth.check_email', lang)}</h2>
             <p className="text-slate-500 text-sm leading-relaxed">
               {t('auth.sent_link', lang)} <br/>
               <span className="font-bold text-slate-800">{email}</span>
             </p>
           </div>

           <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600">
              <p>{t('auth.click_link', lang)}</p>
           </div>

           <button 
             onClick={() => setCheckEmail(false)}
             className="text-indigo-600 font-bold text-sm hover:underline"
           >
             {t('common.back', lang)}
           </button>
        </div>
      </div>
    );
  }

  // --- MAIN AUTH SCREEN ---
  return (
    <div className="h-[100dvh] w-full flex items-center justify-center bg-[#f8fafc] p-4 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-5 space-y-4 animate-fade-in-up relative z-10 max-h-[95dvh] overflow-y-auto">
        
        {/* Language Switcher */}
        <div className="flex justify-end">
            <div className="bg-slate-100 rounded-lg p-1 flex gap-1">
                {(['uz', 'ru', 'en'] as Language[]).map((l) => (
                    <button 
                        key={l} 
                        onClick={() => setLang(l)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${lang === l ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        {l.toUpperCase()}
                    </button>
                ))}
            </div>
        </div>

        <div className="text-center space-y-1">
          <div className="bg-gradient-to-tr from-indigo-600 to-indigo-500 w-14 h-14 rounded-2xl shadow-lg shadow-indigo-300 flex items-center justify-center mx-auto transform rotate-3">
             <Utensils className="text-white w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">FitYo'l</h1>
          <p className="text-slate-500 text-xs font-medium">{t('auth.subtitle', lang)}</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl relative">
           <div 
             className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ease-out ${view === 'login' ? 'left-1' : 'translate-x-full left-1'}`} 
           />
           <button onClick={() => { setView('login'); setError(null); }} className={`flex-1 relative z-10 py-2 text-sm font-bold text-center transition-colors ${view === 'login' ? 'text-slate-900' : 'text-slate-400'}`}>
             {t('auth.login', lang)}
           </button>
           <button onClick={() => { setView('signup'); setError(null); }} className={`flex-1 relative z-10 py-2 text-sm font-bold text-center transition-colors ${view === 'signup' ? 'text-slate-900' : 'text-slate-400'}`}>
             {t('auth.signup', lang)}
           </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1 tracking-wider">{t('auth.email', lang)}</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-3 text-slate-400 w-4 h-4 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-900 placeholder:text-slate-300 transition-all text-sm"
                placeholder="hello@fityol.uz"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1 tracking-wider">{t('auth.password', lang)}</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3 text-slate-400 w-4 h-4 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-900 placeholder:text-slate-300 transition-all text-sm"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-2.5 rounded-xl font-semibold text-center animate-shake">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold shadow-lg shadow-slate-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
               <>
                 {view === 'login' ? t('auth.login', lang) : t('auth.create_account', lang)} <ArrowRight size={16} />
               </>
            )}
          </button>
        </form>

        <div className="relative">
           <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
           <div className="relative flex justify-center text-[10px]"><span className="px-2 bg-white/90 text-slate-400 font-bold">{t('auth.or', lang)}</span></div>
        </div>

        <button 
           onClick={handleGoogleLogin}
           disabled={loading}
           className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-70 text-sm"
        >
           <Chrome size={18} className="text-blue-500" />
           {t('auth.google', lang)}
        </button>

      </div>
    </div>
  );
};

export default Auth;
