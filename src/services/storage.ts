/**
 * storage.ts
 * Wrapper que usa localStorage en Web y expo-secure-store en iOS/Android.
 * Esto soluciona el error: ExpoSecureStore.default.setValueWithKeyAsync is not a function
 */
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const storage = {
    getItem: async (key: string): Promise<string | null> => {
        if (isWeb) {
            return localStorage.getItem(key);
        }
        const SecureStore = await import('expo-secure-store');
        return SecureStore.getItemAsync(key);
    },
    setItem: async (key: string, value: string): Promise<void> => {
        if (isWeb) {
            localStorage.setItem(key, value);
            return;
        }
        const SecureStore = await import('expo-secure-store');
        return SecureStore.setItemAsync(key, value);
    },
    removeItem: async (key: string): Promise<void> => {
        if (isWeb) {
            localStorage.removeItem(key);
            return;
        }
        const SecureStore = await import('expo-secure-store');
        return SecureStore.deleteItemAsync(key);
    },
};
