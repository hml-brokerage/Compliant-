import apiClient from './client';

export const dashboardApi = {
  // Get dashboard data for current user
  getDashboard: async () => {
    const response = await apiClient.get('/dashboard');
    return response.data;
  },

  // Get filtered projects with pagination
  getProjects: async (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/dashboard/projects', { params });
    return response.data;
  },

  // Get filtered contractors with pagination
  getContractors: async (params?: {
    status?: string;
    insuranceStatus?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/dashboard/contractors', { params });
    return response.data;
  },
};
