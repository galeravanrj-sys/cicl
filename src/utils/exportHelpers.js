import axios from 'axios';
import { API_BASE } from './apiBase';
import { lifeSkillsService, vitalSignsService } from '../services/lifeSkillsVitalSignsService';

// Returns auth headers populated from local/session storage
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return null;
  return {
    headers: {
      'x-auth-token': token,
      'Authorization': `Bearer ${token}`
    }
  };
};

// Fetch full case details by ID from the backend
export const fetchCaseDetailsForExport = async (caseId) => {
  try {
    const config = getAuthHeaders();
    if (!config) throw new Error('Authentication required');
    const { data } = await axios.get(`${API_BASE}/cases/${caseId}`, config);
    let lifeSkills = [];
    let vitalSigns = [];
    try { lifeSkills = await lifeSkillsService.getLifeSkills(caseId); } catch {}
    try { vitalSigns = await vitalSignsService.getVitalSigns(caseId); } catch {}
    return { ...(data || {}), lifeSkills, vitalSigns };
  } catch (err) {
    console.error('Failed to fetch case details for export:', err);
    return null;
  }
};