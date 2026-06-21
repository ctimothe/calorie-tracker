
import { useState, useEffect } from 'react';
import { MealLog, AnalysisResult } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../services/supabase';
import { fetchUserData, saveLogsLocal, getLogsLocal, syncLogToSupabase, deleteLogLocal, deleteLogFromSupabase, uploadImageToSupabase } from '../services/storageService';
import { useAuth } from './useAuth';
import { getMealEmoji } from '../services/foodEmojiService';

export function useFoodLog() {
    const { user } = useAuth();
    const [logs, setLogs] = useState<MealLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLogs([]);
            setLoading(false);
            return;
        }

        const loadLogs = async () => {
            // We can optimize this by expecting useUserProfile to have fetched data, 
            // but decent separation means we might fetch or read local
            const local = getLogsLocal();
            if (local && local.length > 0) {
                setLogs(local);
            }

            // In a perfect world, we sync. For now, rely on fetchUserData from useUserProfile 
            // or re-fetch here. Let's just re-fetch to be safe or read from local if useUserProfile handled it.
            // Actually, let's fetch here to self-contain.
            const { logs: remoteLogs } = await fetchUserData(user.id);
            if (remoteLogs) {
                setLogs(remoteLogs);
                saveLogsLocal(remoteLogs);
            }
            setLoading(false);
        };
        loadLogs();
    }, [user]);

    const addLog = async (
        mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack',
        analysis: AnalysisResult,
        scannedImage?: { base64: string; mimeType: string } | null
    ) => {
        if (!user) return;

        const logId = uuidv4();

        // Emoji
        const itemNames = analysis.items.map(i => i.name);
        const mealEmoji = getMealEmoji(itemNames, mealType);

        // Upload Image if present
        let imageData = { url: '', thumb: '' };
        if (scannedImage) {
            try {
                const uploaded = await uploadImageToSupabase(
                    user.id,
                    logId,
                    scannedImage.base64,
                    scannedImage.mimeType
                );
                imageData = { url: uploaded.url || '', thumb: uploaded.thumb || '' };
            } catch (e) {
                console.warn('Failed to upload image:', e);
            }
        }

        const newLog: MealLog = {
            id: logId,
            date: new Date().toISOString(),
            timestamp: Date.now(),
            mealType,
            summary: analysis.summary,
            items: analysis.items,
            image_url: imageData.url,
            image_thumb: imageData.thumb,
            image_source: imageData.url ? 'user' : undefined,
            icon_emoji: mealEmoji
        };

        const updatedLogs = [newLog, ...logs];
        setLogs(updatedLogs);
        saveLogsLocal(updatedLogs);

        await syncLogToSupabase(newLog, user.id);
    };

    const deleteLog = async (id: string) => {
        if (!user) return;
        const updatedLogs = logs.filter(l => l.id !== id);
        setLogs(updatedLogs);
        saveLogsLocal(updatedLogs);
        await deleteLogFromSupabase(id, user.id);
    };

    return { logs, loading, addLog, deleteLog, setLogs };
}
