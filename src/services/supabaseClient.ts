import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://kicsoybxslqkdmuyqakl.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpY3NveWJ4c2xxa2RtdXlxYWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMTU4OTYsImV4cCI6MjEwMjc5MTg5Nn0.RtJ6poqhQj-Lsqbhda1L5wM_9fZDCOYYYYmU56RUmsk';

/**
 * Custom SecureStorageAdapter for Supabase Auth on React Native
 * Native (iOS/Android): Uses encrypted hardware storage (Keychain / Android KeyStore via expo-secure-store)
 * Web: Uses localStorage safely with memory fallback
 */
class SecureStorageAdapter {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
      } catch (e) {
        console.warn('[SecureStorage] Web localStorage getItem error:', e);
      }
      return null;
    }

    try {
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.warn(`[SecureStorage] SecureStore getItemAsync error for key "${key}":`, e);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } catch (e) {
        console.warn('[SecureStorage] Web localStorage setItem error:', e);
      }
      return;
    }

    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.warn(`[SecureStorage] SecureStore setItemAsync error for key "${key}":`, e);
    }
  }

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } catch (e) {
        console.warn('[SecureStorage] Web localStorage removeItem error:', e);
      }
      return;
    }

    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.warn(`[SecureStorage] SecureStore deleteItemAsync error for key "${key}":`, e);
    }
  }
}

export const secureStorage = new SecureStorageAdapter();

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Handled explicitly via deep links
  },
});
