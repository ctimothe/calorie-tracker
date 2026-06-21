
import React, { useState, useEffect } from 'react';
import { UserProfile, Language } from '../types';
import { calculateBMR, calculateTargets, addWeightLog, calculateBodyFat } from '../services/storageService';
import {
  getHealthPlatforms,
  getHealthConnections,
  updateHealthConnection,
  removeHealthConnection,
  HealthPlatform,
  PlatformInfo
} from '../services/healthService';
import { supabase } from '../services/supabase';
import { t } from '../translations';
import { Crown, Save, Calculator, Globe, Plus, TrendingUp, Key, ChevronDown, ChevronUp, Lock, Mail, LogOut, Shield, Watch, Link as LinkIcon, Unlink, Loader2, CheckCircle2, AlertTriangle, User } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip, YAxis } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

interface UserProfileViewProps {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({ profile, onUpdate }) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [isDirty, setIsDirty] = useState(false);
  const [newWeight, setNewWeight] = useState<string>('');
  const [showWeightInput, setShowWeightInput] = useState(false);

  // Custom Key State
  const [showDevSettings, setShowDevSettings] = useState(false);
  const [customKey, setCustomKey] = useState('');

  // Security State
  const [showSecurity, setShowSecurity] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Health Connections State
  const [healthPlatforms, setHealthPlatforms] = useState<PlatformInfo[]>([]);
  const [connectingPlatform, setConnectingPlatform] = useState<HealthPlatform | null>(null);
  const [connectedPlatforms, setConnectedPlatforms] = useState<HealthPlatform[]>([]);

  useEffect(() => {
    const savedKey = localStorage.getItem('vitalize_custom_api_key');
    if (savedKey) setCustomKey(savedKey);

    // Load health platforms and connections
    setHealthPlatforms(getHealthPlatforms());
    const connections = getHealthConnections();
    setConnectedPlatforms(connections.filter(c => c.connected).map(c => c.platform));
  }, []);

  // Handle connecting to a health platform
  const handleConnectPlatform = async (platform: HealthPlatform) => {
    setConnectingPlatform(platform);

    try {
      // Native platforms - show coming soon message
      alert(t('health.coming_soon', formData.language));
    } catch (error) {
      console.error('Failed to connect:', error);
      alert(t('health.connection_failed', formData.language));
    } finally {
      setConnectingPlatform(null);
    }
  };

  // Handle disconnecting from a platform
  const handleDisconnectPlatform = (platform: HealthPlatform) => {
    removeHealthConnection(platform);
    setConnectedPlatforms(prev => prev.filter(p => p !== platform));
  };

  const handleChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    // Recalculate body fat on save if measurements changed
    const bf = calculateBodyFat(formData);
    const updated = { ...formData, bodyFat: bf };

