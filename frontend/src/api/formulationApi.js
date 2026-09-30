import axiosClient from './axiosClient';

export const formulationApi = {
  /**
   * Fetch list of available pharmaceutical excipients
   */
  getExcipients: async (category) => {
    const params = category && category !== 'all' ? { category } : {};
    const response = await axiosClient.get('/formulation/excipients', { params });
    return response.data;
  },

  /**
   * Run live computational chemistry validation on a tentative formulation
   */
  validateFormulation: async (formulationData) => {
    const response = await axiosClient.post('/formulation/validate', formulationData);
    return response.data;
  },

  /**
   * Validate and persist formulation to database for authenticated user
   */
  saveFormulation: async (formulationData) => {
    const response = await axiosClient.post('/formulation/save', formulationData);
    return response.data;
  },

  /**
   * Fetch all formulations saved by current user
   */
  getMyFormulations: async () => {
    const response = await axiosClient.get('/formulation/my-formulations');
    return response.data;
  },

  /**
   * Fetch a single formulation by ID
   */
  getFormulation: async (id) => {
    const response = await axiosClient.get(`/formulation/${id}`);
    return response.data;
  },

  /**
   * Delete a formulation by ID
   */
  deleteFormulation: async (id) => {
    const response = await axiosClient.delete(`/formulation/${id}`);
    return response.data;
  },

  /**
   * Run or request Pharmacokinetics (PK/ADME) simulation
   */
  simulatePk: async (simulationPayload) => {
    try {
      const response = await axiosClient.post('/formulation/simulate-pk', simulationPayload);
      return response.data;
    } catch {
      // Graceful fallback to client-side ODE simulation engine
      return null;
    }
  },
};

export default formulationApi;
