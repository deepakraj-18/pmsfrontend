import axios from 'axios';
import { queryClient } from '@/providers/AppProviders';

const TOKEN_KEY = 'pms_token';

/**
 * Environment-Aware Base URL
 *
 * Vite exposes `import.meta.env.PROD` (true during `vite build`, false during
 * `vite dev`) — this is the Vite-idiomatic equivalent of:
 *   process.env.NODE_ENV === 'production'
 *
 * Resolution priority:
 *   1. VITE_API_URL env var (set in .env files for per-environment overrides)
 *   2. import.meta.env.PROD toggle (prod → Azure App Service, dev → localhost)
 *
 * Mixed-content prevention: the production URL enforces https:// so browsers
 * never block API requests from the Azure Static Web App (https://) origin.
 */
const PROD_API_URL = 'https://trucszohoreplica.azurewebsites.net/api/v1';
const DEV_API_URL  = 'http://localhost:8000/api/v1';

const BASE_URL: string =
    import.meta.env.VITE_API_URL          // Explicit override always wins
    ?? (import.meta.env.PROD              // Vite build-time flag
        ? PROD_API_URL
        : DEV_API_URL);

// ── Base API Instance ─────────────────────────────────────────────────────
export const api = axios.create({
    baseURL: BASE_URL,
    /**
     * withCredentials: true — mandatory for credentialed CORS requests.
     * Ensures the JWT Bearer token in the Authorization header is accepted
     * by the Azure App Service backend when using CORSMiddleware with
     * allow_credentials=True.
     */
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ── Request Interceptor: Attach Bearer Token ──────────────────────────────
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response Interceptor: Cache Invalidation + Global Error Dispatch ──────
api.interceptors.response.use(
    (response) => {
        // The .NET API wraps every success response as
        // { is_success, data, message, errors } (see PMS.Application/Common/ApiResponse.cs)
        // — unlike the source FastAPI app, which returned each DTO flat/unwrapped. Every
        // call site in this frontend was written against the flat shape (`response.data.foo`),
        // so unwrap the envelope here, once, rather than touching every call site.
        if (response.data && typeof response.data === 'object' &&
            'is_success' in response.data && 'data' in response.data) {
            response.data = response.data.data;
        }

        const { method, url } = response.config;

        // Automatic TanStack Query cache invalidation on any successful mutation
        if (method && ['post', 'put', 'delete', 'patch'].includes(method.toLowerCase()) && url) {
            const resource = url.replace(/^\/api\/v1\//, '').split('/')[0];
            if (resource) {
                queryClient.invalidateQueries({ queryKey: [resource] });
            }
        }

        return response;
    },
    (error) => {
        const status = error.response?.status;

        if (status === 401) {
            // Session expired or invalid token — clear and redirect to login
            localStorage.removeItem(TOKEN_KEY);
            window.location.href = '/login';
        } else {
            // Dispatch global error event consumed by useApiErrorToast hook
            const message =
                error.response?.data?.detail  ||
                error.response?.data?.message ||
                error.message                 ||
                'An unexpected error occurred';

            window.dispatchEvent(
                new CustomEvent('api-error', {
                    detail: { status, message },
                })
            );
        }

        return Promise.reject(error);
    }
);
