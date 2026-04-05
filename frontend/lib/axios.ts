import axios from 'axios';
import { env } from './env';

const api = axios.create({
    baseURL: env.NEXT_PUBLIC_API_URL,
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