    onUpdate(updated);
    setFormData(updated);
    setIsDirty(false);
    alert(t('profile.update_success', formData.language));
  };

  const saveCustomKey = () => {
    if (customKey.trim().length > 0) {
      localStorage.setItem('vitalize_custom_api_key', customKey.trim());
      alert("Pro Key Saved!");
    } else {
      localStorage.removeItem('vitalize_custom_api_key');
      alert("Pro Key Removed.");
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail) return;
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) alert(error.message);
    else alert("Check your new email for a confirmation link.");
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) return;
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) alert(error.message);
    else alert("Password updated successfully.");
  };

  const autoCalculate = () => {
    const targets = calculateTargets(formData);
    setFormData(prev => ({ ...prev, ...targets }));
    setIsDirty(true);
  };

  const handleLogWeight = () => {
    const w = parseFloat(newWeight);
    if (!isNaN(w) && w > 0) {
      addWeightLog(w);
      const updatedProfile = {
        ...formData,
        weight: w,
        weightHistory: [...(formData.weightHistory || []), { date: new Date().toISOString(), weight: w }].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      };
      setFormData(updatedProfile);
      onUpdate(updatedProfile);
      setNewWeight('');
      setShowWeightInput(false);
    }
  };

  const weightData = (formData.weightHistory || []).map(h => ({
    date: new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    weight: h.weight
  })).slice(-10);

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

      {/* Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-center pt-2">
        <div>
          <h2 className="text-3xl font-display font-bold text-content">{t('nav.profile', formData.language)}</h2>
          <p className="text-xs text-content-subtle font-medium mt-1">{formData.email}</p>
        </div>
        {profile.isPremium && (
          <motion.span
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-r from-amber-400 to-yellow-600 text-white text-[10px] px-3 py-1.5 rounded-full font-black flex items-center gap-1 shadow-lg shadow-amber-500/30"
          >
            <Crown size={12} className="fill-current" /> PRO
          </motion.span>
        )}
      </motion.div>

      {/* Language Switcher */}
      <motion.div variants={itemVariants} className="glass-panel p-4 flex items-center justify-between rounded-2xl ring-1 ring-white/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-surface-100 rounded-xl text-content-subtle">
            <Globe size={18} />
          </div>
          <span className="font-bold text-content text-sm">{t('onboarding.select_lang', formData.language)}</span>
        </div>
        <div className="flex bg-surface-100 p-1.5 rounded-xl">
          {(['en', 'ru', 'uz'] as Language[]).map(lang => (
            <button
              key={lang}
              onClick={() => { handleChange('language', lang); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${formData.language === lang ? 'bg-white text-content shadow-sm' : 'text-content-subtle hover:text-content'}`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Connected Apps & Health Platforms */}
      <motion.div variants={itemVariants} className="glass-panel p-6 rounded-[2rem] ring-1 ring-white/60">
        <h3 className="font-bold text-content text-sm uppercase tracking-wide flex items-center gap-2.5 mb-5">
          <Watch size={18} className="text-brand-600" /> {t('profile.connected_apps', formData.language)}
        </h3>

        <div className="space-y-3">
          {healthPlatforms.map((platform) => {
            const isConnectedPlatform = connectedPlatforms.includes(platform.id);
            const isConnecting = connectingPlatform === platform.id;

            return (
              <div key={platform.id} className="flex items-center justify-between p-3.5 bg-white/50 rounded-2xl border border-white/50 shadow-sm hover:shadow transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden bg-white shadow-sm ring-1 ring-surface-100">
                    <img src={platform.iconUrl} alt={platform.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">{platform.name}</span>
                    {isConnectedPlatform ? (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 uppercase tracking-wide">
                        <CheckCircle2 size={10} /> {t('health.connected', formData.language)}
                      </span>
                    ) : platform.requiresNative ? (
                      <span className="text-[10px] text-content-subtle font-medium">{t('health.native_required', formData.language)}</span>
                    ) : !platform.available ? (
                      <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                        <AlertTriangle size={10} /> {t('health.not_supported', formData.language)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-content-subtle font-medium">{t('health.tap_to_connect', formData.language)}</span>
                    )}
                  </div>
                </div>

                {isConnectedPlatform ? (
                  <button
                    onClick={() => handleDisconnectPlatform(platform.id)}
                    className="text-xs font-bold text-red-600 bg-red-50/50 px-3 py-1.5 rounded-xl flex items-center gap-1 hover:bg-red-100 transition-colors"
                  >
                    <Unlink size={14} />
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnectPlatform(platform.id)}
                    disabled={isConnecting || (!platform.available && !platform.requiresNative)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors ${isConnecting
                      ? 'bg-surface-100 text-content-subtle'
                      : platform.available || platform.requiresNative
                        ? 'text-brand-600 bg-brand-50 hover:bg-brand-100'
                        : 'text-content-subtle bg-surface-100 cursor-not-allowed'
                      }`}
                  >
                    {isConnecting ? <Loader2 size={14} className="animate-spin" /> : <LinkIcon size={14} />}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-content-subtle mt-4 text-center max-w-xs mx-auto">
          {t('health.web_note', formData.language)}
        </p>
      </motion.div>

      {/* Goal Calculator */}
      <motion.div variants={itemVariants} className="bg-surface-900 rounded-[2rem] p-6 text-white relative overflow-hidden shadow-2xl shadow-surface-900/30 ring-1 ring-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4 relative z-10">
          <h3 className="font-bold text-sm uppercase tracking-wider">{t('profile.nutrition_goals', formData.language)}</h3>
          <button
            onClick={autoCalculate}
            className="text-[10px] flex items-center gap-1.5 text-brand-300 font-bold bg-white/5 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors border border-white/5"
          >
            <Calculator size={12} /> {t('profile.recalculate', formData.language)}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div className="col-span-2 text-center mb-2">
            <label className="text-xs text-surface-400 mb-2 block font-bold uppercase tracking-widest">{t('profile.daily_cals', formData.language)}</label>
            <input
              type="number"
              value={formData.calorieGoal}
              onChange={(e) => handleChange('calorieGoal', Number(e.target.value))}
              className="w-full bg-transparent font-display font-black text-6xl text-center outline-none tracking-tighter mb-2"
            />
            <p className="text-[10px] text-center text-surface-400 font-medium">
              BMR: {calculateBMR(formData)} • Body Fat: {formData.bodyFat ? formData.bodyFat.toFixed(1) + '%' : 'N/A'}
            </p>
          </div>

          <div className="bg-white/5 p-3.5 rounded-2xl backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-colors">
            <label className="text-[10px] text-blue-300 mb-1.5 block font-bold uppercase tracking-wider">{t('dashboard.protein', formData.language)} (g)</label>
            <input type="number" value={formData.proteinGoal} onChange={(e) => handleChange('proteinGoal', Number(e.target.value))} className="w-full bg-transparent text-2xl font-display font-bold outline-none text-center" />
          </div>

          <div className="bg-white/5 p-3.5 rounded-2xl backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-colors">
            <label className="text-[10px] text-emerald-300 mb-1.5 block font-bold uppercase tracking-wider">{t('dashboard.carbs', formData.language)} (g)</label>
            <input type="number" value={formData.carbsGoal} onChange={(e) => handleChange('carbsGoal', Number(e.target.value))} className="w-full bg-transparent text-2xl font-display font-bold outline-none text-center" />
          </div>
        </div>
      </motion.div>

      {/* Bio Metrics Form */}
      <motion.div variants={itemVariants} className="glass-panel p-6 space-y-5 rounded-[2rem] ring-1 ring-white/60">
        <h3 className="font-bold text-content border-b border-surface-100 pb-3 text-sm uppercase tracking-wide flex items-center gap-2">
          <User size={18} className="text-content-subtle" />
          {t('profile.bio_metrics', formData.language)}
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {/* Fields... using a helper or mapping would be cleaner but inline is fine for now */}
          {[
            { label: t('onboarding.name', formData.language), field: 'name', type: 'text' },
            { label: t('onboarding.dob', formData.language), field: 'dob', type: 'date' },
            { label: t('onboarding.height', formData.language), field: 'height', type: 'number' },
            { label: t('onboarding.neck', formData.language), field: 'neck', type: 'number' },
            { label: t('onboarding.waist', formData.language), field: 'waist', type: 'number' },
          ].map((item) => (
            <div key={item.field} className={item.field === 'name' ? 'col-span-2' : ''}>
              <label className="text-[10px] text-content-subtle mb-1.5 block font-bold uppercase tracking-wider ml-1">{item.label}</label>
              <input
                type={item.type}
                value={formData[item.field as keyof UserProfile] as any}
                onChange={e => handleChange(item.field as any, item.type === 'number' ? Number(e.target.value) : e.target.value)}
                className="w-full bg-white/50 border border-surface-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 font-bold text-content focus:bg-white transition-all shadow-sm"
              />
            </div>
          ))}

          <div>
            <label className="text-[10px] text-content-subtle mb-1.5 block font-bold uppercase tracking-wider ml-1">{t('onboarding.gender', formData.language)}</label>
            <div className="relative">
              <select value={formData.gender} onChange={e => handleChange('gender', e.target.value)} className="w-full bg-white/50 border border-surface-200 rounded-xl p-3 text-sm outline-none appearance-none font-bold text-content shadow-sm focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500">
                <option value="male">{t('onboarding.male', formData.language)}</option>
                <option value="female">{t('onboarding.female', formData.language)}</option>
              </select>
              <ChevronDown className="absolute right-3 top-3.5 text-content-subtle pointer-events-none" size={14} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Account Security */}
      <motion.div variants={itemVariants} className="glass-panel rounded-2xl overflow-hidden ring-1 ring-white/60">
        <button
          onClick={() => setShowSecurity(!showSecurity)}
          className="w-full p-4 flex items-center justify-between text-content hover:bg-surface-50 transition-colors"
        >
          <span className="flex items-center gap-3 text-sm font-bold">
            <div className="p-2 bg-emerald-100/50 rounded-lg text-emerald-600"><Shield size={16} /></div>
            {t('profile.account_security', formData.language)}
          </span>
          {showSecurity ? <ChevronUp size={16} className="text-content-subtle" /> : <ChevronDown size={16} className="text-content-subtle" />}
        </button>

        <AnimatePresence>
          {showSecurity && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-surface-100"
            >
              <div className="p-4 space-y-4 bg-surface-50/30">
                <div>
                  <label className="text-xs font-bold text-content-subtle mb-1.5 block uppercase tracking-wider">{t('profile.change_email', formData.language)}</label>
                  <div className="flex gap-2">
                    <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="New Email" className="flex-1 bg-white border border-surface-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    <button onClick={handleUpdateEmail} className="bg-surface-900 text-white px-4 rounded-xl text-xs font-bold shadow-lg shadow-surface-900/10">Update</button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-content-subtle mb-1.5 block uppercase tracking-wider">{t('profile.change_password', formData.language)}</label>
                  <div className="flex gap-2">
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password" className="flex-1 bg-white border border-surface-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    <button onClick={handleUpdatePassword} className="bg-surface-900 text-white px-4 rounded-xl text-xs font-bold shadow-lg shadow-surface-900/10">Update</button>
                  </div>
                </div>
                <button onClick={() => supabase.auth.signOut()} className="w-full py-3 mt-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-red-100">
                  <LogOut size={16} /> {t('common.sign_out', formData.language)}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Developer Settings */}
      <motion.div variants={itemVariants} className="bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
        <button onClick={() => setShowDevSettings(!showDevSettings)} className="w-full p-4 flex items-center justify-between text-slate-500 hover:text-slate-800 transition-colors">
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <Key size={14} /> {t('profile.dev_settings', formData.language)}
          </span>
          {showDevSettings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        <AnimatePresence>
          {showDevSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-slate-200"
            >
              <div className="p-4">
                <div className="flex gap-2">
                  <input type="password" value={customKey} onChange={(e) => setCustomKey(e.target.value)} placeholder="Paste Google Gemini API Key" className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500/20" />
                  <button onClick={saveCustomKey} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-slate-900/10">{t('common.save', formData.language)}</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {isDirty && (
          <motion.button
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            onClick={handleSave}
            style={{ bottom: 'calc(var(--bottom-nav-height) + 1rem)' }}
            className="w-full fixed left-0 right-0 max-w-md mx-auto px-4 bg-brand-600 hover:bg-brand-700 text-white py-4 rounded-2xl font-bold shadow-xl shadow-brand-500/30 flex items-center justify-center gap-2 z-50 transition-colors mx-4 mb-4"
          >
            <Save size={20} /> {t('common.save', formData.language)}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default UserProfileView;
