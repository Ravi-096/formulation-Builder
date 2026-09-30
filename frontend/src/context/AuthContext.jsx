import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../api/axiosClient';

export const AuthContext = createContext(null);

const DEFAULT_ACTIVE_USER = {
  id: 'usr_01',
  email: 'admin@example.com',
  username: 'alex_morgan',
  name: 'Dr. Alex Morgan',
  role: 'Chief Scientist & Pharmacologist',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!savedToken || savedToken === 'direct_dev_token') return null;
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!savedToken || savedToken === 'direct_dev_token') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }
    return savedToken;
  });

  const [isLoading, setIsLoading] = useState(() => {
    const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    return !!(savedToken && savedToken !== 'direct_dev_token');
  });
  const [authError, setAuthError] = useState(null);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!storedToken || storedToken === 'direct_dev_token') {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        setUser(null);
        setToken(null);
        setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.getCurrentUser();
        if (response?.user) {
          setUser(response.user);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
        }
      } catch (err) {
        console.warn('Session verification failed, logging out:', err);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen to 401 unauthorized global events from Axios interceptor
    const handleSessionExpired = () => {
      setUser(null);
      setToken(null);
      setAuthError('Your session has expired. Please log in again.');
    };

    window.addEventListener('auth:session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth:session_expired', handleSessionExpired);
    };
  }, []);

  /**
   * Log in user
   */
  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const data = await authApi.login(credentials);
      if (data?.token && data?.user) {
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      }
      throw new Error(data?.message || 'Login failed');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Invalid credentials.';
      setAuthError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Register user
   */
  const register = useCallback(async (userData) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const data = await authApi.register(userData);
      if (data?.token && data?.user) {
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      }
      throw new Error(data?.message || 'Registration failed');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Registration failed.';
      setAuthError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Log out user
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
      setToken(null);
      setAuthError(null);
      setIsLoading(false);
    }
  }, []);

  /**
   * Update user profile via backend API and persist to MySQL
   */
  const updateProfile = useCallback(async (updatedFields) => {
    try {
      const res = await authApi.updateProfile(updatedFields);
      if (res?.user) {
        setUser(res.user);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));
        return res.user;
      }
      throw new Error('The server did not return the updated profile. Please try again.');
    } catch (err) {
      // Re-throw so caller can display specific validation error
      throw err;
    }
  }, []);

  /**
   * Change user password via backend API
   */
  const changePassword = useCallback(async (passwordData) => {
    return await authApi.changePassword(passwordData);
  }, []);

  /**
   * Upload user avatar via backend API and persist to MySQL
   */
  const uploadAvatar = useCallback(async (file) => {
    const res = await authApi.uploadAvatar(file);
    if (res?.user) {
      setUser(res.user);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));
      return res.user;
    }
    return res;
  }, []);

  /**
   * Update local user state
   */
  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    authError,
    setAuthError,
    login,
    register,
    logout,
    updateUser,
    updateProfile,
    changePassword,
    uploadAvatar,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
