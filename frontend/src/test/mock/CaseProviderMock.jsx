import React, { createContext, useContext } from 'react';

// Create the context
const CaseContext = createContext();

// Mock provider component
export const CaseProviderMock = ({ children }) => {
  const mockCaseData = {
    cases: [
      { id: 1, childName: 'John Doe', status: 'Active', dateCreated: '2024-01-15' },
      { id: 2, childName: 'Jane Smith', status: 'Closed', dateCreated: '2024-01-14' }
    ],
    loading: false,
    error: null,
    totalCases: 25,
    activeCases: 18,
    closedCases: 7,
    fetchCases: () => Promise.resolve(),
    addCase: () => Promise.resolve(),
    updateCase: () => Promise.resolve(),
    deleteCase: () => Promise.resolve()
  };

  return (
    <CaseContext.Provider value={mockCaseData}>
      {children}
    </CaseContext.Provider>
  );
};

// Mock hook to use the context
export const useCases = () => useContext(CaseContext);