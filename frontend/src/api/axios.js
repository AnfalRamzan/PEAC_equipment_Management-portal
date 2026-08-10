import axios from 'axios';
import { store } from '../redux/store';
import { logout } from '../redux/slices/authSlice';

// ✅ Dynamic API URL based on environment
const getApiUrl = () => {
    // For production (Vercel)
    if (import.meta.env.PROD) {
        return '/api';
    }
    // For local development
    return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
};

const api = axios.create({
    baseURL: getApiUrl(),
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request Interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log(`📤 ${config.method.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('❌ API Error:', error.response?.status, error.response?.data);
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            store.dispatch(logout());
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;