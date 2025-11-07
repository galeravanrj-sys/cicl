import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddCaseForm from './AddCaseForm';
import EditCaseForm from './EditCaseForm';
import { useCases } from './context/CaseContext';

const CaseManagement = () => {
  const { cases, loading, error, addCase, updateCase, deleteCase } = useCases();
  const [activeTab, setActiveTab] = useState('All Cases');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editCase, setEditCase] = useState(null);
  // Add state for delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  
  const tabs = ['All Cases', 'Active', 'Archived']; 
  
  // Filter cases based on search term and active tab
  const filteredCases = cases.filter(caseItem => {
    if (!caseItem) return false;
    
    const matchesSearch = caseItem.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          caseItem.programType?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Add debugging to see what statuses exist
    console.log('Case status:', caseItem.id, caseItem.status);
    
    if (activeTab === 'All Cases') {
      return matchesSearch;
    } else if (activeTab === 'Active') {
      // Fix comparison to check for 'active' status in various formats
      return matchesSearch && 
             (String(caseItem.status || '').toLowerCase() === 'active' || 
              caseItem.status === true ||
              caseItem.isActive === true || 
              caseItem.status === null || 
              caseItem.status === undefined);
  } else if (activeTab === 'Archived') {
    // Make case-insensitive comparison and support legacy 'reintegrate' and 'archived'
    const status = String(caseItem.status || '').toLowerCase();
    return matchesSearch && (status === 'archives' || status === 'reintegrate' || status === 'archived');
  }
    
    return matchesSearch;
  });
  
  const handleCaseAdded = (newCase) => {
    // Ensure the new case has 'active' status
    const caseWithActiveStatus = { ...newCase, status: 'active' };
    addCase(caseWithActiveStatus);
    setShowAddForm(false);
  };
  
  const handleCaseUpdated = (updatedCase) => {
    console.log('Case updated:', updatedCase);
    updateCase(updatedCase);
    setEditCase(null);
    
  // If the case was archived, switch to the Archived tab
  if ((updatedCase.status || '').toLowerCase() === 'archives' || 
      (updatedCase.status || '').toLowerCase() === 'reintegrate' ||
      (updatedCase.status || '').toLowerCase() === 'archived') {
    setActiveTab('Archived');
  }
  };
  
  // Add a function to handle case deletion
  // Modify the delete handler to show confirmation UI instead of window.confirm
  const handleCaseDelete = async (caseId) => {
    try {
      console.log('Attempting to delete case with ID:', caseId);
      
      // Make sure we have the token in headers for this request
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Store the case being deleted for potential restoration
      const caseToDelete = cases.find(c => c.id === caseId);
      
      // Update UI immediately for better user experience
      deleteCase(caseId);
      setDeleteConfirmation(null);
      
      try {
        // Make the API call
        const response = await axios.delete(`http://localhost:5000/api/cases/${caseId}`);
        console.log('Delete response:', response);
        
        // If we get here, the delete was successful
        console.log('Case successfully deleted on server');
      } catch (apiError) {
        console.error('API error:', apiError);
        
        // If the API call fails, restore the case in the UI
        if (caseToDelete) {
          console.log('Restoring case in UI due to API error');
          addCase(caseToDelete);
          
          // Show specific error message
          let errorMessage = 'Failed to delete case on server. The case has been restored.';
          
          if (apiError.response) {
            console.error('Error response:', apiError.response.data);
            console.error('Error status:', apiError.response.status);
            
            if (apiError.response.status === 401 || apiError.response.status === 403) {
              errorMessage = 'You are not authorized to delete this case.';
            } else if (apiError.response.status === 404) {
              // For 404 errors, show a more specific message
              errorMessage = 'The backend API does not support case deletion yet. Please implement the DELETE endpoint.';
              // Keep the case deleted in the UI for better UX
              deleteCase(caseId);
            } else if (apiError.response.data && apiError.response.data.message) {
              errorMessage = apiError.response.data.message;
            }
          } else if (apiError.request) {
            errorMessage = 'No response from server. Please check your connection.';
          }
          
          alert(errorMessage);
        }
      }
    } catch (err) {
      console.error('Error in delete handler:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  };
  
  // Function to show delete confirmation
  const confirmDelete = (caseItem) => {
    setDeleteConfirmation(caseItem);
  };
  
  if (showAddForm) {
    return <AddCaseForm onClose={() => setShowAddForm(false)} onCaseAdded={handleCaseAdded} />;
  }

  if (editCase) {
    return <EditCaseForm caseData={editCase} onClose={() => setEditCase(null)} onCaseUpdated={handleCaseUpdated} />;
  }
  
  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#7CB9F3', minHeight: '96vh', position: 'relative' }}>
      {/* Delete confirmation modal */}
      {deleteConfirmation && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" 
             style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="card shadow-sm p-4 mx-2" style={{ maxWidth: '400px' }}>
            <div className="text-center mb-3">
              <i className="fas fa-exclamation-triangle text-warning" style={{ fontSize: '2rem' }}></i>
              <h5 className="mt-2">Delete Confirmation</h5>
            </div>
            <p className="text-center">
              Are you sure you want to delete the case for <strong>{deleteConfirmation.name}</strong>?
              <br />
              <small className="text-muted">This action cannot be undone.</small>
            </p>
            <div className="d-flex justify-content-center gap-2 mt-3">
              <button 
                className="btn btn-outline-secondary" 
                onClick={() => setDeleteConfirmation(null)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={() => handleCaseDelete(deleteConfirmation.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="tabs-container d-flex" style={{ gap: '10px' }}>
          {tabs.map(tab => (
            <button 
              key={tab} 
              className="btn py-2 px-3"
              onClick={() => setActiveTab(tab)}
              style={{ 
                backgroundColor: activeTab === tab ? '#fff' : 'transparent',
                color: activeTab === tab ? '#000' : '#fff',
                border: '1px solid #fff',
                borderRadius: '20px',
                fontWeight: '500',
                fontSize: '14px'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <button 
          className="btn btn-light px-3 py-1" 
          style={{ 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            fontWeight: '500',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            borderRadius: '4px',
            width: 'auto',
            minWidth: '120px'
          }}
          onClick={() => setShowAddForm(true)}
        >
          <span style={{ fontSize: '16px' }}>+</span> Add New Case
        </button>
      </div>
      
      <div className="card border-0 shadow-sm rounded-4 bg-white mt-4">
        <div className="card-body p-3">
          <div className="row mb-4 align-items-center">
            <div className="col-md-6">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white border-end-0">
                  <i className="fas fa-search text-muted"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control border-start-0"
                  placeholder="Search..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select form-select-sm">
                <option value="">All Programs</option>
                <option value="children">Children</option>
                <option value="youth">Youth</option>
                <option value="sanctuary">Sanctuary</option>
                <option value="crisis">Crisis Intervention</option>
              </select>
            </div>
            <div className="col-md-3">
              <select className="form-select form-select-sm">
                <option value="">All Ages</option>
                <option value="0-10">0-10</option>
                <option value="11-15">11-15</option>
                <option value="16-18">16-18</option>
              </select>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading cases...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover bg-white rounded-3">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Age</th>
                    <th>Program</th>
                    <th>Status</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        No cases found. Click "Add New Case" to create one.
                      </td>
                    </tr>
                  ) : (
                    filteredCases.map(caseItem => (
                      <tr key={caseItem.id}>
                        <td>{caseItem.name}</td>
                        <td>{caseItem.age}</td>
                        <td>{caseItem.programType}</td>
                        <td>
                          <span className="status-indicator me-2" 
                            style={{ 
                              backgroundColor: ['archives','reintegrate','archived'].includes(String(caseItem.status || '').toLowerCase()) ? '#38B000' : '#7cb9f3',
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              display: 'inline-block'
                            }}
                          />
                          <span className={`badge ${['archives','reintegrate','archived'].includes(String(caseItem.status || '').toLowerCase()) ? 'bg-success' : 'bg-primary'}`}>
                            {['archives','reintegrate','archived'].includes(String(caseItem.status || '').toLowerCase()) ? 'Archived' : caseItem.status || 'Active'}
                          </span>
                        </td>
                        <td>{caseItem.lastUpdated && new Date(caseItem.lastUpdated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <button 
                              className="btn btn-sm btn-outline-primary rounded-circle p-1" 
                              style={{ width: '28px', height: '28px' }}
                              onClick={() => setEditCase(caseItem)}
                            >
                              <i className="fas fa-edit" style={{ fontSize: '12px' }}></i>
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-danger rounded-circle p-1" 
                              style={{ width: '28px', height: '28px' }}
                              onClick={() => confirmDelete(caseItem)}
                            >
                              <i className="fas fa-trash" style={{ fontSize: '12px' }}></i>
                            </button>
            {['archives','reintegrate'].includes(String(caseItem.status || '').toLowerCase()) && (
              <button 
                className="btn btn-sm btn-success rounded-pill p-1 px-2"
                style={{ fontSize: '10px' }}
                onClick={() => setActiveTab('Archived')}
              >
                <i className="fas fa-check me-1" style={{ fontSize: '10px' }}></i>
                Archived
              </button>
            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Floating Action Button */}
      <button 
        className="btn btn-primary rounded-circle position-fixed"
        style={{
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          fontSize: '24px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={() => setShowAddForm(true)}
        title="Add New Case"
      >
        <i className="fas fa-plus"></i>
      </button>
      

    </div>
  );
};

export default CaseManagement;