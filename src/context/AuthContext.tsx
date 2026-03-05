// AuthContext.tsx update
import React, { createContext, useReducer, useEffect, useMemo } from 'react';
import { storage } from '../services/storage';
import { api, setAuthToken, removeAuthToken } from '../services/api';

interface AuthState {
    isLoading: boolean;
    isSignout: boolean;
    userToken: string | null;
    userId: string | null;
    email: string | null;
}

type AuthAction =
    | { type: 'RESTORE_TOKEN'; token: string | null; userId: string | null; email: string | null }
    | { type: 'SIGN_IN'; token: string; userId: string; email: string }
    | { type: 'SIGN_OUT' };

export const AuthContext = createContext<{
    signIn: (data: any) => Promise<void>;
    signOut: () => void;
    signUp: (data: any) => Promise<void>;
    state: AuthState;
}>({
    signIn: async () => { },
    signOut: () => { },
    signUp: async () => { },
    state: { isLoading: true, isSignout: false, userToken: null, userId: null, email: null },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(
        (prevState: AuthState, action: AuthAction): AuthState => {
            switch (action.type) {
                case 'RESTORE_TOKEN':
                    return {
                        ...prevState,
                        userToken: action.token,
                        userId: action.userId,
                        email: action.email,
                        isLoading: false,
                    };
                case 'SIGN_IN':
                    return {
                        ...prevState,
                        isSignout: false,
                        userToken: action.token,
                        userId: action.userId,
                        email: action.email,
                    };
                case 'SIGN_OUT':
                    return {
                        ...prevState,
                        isSignout: true,
                        userToken: null,
                        userId: null,
                        email: null,
                    };
            }
        },
        {
            isLoading: true,
            isSignout: false,
            userToken: null,
            userId: null,
            email: null,
        }
    );

    useEffect(() => {
        const bootstrapAsync = async () => {
            let userToken: string | null = null;
            let userId: string | null = null;
            let email: string | null = null;
            try {
                userToken = await storage.getItem('userToken');
                userId = await storage.getItem('userId');
                email = await storage.getItem('userEmail');
            } catch (e) {
                // Restoring token failed
            }
            dispatch({ type: 'RESTORE_TOKEN', token: userToken, userId, email });
        };

        bootstrapAsync();
    }, []);

    const authContext = useMemo(
        () => ({
            signIn: async (data: any) => {
                try {
                    const response = await api.post('/auth/login', data);
                    if (response.access_token) {
                        await setAuthToken(response.access_token);
                        await storage.setItem('userId', response.user.id);
                        await storage.setItem('userEmail', response.user.email);
                        dispatch({ type: 'SIGN_IN', token: response.access_token, userId: response.user.id, email: response.user.email });
                    } else {
                        throw new Error(response.message || 'Login failed');
                    }
                } catch (e) {
                    console.error(e);
                    throw e;
                }
            },
            signOut: async () => {
                // Lazy import to avoid module-load coupling
                try { (await import('../services/BiometricsService')).biometrics.stopMonitoring(); } catch (_) { }
                await removeAuthToken();
                await storage.removeItem('userId');
                await storage.removeItem('userEmail');
                dispatch({ type: 'SIGN_OUT' });
            },
            signUp: async (data: any) => {
                try {
                    const regResponse = await api.post('/auth/register', data);
                    if (regResponse.access_token) {
                        await setAuthToken(regResponse.access_token);
                        await storage.setItem('userId', regResponse.user.id);
                        await storage.setItem('userEmail', regResponse.user.email);
                        dispatch({ type: 'SIGN_IN', token: regResponse.access_token, userId: regResponse.user.id, email: regResponse.user.email });
                    } else {
                        throw new Error('Registration failed');
                    }
                } catch (e) {
                    console.error(e);
                    throw e;
                }
            },
            state,
        }),
        [state]
    );

    return (
        <AuthContext.Provider value={authContext}>
            {children}
        </AuthContext.Provider>
    );
};
