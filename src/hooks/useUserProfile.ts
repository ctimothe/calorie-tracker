
import { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { getProfile, saveProfileLocal, fetchUserData, syncProfileToSupabase, saveLogsLocal, getWaterIntake, saveWaterIntake, syncWaterToSupabase, fetchWaterFromSupabase } from '../services/storageService';
import { useAuth } from './useAuth';

export function useUserProfile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Load implementation from App.tsx logic
    const loadUserData = async (userId: string) => {
        setLoading(true);
        const { profile: remoteProfile, logs: remoteLogs } = await fetchUserData(userId);

        if (remoteProfile) {
            setProfile(remoteProfile);
            saveProfileLocal(remoteProfile);
        } else {
            // Fallback to local if no remote? Or null.
        }

        if (remoteLogs) {
            // In App.tsx logs were handled here too, but we split that to useFoodLog.
            // Ideally useFoodLog should handle fetching logs.
            // For now we focused on profile here.
            saveLogsLocal(remoteLogs); // Sync logs to local even if this hook doesn't expose them
        }

        // Fetch hydration
        const serverWater = await fetchWaterFromSupabase(userId);
        const localWater = getWaterIntake();
        if (serverWater !== null && serverWater > 0) {
            saveWaterIntake(serverWater);
        } else if (localWater > 0) {
            await syncWaterToSupabase(userId, localWater);
        }

        setLoading(false);
    };

    const updateProfile = async (newProfile: UserProfile) => {
        if (!user) return;
        setProfile(newProfile);
        saveProfileLocal(newProfile);
        await syncProfileToSupabase(newProfile, user.id);
    };

    useEffect(() => {
        if (user) {
            loadUserData(user.id);
        } else {
            setProfile(null);
            setLoading(false);
        }
    }, [user]);

    return { profile, loading, updateProfile, setProfile };
}
