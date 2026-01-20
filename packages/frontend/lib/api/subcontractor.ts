import apiClient from './client';

export const subcontractorApi = {
  // Get assigned projects for subcontractor
  getProjects: async (params?: { search?: string; status?: string }) => {
    const response = await apiClient.get('/projects', { params });
    return response.data;
  },

  // Get broker information
  getBrokerInfo: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // Save/update broker information
  saveBrokerInfo: async (data: {
    brokerName: string;
    brokerEmail: string;
    brokerPhone: string;
    brokerCompany: string;
  }) => {
    const response = await apiClient.patch('/auth/me', data);
    return response.data;
  },

  // Get compliance status
  getComplianceStatus: async () => {
    const response = await apiClient.get('/dashboard');
    return response.data;
  },
};
