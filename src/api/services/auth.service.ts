import { api } from '@/api/client';
import { AUTH_ENDPOINTS } from '@/constants/constants';
import type { AuthUser } from '@/auth/AuthProvider';

export interface LoginPayload {
    email: string;
    password: string;
}

export interface RegisterPayload {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
}

export interface TokenResult extends AuthUser {
    access_token: string;
    refresh_token: string;
}

// `api` unwraps the { is_success, data } envelope, so error bodies are the only place the
// `message` field is still visible.
export const getAuthErrorMessage = (err: any, fallback: string): string => {
    const body = err?.response?.data;
    if (err?.response?.status === 429) return 'Too many attempts. Please wait a minute and try again.';
    return (typeof body?.message === 'string' && body.message)
        || (typeof body?.detail === 'string' && body.detail)
        || fallback;
};

export const authService = {
    async login(payload: LoginPayload): Promise<TokenResult> {
        const res = await api.post<TokenResult>(AUTH_ENDPOINTS.LOGIN, payload);
        return res.data;
    },

    async register(payload: RegisterPayload): Promise<string> {
        const res = await api.post<{ message: string }>(AUTH_ENDPOINTS.REGISTER, payload);
        return res.data.message;
    },
};
