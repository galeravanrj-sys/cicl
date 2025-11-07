import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { mapAuthError, setPostRedirectBanner } from '../utils/authError';

// Create the context
const CaseContext = createContext();

// Create a custom hook to use the context
export const useCases = () => useContext(CaseContext);

// Provider component
export const CaseProvider = ({ children }) => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch cases from the API
  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Authentication required');
          setLoading(false);
          return;
        }
        
        // Set auth token header
        axios.defaults.headers.common['x-auth-token'] = token;
        
        // Fetch cases
        const response = await axios.get('http://localhost:5000/api/cases');
        console.log('API Response in Context:', response.data);
        setCases(response.data);
      } catch (err) {
        console.error('Error fetching cases:', err);
        
        // Handle token validation errors
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          console.log('Token validation failed');
          // Clear tokens from storage and axios defaults
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          delete axios.defaults.headers.common['x-auth-token'];
          delete axios.defaults.headers.common['Authorization'];

          const mapped = mapAuthError(err);
          setError(mapped.message);
          if (mapped.redirect) {
            setPostRedirectBanner(mapped.message, 'error', 8000);
            window.location.href = '/login';
          }
        } else {
          setError(err.response?.data?.message || 'Error fetching cases');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchCases();
  }, []);

  // Method to add a new case
  const addCase = (newCase) => {
    // Preserve existing status if provided, otherwise default to 'active'
    const now = new Date();
    const processedCase = { 
      ...newCase, 
      status: newCase.status || 'active',  // Only use 'active' if status is not already set
      lastUpdated: now.toISOString(),
      timestamp: now.getTime()
    };
    console.log("Adding new case with timestamp:", processedCase);
    setCases([processedCase, ...cases]);
  };

  // Method to update a case
  const updateCase = (updatedCase) => {
    // Add/update timestamp for notification tracking
    const now = new Date();
    const fullUpdatedCase = {
      ...updatedCase,
      lastUpdated: now.toISOString(),
      timestamp: now.getTime()
    };
    console.log("Updating case with new timestamp:", fullUpdatedCase);
    setCases(cases.map(c => c.id === updatedCase.id ? fullUpdatedCase : c));
  };

  // Method to delete a case
  const deleteCase = (caseId) => {
    setCases(prevCases => prevCases.filter(c => c.id !== caseId));
  };

  // Create the context value object
  const value = {
    cases,
    loading,
    error,
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