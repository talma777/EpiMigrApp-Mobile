import { storage } from './storage';

// URL DE PRODUCCIÓN — Railway Backend (con helmet CSP corregido)
const API_URL = 'https://eppimigrapp-monorepo-production.up.railway.app';

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
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export const api = {
    get: async (endpoint: string) => {
        console.log(`🌐 API GET Request: ${endpoint}`);
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'GET',
                headers: await headers(),
            });
            const data = await response.json();
            if (!response.ok) {
                console.error(`❌ API GET Error [${response.status}]:`, data);
                throw new Error(data.message || 'API Error');
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
            const data = await response.json();
            if (!response.ok) {
                console.error(`❌ API POST Error [${response.status}]:`, data);
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
