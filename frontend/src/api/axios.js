// frontend/src/api/axios.js
import axios from 'axios';
import { store } from '../redux/store';
import { logout } from '../redux/slices/authSlice';

// ✅ Get API URL based on environment
const getApiUrl = () => {
    // For production (Vercel)
    if (import.meta.env.PROD) {
        return '/api';  // ✅ Keep this as '/api'
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
        
        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            store.dispatch(logout());
            // Only redirect if not already on login page
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        
        // Handle 403 Forbidden
        if (error.response?.status === 403) {
            console.warn('⚠️ Access forbidden');
        }
        
        // Handle 500 Server Error
        if (error.response?.status === 500) {
            console.error('🔥 Server error occurred');
        }
        
        return Promise.reject(error);
    }
);

export default api;