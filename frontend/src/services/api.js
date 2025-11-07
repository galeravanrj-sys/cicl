// src/services/api.js
import axios from 'axios';

const API_URL = 'http://192.168.100.46:5000/api';

// Axios instance
const api = axios.create({ baseURL: API_URL });

// Your existing interceptors and caseService
const caseService = {
  getAllCases: () => api.get('/cases'),
  getCaseById: (id) => api.get(`/cases/${id}`),
  createCase: (caseData) => api.post('/cases', caseData),
  updateCase: (id, caseData) => api.put(`/cases/${id}`, caseData),
  deleteCase: (id) => api.delete(`/cases/${id}`)
};

// Simple fetchData for testing
export async function fetchData(url) {
  const response = await fetch(url);
  return response.json();
}

// Export what you already have
export { api, caseService };
