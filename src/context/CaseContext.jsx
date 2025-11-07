import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { API_BASE } from '../utils/apiBase';

// Create the context
const CaseContext = createContext();

// Create a custom hook to use the context
export const useCases = () => useContext(CaseContext);

// Provider component
export const CaseProvider = ({ children }) => {
  const [cases, setCases] = useState([]);
  const [allCases, setAllCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now()); // Add timestamp for triggering updates
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCases: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false
  });
  const { loading: authLoading, isAuthenticated } = useAuth();

  // Fetch all cases for statistics (no pagination)
  const fetchAllCases = useCallback(async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return [];
      }
      
      // Set auth token header
      axios.defaults.headers.common['x-auth-token'] = token;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Fetch all cases without paginationtry {
      const response = await axios.get(`${API_BASE}/cases/all`);
      console.log('All Cases API Response:', response.data);
      console.log('First case with profile picture check:', response.data.find(c => c.profilePicture));
      
      const fetchedCases = response.data || [];
      setAllCases(fetchedCases); // Update allCases state
      setLastUpdate(Date.now()); // Trigger update notification
      
      return fetchedCases;
    } catch (err) {
      console.error('Error fetching all cases:', err);
      
      // Handle token validation errors
      if (err.response && err.response.status === 401) {
        console.log('Token validation failed');
        const backendMsg = (err.response?.data?.message || '').toLowerCase();
        if (backendMsg.includes('session is not active') || backendMsg.includes('terminated') || backendMsg.includes('unable to validate session')) {
          setError("You’ve been logged in elsewhere. Please log in again.");
        } else if (backendMsg.includes('expired')) {
          setError('Your session has expired. Please login again.');
        } else {
          setError('Authentication failed. Please log in again.');
        }
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        setError(err.response?.data?.message || 'Error fetching cases');
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch cases from the API with pagination support
  const fetchCases = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      // Avoid race condition: wait until auth finishes initializing
      if (authLoading) {
        return;
      }

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }
      
      // Clear any previous authentication errors since we have a token
      setError(null);
      
      // Set auth token header
      axios.defaults.headers.common['x-auth-token'] = token;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Fetch cases with pagination
      const response = await axios.get(`${API_BASE}/cases?page=${page}&limit=${limit}`);
      console.log('API Response in Context:', response.data);
      console.log('Cases with profile pictures:', response.data.cases?.filter(c => c.profilePicture) || []);
      
      // Handle both old format (array) and new format (object with cases and pagination)
      if (Array.isArray(response.data)) {
        // Old format - no pagination
        setCases(response.data);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalCases: response.data.length,
          limit: response.data.length,
          hasNextPage: false,
          hasPrevPage: false
        });
      } else {
        // New format - with pagination
        setCases(response.data.cases || []);
        setPagination(response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalCases: 0,
          limit: 10,
          hasNextPage: false,
          hasPrevPage: false
        });
      }
    } catch (err) {
      console.error('Error fetching cases:', err);
      
      // Handle token validation errors
      if (err.response && err.response.status === 401) {
        console.log('Token validation failed');
        setError('Authentication failed. Please log in again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        setError(err.response?.data?.message || 'Error fetching cases');
      }
    } finally {
      setLoading(false);
    }
  }, [authLoading]);

  // Initial fetch on component mount
  useEffect(() => {
    // Only fetch if authenticated and not already loading
    if (isAuthenticated && !authLoading && cases.length === 0) {
      fetchCases();
    }
  }, [authLoading, isAuthenticated, cases.length, fetchCases]);

  // Method to add a new case
  const addCase = async (newCase) => {
    // If the case already has an id, assume it was persisted by the caller (e.g., AddCaseForm)
    // and just insert it into local state without re-posting to the backend.
    if (newCase && newCase.id) {
      const now = new Date();
      const normalizedCase = {
        ...newCase,
        lastUpdated: newCase.lastUpdated || now.toISOString(),
        timestamp: newCase.timestamp || now.getTime()
      };
      setCases(prevCases => [normalizedCase, ...prevCases]);
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required');
        return;
      }

      // Set auth token header
      axios.defaults.headers.common['x-auth-token'] = token;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Parse the name if it's in "First Last" format
      let firstName, lastName;
      if (newCase.name && newCase.name.includes(' ')) {
        const nameParts = newCase.name.split(' ');
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ');
      } else {
        firstName = newCase.firstName || newCase.name || 'Test';
        lastName = newCase.lastName || 'Case';
      }

      // Format the case data for the API (avoid hardcoded birthdate defaults)
      const caseData = {
        firstName: firstName,
        lastName: lastName,
        middleName: newCase.middleName || '',
        sex: newCase.sex || 'Male',
        birthdate: newCase.birthdate || '',
        status: newCase.status || 'active',
        religion: newCase.religion || '',
        address: newCase.address || '',
        sourceOfReferral: newCase.sourceOfReferral || 'Test',
        caseType: newCase.caseType || newCase.programType || newCase.program || '',
        assignedHouseParent: newCase.assignedHouseParent || '',
        programType: newCase.programType || newCase.program || newCase.caseType || '',
        program_type: newCase.programType || newCase.program || newCase.caseType || '',
        problemPresented: newCase.problemPresented || '',
        briefHistory: newCase.briefHistory || '',
        economicSituation: newCase.economicSituation || '',
        medicalHistory: newCase.medicalHistory || '',
        familyBackground: newCase.familyBackground || '',
        checklist: newCase.checklist || [],
        recommendation: newCase.recommendation || '',
        assessment: newCase.assessment || ''
      };

      console.log("Sending case data to API:", caseData);

      // Call the backend API to create the case
      const response = await axios.post(`${API_BASE}/cases`, caseData);
      
      console.log("Case created successfully:", response.data);

      // Helper function to calculate age
      const calculateAge = (birthdate) => {
        if (!birthdate) return 'N/A';
        const today = new Date();
        const birth = new Date(birthdate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        return age;
      };

      // Instead of refetching all cases, add the new case directly to the state for immediate UI update
      const now = new Date();
      const newCaseForState = {
        id: response.data.id,
        name: `${response.data.first_name} ${response.data.last_name}`,
        firstName: response.data.first_name,
        lastName: response.data.last_name,
        age: calculateAge(response.data.birthdate),
        programType: response.data.program_type || caseData.programType,
        status: response.data.status || 'active',
        lastUpdated: response.data.last_updated || response.data.created_at || now.toISOString(),
        timestamp: now.getTime(),
        ...response.data // Include all other fields from the API response
      };
      
      console.log("Adding new case to state immediately:", newCaseForState);
      setCases(prevCases => [newCaseForState, ...prevCases]);
      
      // Optionally refresh the full list in the background to ensure consistency
      // fetchCases(pagination?.currentPage || 1, pagination?.limit || 10);
      
    } catch (error) {
      console.error('Error adding case:', error);
      setError(error.response?.data?.message || 'Failed to add case');
      
      // If API call fails, fall back to local state update for better UX
      const now = new Date();
      const processedCase = { 
        ...newCase, 
        id: `temp-${Date.now()}`,
        status: newCase.status || 'active',
        lastUpdated: now.toISOString(),
        timestamp: now.getTime()
      };
      console.log("Adding case to local state as fallback:", processedCase);
      setCases([processedCase, ...cases]);
    }
  };

  // Method to update a case
  const updateCase = (updatedCase) => {
    console.log('=== CONTEXT UPDATE CASE DEBUG ===');
    console.log('Updating case:', updatedCase.id, 'with status:', updatedCase.status);
    console.log('Current cases before update:', cases.map(c => ({ id: c.id, name: c.name, status: c.status })));
    
    // Add/update timestamp for notification tracking
    const now = new Date();
    const fullUpdatedCase = {
      ...updatedCase,
      lastUpdated: now.toISOString(),
      timestamp: now.getTime()
    };
    console.log("Updating case with new timestamp:", fullUpdatedCase);
    
    // Check if the case is being archived
    const isArchived = ['archives', 'archived', 'reintegrate'].includes(String(fullUpdatedCase.status || '').toLowerCase());
    
    // Update cases state - remove archived cases from paginated view
    setCases(prevCases => {
      if (isArchived) {
        // Remove archived case from the paginated view
        console.log('Removing archived case from paginated view:', fullUpdatedCase.id);
        return prevCases.filter(c => c.id !== updatedCase.id);
      } else {
        // Update the case in the paginated view
        return prevCases.map(c => {
          if (c.id === updatedCase.id) {
            console.log('Found matching case, updating:', c.id, 'old status:', c.status, 'new status:', fullUpdatedCase.status);
            return fullUpdatedCase;
          }
          return c;
        });
      }
    });
    
    // Always update allCases to maintain complete record
    setAllCases(prevAllCases => {
      const exists = prevAllCases.some(c => c.id === updatedCase.id);
      if (exists) {
        return prevAllCases.map(c => {
          if (c.id === updatedCase.id) {
            return fullUpdatedCase;
          }
          return c;
        });
      }
      // If the case was not previously in allCases, add it so it can appear in Archived view
      return [fullUpdatedCase, ...prevAllCases];
    });
    
    // Trigger real-time update notification
    setLastUpdate(Date.now());
    
    console.log('=== CONTEXT UPDATE CASE DEBUG END ===');
  };

  // Method to delete a case
  const deleteCase = (caseId) => {
    setCases(prevCases => prevCases.filter(c => c.id !== caseId));
  };

  // Create the context value object
  const value = {
    cases,
    allCases,
    loading,
    error,
    pagination,
    lastUpdate,
    fetchCases,
    fetchAllCases,
    addCase,
    updateCase,
    deleteCase
  };

  return (
    <CaseContext.Provider value={value}>
      {children}
    </CaseContext.Provider>
  );
};

export default CaseContext;