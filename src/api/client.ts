import axios, { AxiosInstance } from 'axios';
import { queryClient } from '@/providers/AppProviders';

import { 
    AUTH_TOKEN_KEY, 
    AUTH_REFRESH_TOKEN_KEY, 
    MUTATION_METHODS, 
    CACHE_INVALIDATION_RESOURCES,
    API_V1_PREFIX,
    QUERY_KEYS,
    HTTP_STATUS,
    AUTH_ENDPOINTS,
    ROUTES,
    STORAGE_KEYS,
    EVENTS
} from '@/constants/constants';

export const api: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL,
    timeout: 30_000,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
    paramsSerializer: (params) => {
        const parts: string[] = [];
        for (const key in params) {
            const val = params[key];
            if (val === undefined || val === null) continue;
            if (Array.isArray(val)) {
                val.forEach(v => {
                    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
                });
            } else {
                parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
            }
        }
        return parts.join('&');
    }
});


api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

api.interceptors.response.use(
    (response) => {
        const { method, url } = response.config;
        if (method && MUTATION_METHODS.includes(method) && url) {

            const resourcePath = url.replace(API_V1_PREFIX, "");
            const baseResource = resourcePath.split('/').filter(Boolean)[0];

            if (baseResource) {

                queryClient.invalidateQueries({ queryKey: [baseResource] });

                if (CACHE_INVALIDATION_RESOURCES.includes(baseResource)) {
                    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REPORTS] });
                    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECTS] });
                }
            }
        }
        return response;
    },
    (error) => {
        const originalRequest = error.config;
        const status: number | undefined = error.response?.status;
        const message: string =
            error.response?.data?.detail ??
            error.response?.data?.message ??
            error.message ??
            'An unexpected error occurred';

        if (status === HTTP_STATUS.UNAUTHORIZED) {
            const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
            
            if (refreshToken && !originalRequest._retry) {
                originalRequest._retry = true;
                const refreshUrl = `${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL}${AUTH_ENDPOINTS.REFRESH}`;
                
                return axios.post(refreshUrl, { refresh_token: refreshToken }, { withCredentials: true })
                    .then(res => {
                        if (res.status === HTTP_STATUS.OK || res.status === HTTP_STATUS.CREATED) {
                            const { access_token, refresh_token: newRefreshToken } = res.data;
                            localStorage.setItem(STORAGE_KEYS.TOKEN, access_token);
                            if (newRefreshToken) {
                                localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
                            }
                            api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
                            originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
                            return api(originalRequest);
                        }
                        throw new Error('Refresh failed');
                    })
                    .catch(err => {
                        console.error('[Auth] Refresh failed:', err);
                        handleLogout();
                        return Promise.reject(err);
                    });
            }
            
            // If no refresh token or already retried
            if (window.location.pathname !== ROUTES.LOGIN) {
                handleLogout();
            }
        }

        function handleLogout() {
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
            localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER);
            localStorage.removeItem(STORAGE_KEYS.USER_DATA);
            if (window.location.pathname !== ROUTES.LOGIN) {
                window.location.href = ROUTES.LOGIN;
            }
        }

        const toastPayload = (title: string) =>
            window.dispatchEvent(
                new CustomEvent(EVENTS.TOAST, { detail: { type: 'error', title, message } }),
            );

        if (status === HTTP_STATUS.FORBIDDEN) toastPayload('Access Denied');
        else if (status !== undefined && status >= HTTP_STATUS.INTERNAL_SERVER_ERROR) toastPayload(`Server Error (${status})`);



        return Promise.reject(error);
    },
);
