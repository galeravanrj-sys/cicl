// Service for Life Skills and Vital Signs API calls
import { API_BASE as API_BASE_URL } from '../utils/apiBase';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Helper function to create headers with auth token
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    'x-auth-token': token,
    'Authorization': `Bearer ${token}`  // Add both header formats for compatibility
  };
};

// Life Skills API calls
export const lifeSkillsService = {
  // Get all life skills for a case
  getLifeSkills: async (caseId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cases/${caseId}/life-skills`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch life skills');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching life skills:', error);
      throw error;
    }
  },

  // Add a new life skill entry
  addLifeSkill: async (caseId, lifeSkillData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cases/${caseId}/life-skills`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(lifeSkillData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to add life skill');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error adding life skill:', error);
      throw error;
    }
  },

  // Update a life skill entry
  updateLifeSkill: async (caseId, skillId, lifeSkillData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cases/${caseId}/life-skills/${skillId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(lifeSkillData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update life skill');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating life skill:', error);
      throw error;
    }
  },

  // Delete a life skill entry
  deleteLifeSkill: async (caseId, skillId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cases/${caseId}/life-skills/${skillId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete life skill');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting life skill:', error);
      throw error;
    }
  }
};

// Vital Signs API calls
export const vitalSignsService = {
  // Get all vital signs for a case
  getVitalSigns: async (caseId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cases/${caseId}/vital-signs`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch vital signs');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching vital signs:', error);
      throw error;
    }
  },

  // Add a new vital signs entry
  addVitalSigns: async (caseId, vitalSignsData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cases/${caseId}/vital-signs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(vitalSignsData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to add vital signs');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error adding vital signs:', error);
      throw error;
    }
  },

  // Update a vital signs entry
  updateVitalSigns: async (caseId, vitalId, vitalSignsData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cases/${caseId}/vital-signs/${vitalId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(vitalSignsData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update vital signs');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating vital signs:', error);
      throw error;
    }
  },

  // Delete a vital signs entry
  deleteVitalSigns: async (caseId, vitalId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cases/${caseId}/vital-signs/${vitalId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete vital signs');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting vital signs:', error);
      throw error;
    }
  }
};