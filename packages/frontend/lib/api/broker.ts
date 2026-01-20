import apiClient from './client';

export const brokerApi = {
  // Get all subcontractors assigned to broker
  getSubcontractors: async () => {
    const response = await apiClient.get('/contractors', {
      params: { page: 1, limit: 100 }
    });
    return response.data;
  },

  // Get specific subcontractor by ID
  getSubcontractorById: async (id: string) => {
    const response = await apiClient.get(`/contractors/${id}`);
    return response.data;
  },

  // Get all documents for broker
  getDocuments: async () => {
    const response = await apiClient.get('/generated-coi');
    return response.data;
  },

  // Upload documents for a subcontractor
  uploadDocuments: async (subId: string, data: FormData) => {
    const response = await apiClient.post(`/contractors/${subId}/documents`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
