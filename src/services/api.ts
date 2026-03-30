import { storage } from './storage';

// URL DE DESARROLLO LOCAL
const API_URL = 'http://192.168.1.80:3005';

export const getAuthToken = async () => {
    try {
        return await storage.getItem('userToken');
    } catch (error) {
        console.error('Error getting token', error);
        return null;
    }
};

export const setAuthToken = async (token: string) => {
    try {
        await storage.setItem('userToken', token);
    } catch (error) {
        console.error('Error setting token', error);
    }
};

export const removeAuthToken = async () => {
    try {
        await storage.removeItem('userToken');
    } catch (error) {
        console.error('Error removing token', error);
    }
};

const headers = async () => {
    const token = await getAuthToken();
    return {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true', // Bypasses localtunnel warning page
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

import { DeviceEventEmitter } from 'react-native';

export const api = {
    get: async (endpoint: string) => {
        console.log(`🌐 API GET Request: ${endpoint}`);
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'GET',
                headers: await headers(),
            });
            const textResponse = await response.text();
            let data;
            try {
                data = textResponse ? JSON.parse(textResponse) : {};
            } catch (jsonErr) {
                console.error(`❌ JSON Parse failed. Raw response:`, textResponse);
                throw new Error(`Server returned non-JSON: ${textResponse.substring(0, 50)}`);
            }
            if (response.status === 401) {
                console.error('🚨 Session Expired / Unauthorized (401). Clearing Local Token.');
                await removeAuthToken();
                DeviceEventEmitter.emit('onSessionExpired');
            }
            if (!response.ok) {
                throw new Error(data.message || `API Error: ${response.statusText}`);
            }
            console.log(`✅ API GET Success [${response.status}]:`, data);
            return data;
        } catch (error) {
            console.error(`🚨 API GET Fatal Error:`, error);
            throw error;
        }
    },
    post: async (endpoint: string, body: any) => {
        console.log(`🌐 API POST Request: ${endpoint}`, body);
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: await headers(),
                body: JSON.stringify(body),
            });
            const textResponse = await response.text();
            let data;
            try {
                data = textResponse ? JSON.parse(textResponse) : {};
            } catch (jsonErr) {
                console.error(`❌ JSON Parse failed. Raw response:`, textResponse);
                throw new Error(`Server returned non-JSON: ${textResponse.substring(0, 50)}`);
            }
            if (!response.ok) {
                throw new Error(data.message || 'API Error');
            }
            console.log(`✅ API POST Success [${response.status}]:`, data);
            return data;
        } catch (error) {
            console.error(`🚨 API POST Fatal Error:`, error);
            throw error;
        }
    },
};
