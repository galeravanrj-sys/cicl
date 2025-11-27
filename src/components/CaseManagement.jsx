import React, { useState, useContext, useEffect } from 'react';
import { useCases } from '../context/CaseContext';
import AddCaseForm from './AddCaseForm';
import EditCaseForm from './EditCaseForm';
import CaseDetailsModal from './CaseDetailsModal';
import { downloadAllCasesPDFFromWord } from '../utils/wordGenerator';
import { downloadAllCasesCSV, downloadCaseReportCSV } from '../utils/csvGenerator';
import { downloadIntakeFormWord, downloadIntakeFormPDF, downloadAllCasesWord } from '../utils/wordGenerator';
import { fetchCaseDetailsForExport } from '../utils/exportHelpers';
import { API_BASE } from '../utils/apiBase';

import { isArchivedStatus } from '../utils/statusHelpers';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';


const CaseManagement = () => {
  const { 
    cases, 
    loading, 
    error, 
    addCase, 
    updateCase, 
    deleteCase
  } = useCases();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const isAdmin = ((user?.role || '').toLowerCase()).includes('admin');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterAge, setFilterAge] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const prog = params.get('program');
    if (prog) setFilterProgram(prog);
  }, [location.search]);

  
  const [editCase, setEditCase] = useState(null);
  const [showCaseDetailsModal, setShowCaseDetailsModal] = useState(false);
  const [selectedCaseForArchive, setSelectedCaseForArchive] = useState(null);

  // Helper functions for random data generation (keeping for compatibility)
  // eslint-disable-next-line no-unused-vars
  const getRandomMonth = () => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[Math.floor(Math.random() * months.length)];
  };

  // eslint-disable-next-line no-unused-vars
  const getRandomDateInMonth = (month) => {
    const daysInMonth = { January: 31, February: 28, March: 31, April: 30, May: 31, June: 30,
                         July: 31, August: 31, September: 30, October: 30, November: 30, December: 31 };
    const day = Math.floor(Math.random() * daysInMonth[month]) + 1;
    return `${month} ${day}`;
  };

  const handleCaseAdded = (newCase) => {
    console.log('Adding new case to context:', newCase);
    addCase(newCase);
    setShowAddForm(false);
  };

  const handleCaseUpdated = (updatedCase) => {
    setEditCase(null);
  };



  const handleExportAllPDF = async () => {
    if (sortedCases.length === 0) {
      alert('No cases to export');
      return;
    }
    try {
      const payload = await Promise.all(sortedCases.map(async (c) => {
        const full = await fetchCaseDetailsForExport(c.id);
        return full || c;
      }));
      await downloadAllCasesPDFFromWord(payload);
    } catch (error) {
      console.error('Error exporting PDFs:', error);
    }
  };

  const handleExportAllWord = async () => {
    if (sortedCases.length === 0) {
      alert('No cases to export');
      return;
    }
    try {
      const payload = await Promise.all(sortedCases.map(async (c) => {
        const full = await fetchCaseDetailsForExport(c.id);
        return full || c;
      }));
      await downloadAllCasesWord(payload);
    } catch (error) {
      console.error('Error exporting Word:', error);
    }
  };


  // Handle Export All CSV function
  const handleExportAllCSV = async () => {
    if (sortedCases.length === 0) {
      console.info('No cases to export');
      return;
    }

    try {
      console.log('Starting CSV export for all cases...');
      const fullCases = await Promise.all(
        sortedCases.map(async (c) => {
          const details = await fetchCaseDetailsForExport(c.id);
          return details || c;
        })
      );
      await downloadAllCasesCSV(fullCases);
      console.log('All cases exported to CSV successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  // Removed global "All Cases (Ignoring filters)" export handlers

  // Removed Word export handlers
  
  // Helper functions for formatting and status
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

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
  
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };
  
  const handleEdit = (caseItem) => {
    setEditCase(caseItem);
  };
  
  const handleCloseArchiveModal = () => {
    setShowCaseDetailsModal(false);
    setSelectedCaseForArchive(null);
  };

  const handleConfirmArchive = async (caseId) => {
    try {
      const caseToArchive = cases.find(c => c.id === caseId);
      if (!caseToArchive) {
        console.error('Case not found for archiving');
        return;
      }

      // Get token for API call
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        return;
      }

      // Update case status to archived
      const updatedCase = {
        ...caseToArchive,
        status: 'archives',
        archivedDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      // Make API call to update the case
      const response = await fetch(`${API_BASE}/cases/${caseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(updatedCase)
      });

      if (response.ok) {
        // Update the case in the context - this will update both cases and allCases
        updateCase(updatedCase);
        
        // Ensure the global list is refreshed so ArchivedCases sees the change immediately
        // await fetchAllCases();
        
        // Redirect to Archived Cases for immediate feedback
        navigate('/archived-cases', { state: { triggerRefresh: true } });
        
        console.log('Case archived successfully - will be filtered out from active view');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to archive case:', errorData);
        alert(`Failed to archive case: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error archiving case:', error);
      alert('Error archiving case. Please try again.');
    } finally {
      handleCloseArchiveModal();
    }
  };

  // Filter cases based on search term and filters (client-side filtering for current page)
  const filteredCases = cases.filter(caseItem => {
    console.log('Filtering case:', caseItem.id, 'Status:', caseItem.status, 'Name:', caseItem.name);
    
    const matchesSearch = caseItem.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProgram = !filterProgram || caseItem.programType === filterProgram;
    
    let matchesAge = true;
    if (filterAge) {
      const age = calculateAge(caseItem.birthdate);
      switch (filterAge) {
        case '0-5':
          matchesAge = age >= 0 && age <= 5;
          break;
        case '6-12':
          matchesAge = age >= 6 && age <= 12;
          break;
        case '13-17':
          matchesAge = age >= 13 && age <= 17;
          break;
        case '18+':
          matchesAge = age >= 18;
          break;
        default:
          matchesAge = true;
      }
    }
    
    const isNotArchived = !isArchivedStatus(caseItem.status);
    console.log('Case', caseItem.id, 'isNotArchived:', isNotArchived, 'status:', caseItem.status);
    
    const shouldInclude = matchesSearch && matchesProgram && matchesAge && isNotArchived;
    console.log('Case', caseItem.id, 'shouldInclude:', shouldInclude);
    
    return shouldInclude;
  });

  // Sort cases by last updated (most recent first)
  const sortedCases = filteredCases.sort((a, b) => {
    const dateA = new Date(a.lastUpdated || a.timestamp || 0);
    const dateB = new Date(b.lastUpdated || b.timestamp || 0);
    return dateB - dateA;
  });


  // eslint-disable-next-line no-unused-vars
  const handleArchive = (caseItem) => {
    setSelectedCaseForArchive(caseItem);
    setShowCaseDetailsModal(true);
  };

  // eslint-disable-next-line no-unused-vars
  const handleDelete = async (caseId) => {
    if (window.confirm('Are you sure you want to delete this case? This action cannot be undone.')) {
      try {
        await deleteCase(caseId);
      } catch (error) {
        console.error('Error deleting case:', error);
        alert('Error deleting case. Please try again.');
      }
    }
  };

  const handleDownloadPDF = async (caseItem) => {
    try {
      const fullDetails = await fetchCaseDetailsForExport(caseItem.id);
      const caseData = fullDetails || caseItem;
      await downloadIntakeFormPDF(caseData);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const handleDownloadWord = async (caseItem) => {
    try {
      const fullDetails = await fetchCaseDetailsForExport(caseItem.id);
      const caseData = fullDetails || caseItem;
      await downloadIntakeFormWord(caseData);
    } catch (error) {
      console.error('Error downloading Word:', error);
      alert('Error generating Word. Please try again.');
    }
  };

  const handleDownloadCSV = async (caseItem) => {
    try {
      const fullDetails = await fetchCaseDetailsForExport(caseItem.id);
      const caseData = fullDetails || caseItem;
      await downloadCaseReportCSV(caseData);
    } catch (error) {
      console.error('Error generating CSV:', error);
    }
  };

  // Removed: previewServerHtmlPdf

  // Removed: previewServerTemplatePdf

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        Error loading cases: {error}
      </div>
    );
  }
  
  if (showAddForm) {
    return <AddCaseForm onClose={() => setShowAddForm(false)} onCaseAdded={handleCaseAdded} />;
  }

  if (editCase) {
    return <EditCaseForm caseData={editCase} onClose={() => setEditCase(null)} onCaseUpdated={handleCaseUpdated} />;
  }
  
  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <h2 className="mb-4 border-bottom pb-3 text-dark">Cases List</h2>
      
      {/* Controls Section */}
      <div className="row mb-4">
        <div className="col-md-8">
          <div className="row g-3">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Search cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  padding: '10px 15px'
                }}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={filterProgram}
                onChange={(e) => setFilterProgram(e.target.value)}
                style={{
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  padding: '10px 15px'
                }}
              >
                <option value="">All Programs</option>
                <option value="Children">Children</option>
                <option value="Youth">Youth</option>
                <option value="Sanctuary">Sanctuary</option>
                <option value="Crisis Intervention">Crisis Intervention</option>
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={filterAge}
                onChange={(e) => setFilterAge(e.target.value)}
                style={{
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  padding: '10px 15px'
                }}
              >
                <option value="">All Ages</option>
                <option value="0-5">0-5 years</option>
                <option value="6-12">6-12 years</option>
                <option value="13-17">13-17 years</option>
                <option value="18+">18+ years</option>
              </select>
            </div>
          </div>
        </div>
        <div className="col-md-4 text-end">
          <div className="d-inline-flex gap-2">
            <div className="dropdown">
              <button
                className="btn btn-warning btn-sm dropdown-toggle"
                type="button"
                id="exportAllDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontWeight: '500',
                  border: 'none',
                  backgroundColor: '#ffc107',
                  color: '#212529',
                  transition: 'all 0.3s ease',
                  fontSize: '14px'
                }}
                title="Export All Cases"
              >
                <i className="fas fa-download me-1"></i>Export All
              </button>
              <ul className="dropdown-menu" aria-labelledby="exportAllDropdown">
                <li>
                  <button 
                    className="dropdown-item" 
                    onClick={handleExportAllPDF}
                  >
                    <i className="fas fa-file-pdf me-2"></i>Export All as PDF
                  </button>
                </li>
                <li>
                  <button 
                    className="dropdown-item" 
                    onClick={handleExportAllCSV}
                  >
                    <i className="fas fa-file-csv me-2"></i>Export All as CSV
                  </button>
                </li>
                <li>
                  <button 
                    className="dropdown-item" 
                    onClick={handleExportAllWord}
                  >
                    <i className="fas fa-file-word me-2"></i>Export All as Word
                  </button>
                </li>
              </ul>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowAddForm(true)}
              style={{
                borderRadius: '6px',
                padding: '8px 12px',
                fontWeight: '500',
                border: 'none',
                backgroundColor: '#007bff',
                transition: 'all 0.3s ease',
                fontSize: '14px'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
            >
              <i className="fas fa-plus me-1"></i>Add Case
            </button>
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="card border-0 rounded-4 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  <th className="px-4 py-3 text-dark fw-bold">
                    <i className="fas fa-user me-2 text-primary"></i>Name
                  </th>
                  <th className="px-4 py-3 text-dark fw-bold">
                    <i className="fas fa-birthday-cake me-2 text-primary"></i>Age
                  </th>
                  <th className="px-4 py-3 text-dark fw-bold">
                    <i className="fas fa-briefcase me-2 text-primary"></i>Program
                  </th>
                  <th className="px-4 py-3 text-dark fw-bold">
                    <i className="fas fa-calendar me-2 text-primary"></i>Last Updated
                  </th>
                  <th className="px-4 py-3 text-dark fw-bold">
                    <i className="fas fa-cogs me-2 text-primary"></i>Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedCases.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5">
                      <i className="fas fa-inbox fa-3x mb-3 text-muted"></i>
                      <br />
                      <span className="text-muted">No cases found. Click "Add Case" to create one.</span>
                    </td>
                  </tr>
                ) : (
                  sortedCases.map((caseItem, index) => (
                    <tr 
                      key={caseItem.id || index}
                      style={{
                        borderBottom: '1px solid #eee',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center">
                          {(() => {
                            // Debug logging
                            console.log('Case:', caseItem.name, 'Profile Picture:', caseItem.profilePicture ? 'EXISTS' : 'MISSING');
                            if (caseItem.profilePicture) {
                              console.log('Profile picture length:', caseItem.profilePicture.length);
                              console.log('Profile picture starts with:', caseItem.profilePicture.substring(0, 50));
                            }
                            
                            return caseItem.profilePicture ? (
                              <img 
                                src={caseItem.profilePicture} 
                                alt={`${caseItem.name} profile`}
                                className="rounded-circle me-3"
                                style={{ 
                                  width: '40px', 
                                  height: '40px', 
                                  objectFit: 'cover',
                                  border: '2px solid #e9ecef'
                                }}
                                onError={(e) => {
                                  console.error('Image failed to load for:', caseItem.name);
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div 
                                className="rounded-circle me-3 d-flex align-items-center justify-content-center"
                                style={{ 
                                  width: '40px', 
                                  height: '40px', 
                                  backgroundColor: '#6c757d',
                                  color: 'white',
                                  fontSize: '16px',
                                  fontWeight: 'bold'
                                }}
                              >
                                {caseItem.name ? caseItem.name.charAt(0).toUpperCase() : '?'}
                              </div>
                            );
                          })()}
                          <div>
                            <div className="fw-bold text-dark">{caseItem.name || 'N/A'}</div>
                            <small className="text-muted">{caseItem.sex || 'N/A'}</small>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge bg-light text-dark border">
                          {(() => {
                            const age = calculateAge(caseItem.birthdate);
                            return age === 'N/A' ? 'N/A' : `${age} years old`;
                          })()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge bg-primary">
                          {caseItem.programType || caseItem.program || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-dark">{formatDate(caseItem.lastUpdated || caseItem.timestamp)}</div>
                          <small className="text-muted">{formatTime(caseItem.lastUpdated || caseItem.timestamp)}</small>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="btn-group" role="group">
                          {isAdmin && (
                            <button
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => handleEdit(caseItem)}
                              title="Edit Case"
                            >
                              <i className="fas fa-edit me-1"></i>Edit
                            </button>
                          )}
                          <div className="dropdown">
                            <button
                              className="btn btn-outline-success btn-sm dropdown-toggle"
                              type="button"
                              id={`exportDropdown-${caseItem.id}`}
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                              title="Export Case"
                            >
                              <i className="fas fa-download me-1"></i>Export
                            </button>
                            <ul className="dropdown-menu" aria-labelledby={`exportDropdown-${caseItem.id}`}>
                              <li>
                                <button 
                                  className="dropdown-item" 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDownloadPDF(caseItem);
                                  }}
                                >
                              <i className="fas fa-file-pdf me-2"></i>Export as PDF
                          </button>
                        </li>
                        <li>
                          <button 
                            className="dropdown-item" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDownloadWord(caseItem);
                            }}
                          >
                            <i className="fas fa-file-word me-2"></i>Export Word
                          </button>
                        </li>
                            <li>
                              <button 
                                className="dropdown-item" 
                                onClick={(e) => {
                                  e.preventDefault();
                                    e.stopPropagation();
                                    handleDownloadCSV(caseItem);
                                  }}
                                >
                                  <i className="fas fa-file-csv me-2"></i>Export as CSV
                                </button>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Case Details Modal for Archive Confirmation */}
      {showCaseDetailsModal && selectedCaseForArchive && (
        <CaseDetailsModal
          caseData={selectedCaseForArchive}
          onClose={handleCloseArchiveModal}
          onConfirmArchive={handleConfirmArchive}
          showArchiveButton={true}
        />
      )}
    </div>
  );
};

export default CaseManagement;
