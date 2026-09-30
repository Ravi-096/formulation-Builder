import axiosClient from './axiosClient';

export const authApi = {
  /**
   * Log in with identifier (email/username) and password
   */
  login: async (credentials) => {
    const response = await axiosClient.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Register a new user
   */
  register: async (userData) => {
    const response = await axiosClient.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Fetch current authenticated user's profile
   */
  getCurrentUser: async () => {
    const response = await axiosClient.get('/auth/me');
    return response.data;
  },

  /**
   * Update profile details in MySQL
   */
  updateProfile: async (profileData) => {
    const response = await axiosClient.put('/auth/profile', profileData);
    return response.data;
  },

  /**
   * Change user password in MySQL
   */
  changePassword: async (passwordData) => {
    const response = await axiosClient.put('/auth/password', passwordData);
    return response.data;
  },

  /**
   * Upload user profile avatar photo
   */
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosClient.post('/auth/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Log out (optionally notify backend)
   */
  logout: async () => {
    try {
      await axiosClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    }
  },
};
