/**
 * Health Service - Handles device health integrations
 * 
 * Web Limitations:
 * - Apple Health, Google Fit, Samsung Health require native apps
 * - These platforms will be available in a future native mobile app
 */

// Import local icons
// Import local icons
import appleHealthIcon from '../assets/icons/apple-health.svg';
import googleFitIcon from '../assets/icons/google-fit.png';
import samsungHealthIcon from '../assets/icons/samsung-health.png';

// Native Imports
import { Capacitor } from '@capacitor/core';
import { Health } from 'capacitor-health';

export type HealthPlatform = 'apple_health' | 'google_fit' | 'samsung_health';

export interface HealthConnection {
  platform: HealthPlatform;
  connected: boolean;
  lastSync: string | null;
  available: boolean;
}

// Get saved connections from localStorage
export const getHealthConnections = (): HealthConnection[] => {
  const saved = localStorage.getItem('fityo_health_connections');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
};

// Save connections to localStorage
export const saveHealthConnections = (connections: HealthConnection[]): void => {
  localStorage.setItem('fityo_health_connections', JSON.stringify(connections));
};

// Add or update a connection
export const updateHealthConnection = (connection: HealthConnection): void => {
  const connections = getHealthConnections();
  const existingIndex = connections.findIndex(c => c.platform === connection.platform);

  if (existingIndex >= 0) {
    connections[existingIndex] = connection;
  } else {
    connections.push(connection);
  }

  saveHealthConnections(connections);
};

// Remove a connection
export const removeHealthConnection = (platform: HealthPlatform): void => {
  const connections = getHealthConnections().filter(c => c.platform !== platform);
  saveHealthConnections(connections);
};

// Check if a specific platform is connected
export const isConnected = (platform: HealthPlatform): boolean => {
  const connections = getHealthConnections();
  const conn = connections.find(c => c.platform === platform);
  return conn?.connected ?? false;
};

// ============================================
// NATIVE INTEGRATION
// ============================================

export const connectNativeHealth = async (platform: HealthPlatform): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    console.warn('Native health connection required');
    return false;
  }

  try {
    const { available } = await Health.isHealthAvailable();
    if (!available) return false;

    // Request permissions
    await Health.requestHealthPermissions({
      permissions: ['READ_STEPS', 'READ_ACTIVE_CALORIES', 'READ_TOTAL_CALORIES']
    });

    // Update local state
    updateHealthConnection({
      platform,
      connected: true,
      lastSync: new Date().toISOString(),
      available: true
    });

    return true;
  } catch (error) {
    console.error('Health permission error:', error);
    return false;
  }
};

export const getNativeSteps = async (): Promise<number> => {
  if (!Capacitor.isNativePlatform()) return 0;

  try {
    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const data = await Health.queryAggregated({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      dataType: 'steps',
      bucket: 'day'
    });

    // Sum up steps if multiple buckets returned (unlikely for 1 day but safe)
    return data.aggregatedData.reduce((acc, curr) => acc + curr.value, 0);
  } catch (error) {
    console.error('Error fetching native steps:', error);
    return 0;
  }
};

// ============================================
// PLATFORM INFO
// ============================================

export interface PlatformInfo {
  id: HealthPlatform;
  name: string;
  iconUrl: string;
  color: string;
  available: boolean;
  requiresNative: boolean;
  description: string;
}

export const getHealthPlatforms = (): PlatformInfo[] => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isSamsung = /Samsung/i.test(navigator.userAgent);
  const isNative = Capacitor.isNativePlatform();

  return [
    {
      id: 'apple_health',
      name: 'Apple Health',
      iconUrl: appleHealthIcon,
      color: 'bg-white',
      available: isNative ? (isIOS || true) : isIOS, // Simplification: assume avaiable if native
      requiresNative: true,
      description: 'Sync steps, workouts & health data'
    },
    {
      id: 'google_fit',
      name: 'Google Fit',
      iconUrl: googleFitIcon,
      color: 'bg-white',
      available: isNative ? (isAndroid || true) : isAndroid,
      requiresNative: true,
      description: 'Sync steps, heart rate & activities'
    },
    {
      id: 'samsung_health',
      name: 'Samsung Health',
      iconUrl: samsungHealthIcon,
      color: 'bg-white',
      available: isSamsung,
      requiresNative: true,
      description: 'Sync Samsung wearable data'
    }
  ];
};
