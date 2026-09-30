import axios from 'axios';
import { mockApiHandler } from './mockApi';

// Get base URL from environment or default to /api
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK_FALLBACK !== 'false';

export const TOKEN_STORAGE_KEY = 'ks_jwt_token';
export const USER_STORAGE_KEY = 'ks_user_data';

// Create Axios Instance
const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
  timeout: 10000,
});

// ==========================================
// 1. Request Interceptor: Attach Bearer JWT
// ==========================================
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==========================================
// 2. Response Interceptor: Handle 401 & Mock
// ==========================================
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If mock mode is enabled or backend is unreachable (e.g. Network Error, 404, connection refused)
    const isNetworkError = !error.response || error.code === 'ERR_NETWORK' || error.response?.status === 404;
    if (USE_MOCK && isNetworkError && !originalRequest._mockTried) {
      originalRequest._mockTried = true;
      try {
        const mockRes = await mockApiHandler(originalRequest);
        return mockRes;
      } catch (mockErr) {
        return Promise.reject(mockErr);
      }
    }

    // Handle 401 Unauthorized (Expired or invalid token)
    if (error.response?.status === 401) {
      console.warn('Session expired or unauthorized request. Clearing session.');
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      
      // Dispatch custom event for AuthContext / App to handle immediate logout redirect
      window.dispatchEvent(new CustomEvent('auth:session_expired'));
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
