import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/api/client';
import { STORAGE_KEYS, AUTH_ENDPOINTS, ROUTES } from '@/constants/constants';

export interface AuthUser {
    id: number;
    public_id: string;
    email: string;
    first_name: string;
    last_name: string;
    display_name?: string;
    role?: { id: number; name: string; permissions?: Record<string, boolean> };
    is_external: boolean;
    is_synced: boolean;
}

interface AuthContextType {
    token: string | null;
    user: AuthUser | null;
    isLoading: boolean;
    login: (token: string, refreshToken: string, profile?: AuthUser) => Promise<void>;
    logout: () => void;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.TOKEN));
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        try {
            const response = await api.get(AUTH_ENDPOINTS.ME);
            setUser(response.data);
        } catch (err) {
            console.warn('[Auth] Profile fetch failed. Clearing session.', err);
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
            localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
            setToken(null);
            setUser(null);
        }
    }, []);

    useEffect(() => {
        if (token) {
            fetchProfile().finally(() => {
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, [token, fetchProfile]);

    const login = useCallback(async (newToken: string, newRefreshToken: string, profile?: AuthUser) => {
        localStorage.setItem(STORAGE_KEYS.TOKEN, newToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
        setToken(newToken);
        if (profile) {
            setUser(profile);
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        // No setToken(null)/setUser(null) here - window.location.href fully unloads the
        // page anyway, so updating React state first only caused a flash of this
        // about-to-be-destroyed SPA re-rendering LoginPage (via AuthGuard's client-side
        // redirect) before the real navigation took over and showed the splash.
        // index.html's inline script reads this once (then clears it) to tell "logout
        // landing on /login" apart from "cold/direct visit to /login" - only the former
        // should show the splash.
        sessionStorage.setItem('post-logout', '1');
        window.location.href = ROUTES.LOGIN;
    }, []);

    const refreshProfile = useCallback(async () => {
        await fetchProfile();
    }, [fetchProfile]);

    return (
        <AuthContext.Provider value={{ token, user, isLoading, login, logout, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
