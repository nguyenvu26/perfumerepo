import axios from 'axios';
import { env } from './env';

function resolveBaseUrl() {
    if (typeof window !== 'undefined') return env.NEXT_PUBLIC_API_URL;

    try {
        const parsed = new URL(env.NEXT_PUBLIC_API_URL);
        const isLocalHost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
        const isBackendPublishedPort = parsed.port === '5993';
        if (isLocalHost || isBackendPublishedPort) {
            return `http://backend-app:3000${parsed.pathname}`;
        }
        return env.NEXT_PUBLIC_API_URL;
    } catch {
        return env.NEXT_PUBLIC_API_URL;
    }
}

const baseURL = resolveBaseUrl();

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Parse backend error for user-friendly messages
api.interceptors.response.use(
    (res) => res,
    (err) => {
        const msg = err?.response?.data?.message;
        if (Array.isArray(msg)) {
            err.message = msg.join(', ');
        } else if (typeof msg === 'string') {
            err.message = msg;
        } else if (!err.message) {
            err.message = 'Request failed';
        }
        return Promise.reject(err);
    }
);

export default api;
