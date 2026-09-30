import axiosClient from './axiosClient';

export const dashboardApi = {
  /**
   * Get dashboard metric statistics (/api/dashboard/stats)
   */
  getStats: async () => {
    const response = await axiosClient.get('/dashboard/stats');
    return response.data;
  },

  /**
   * Get recent activity logs (/api/dashboard/recent-activity)
   */
  getRecentActivity: async () => {
    const response = await axiosClient.get('/dashboard/recent-activity');
    return response.data;
  },

  /**
   * Get analytics data (/api/dashboard/analytics)
   */
  getAnalytics: async () => {
    const response = await axiosClient.get('/dashboard/analytics');
    return response.data;
  },

  /**
   * Get registered users and activities for admin (/api/dashboard/users)
   */
  getUsers: async () => {
    const response = await axiosClient.get('/dashboard/users');
    return response.data;
  },
};
