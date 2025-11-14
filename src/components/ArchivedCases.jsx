import React, { useState, useEffect } from 'react';
import { useCases } from '../context/CaseContext';
import { isArchivedStatus, getArchivedDisplayText } from '../utils/statusHelpers';
import Pagination from './Pagination';
import CaseDetailsModal from './CaseDetailsModal';
import { downloadCaseReportPDF, downloadAllCasesPDF } from '../utils/pdfGenerator';
import { downloadCaseReportWord, downloadAllCasesWord } from '../utils/wordGenerator';
import { downloadAllCasesCSV, downloadCaseReportCSV } from '../utils/csvGenerator';
import { fetchCaseDetailsForExport } from '../utils/exportHelpers';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../utils/apiBase';

const ArchivedCases = () => {
  const { allCases, loading, error, lastUpdate, fetchAllCases, updateCase } = useCases();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterAge, setFilterAge] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showCaseDetailsModal, setShowCaseDetailsModal] = useState(false);
  const [selectedCaseForArchive, setSelectedCaseForArchive] = useState(null);

  // Fetch all cases on component mount
  useEffect(() => {
    if (allCases.length === 0) {
      fetchAllCases();
    }
  }, [fetchAllCases, allCases.length]);

  // Filter only archived cases using the proper status helper from all cases
  const archivedCases = allCases.filter(caseItem => {
    return isArchivedStatus(caseItem.status);
  });
  
  // Filter archived cases based on search term, program, and age
  const filteredArchivedCases = archivedCases.filter(caseItem => {
    const searchLower = (searchTerm || '').toLowerCase();
    const matchesSearch = !searchLower ||
      (caseItem.name && caseItem.name.toLowerCase().includes(searchLower)) ||
      (caseItem.firstName && caseItem.firstName.toLowerCase().includes(searchLower)) ||
      (caseItem.lastName && caseItem.lastName.toLowerCase().includes(searchLower));
    
    const matchesProgram = !filterProgram || caseItem.program === filterProgram || caseItem.programType === filterProgram;
    
    const matchesAge = (() => {
      if (!filterAge) return true;
      const age = parseInt(caseItem.age);
      if (isNaN(age)) return false;
      
      switch (filterAge) {
        case '0-5':
          return age >= 0 && age <= 5;
        case '6-12':
          return age >= 6 && age <= 12;
        case '13-17':
          return age >= 13 && age <= 17;
        case '18+':
          return age >= 18;
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesProgram && matchesAge;
  });

  // Sort archived cases by lastUpdated (most recent first)
  const sortedArchivedCases = [...filteredArchivedCases].sort((a, b) => {
    const dateA = new Date(a.lastUpdated || a.archivedDate || a.timestamp || 0);
    const dateB = new Date(b.lastUpdated || b.archivedDate || b.timestamp || 0);
    return dateB - dateA;
  });

  // Calculate pagination for archived cases only
  const totalItems = sortedArchivedCases.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedArchivedCases = sortedArchivedCases.slice(startIndex, endIndex);

  // One-shot page reset when navigated here after archive; rely on context update for data
  useEffect(() => {
    if (location?.state?.triggerRefresh) {
      setCurrentPage(1);
    }
  }, [location?.state?.triggerRefresh]);

  // Real-time update: respond to changes in lastUpdate without refetching
  useEffect(() => {
    console.log('ArchivedCases: Real-time update triggered', lastUpdate);
  }, [lastUpdate]);


  
  // Helper functions for formatting and status (matching CaseManagement)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  // Removed duplicate pagination block; using pagination based on sortedArchivedCases defined above

  // Pagination handlers for archived cases only
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Navigate to case details page
  const handleViewCase = (caseId) => {
    navigate(`/case-details/${caseId}`);
  };

  // Change status from Discharged to After Care
  const handleMoveToAfterCare = async (caseItem) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        alert('Authentication required');
        return;
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
          'Authorization': `Bearer ${token}`
        }
      };

      const fullDetails = await fetchCaseDetailsForExport(caseItem.id);
      if (!fullDetails) {
        alert('Unable to fetch full case details.');
        return;
      }

      const updatedCaseData = {
        firstName: fullDetails.first_name,
        lastName: fullDetails.last_name,
        middleName: fullDetails.middle_name,
        sex: fullDetails.sex,
        birthdate: fullDetails.birthdate,
        status: 'after care',
        religion: fullDetails.religion,
        address: fullDetails.address,
        sourceOfReferral: fullDetails.source_of_referral,
        caseType: fullDetails.case_type,
        programType: fullDetails.program_type,
        problemPresented: fullDetails.problem_presented,
        briefHistory: fullDetails.brief_history,
        economicSituation: fullDetails.economic_situation,
        medicalHistory: fullDetails.medical_history,
        familyBackground: fullDetails.family_background,
        clientDescription: fullDetails.client_description,
        parentsDescription: fullDetails.parents_description,
        recommendation: fullDetails.recommendation,
        assessment: fullDetails.assessment,
        checklist: fullDetails.checklist,
        lastUpdated: new Date().toISOString()
      };

      const response = await axios.put(
        `${API_BASE}/cases/${caseItem.id}`,
        updatedCaseData,
        config
      );

      const calculateAge = (birthdate) => {
        if (!birthdate) return 'N/A';
        const today = new Date();
        const birth = new Date(birthdate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age -= 1;
        }
        return age;
      };

      const updatedCase = {
        id: response.data.id,
        name: `${response.data.first_name} ${response.data.last_name}`,
        age: calculateAge(response.data.birthdate),
        programType: response.data.program_type,
        status: 'after care',
        lastUpdated: response.data.last_updated || response.data.updated_at || new Date().toISOString(),
        profile_picture: response.data.profile_picture
      };

      updateCase(updatedCase);
      // Navigate to After Care page for immediate feedback
      navigate('/after-care', { state: { triggerRefresh: true } });
    } catch (err) {
      console.error('Error moving case to After Care:', err);
      alert(err.response?.data?.message || 'Failed to move case to After Care');
    }
  };

  const handleCloseArchiveModal = () => {
    setShowCaseDetailsModal(false);
    setSelectedCaseForArchive(null);
  };

  const handleConfirmArchive = (caseId) => {
    const caseToArchive = allCases.find(c => c.id === caseId);
    if (caseToArchive) {
      const updatedCase = {
        ...caseToArchive,
        status: 'archives',
        archivedDate: new Date().toISOString()
      };
      updateCase(updatedCase);
      handleCloseArchiveModal();
      
      // Note: No need to manually update allCases state as updateCase in CaseContext handles this
    }
  };

  // Export single case to PDF
  const exportSingleCaseToPDF = async (caseItem) => {
    const fullDetails = await fetchCaseDetailsForExport(caseItem.id);
    const caseData = fullDetails || caseItem;
    // Use the professional PDF generator instead of basic jsPDF
    await downloadCaseReportPDF(caseData);
  };

  // Export single case to Word
  const exportSingleCaseToWord = async (caseItem) => {
    try {
      const fullDetails = await fetchCaseDetailsForExport(caseItem.id);
      const caseData = fullDetails || caseItem;
      await downloadCaseReportWord(caseData);
    } catch (err) {
      console.error('Error generating Word document:', err);
      alert('Failed to generate Word document. Please try again.');
    }
  };

  // Export single case to CSV
  const exportSingleCaseToCSV = async (caseItem) => {
    try {
      const fullDetails = await fetchCaseDetailsForExport(caseItem.id);
      const caseData = fullDetails || caseItem;
      await downloadCaseReportCSV(caseData);
    } catch (error) {
      console.error('Error generating CSV:', error);
      alert('Error generating CSV. Please try again.');
    }
  };

  // PDF Export Function with comprehensive case information
  const exportToPDF = () => {
    if (filteredArchivedCases.length === 0) {
      alert('No archived cases to export');
      return;
    }

    // Consolidated professional summary PDF for archived cases
    (async () => {
      const fullCases = await Promise.all(
        filteredArchivedCases.map(async (c) => {
          const details = await fetchCaseDetailsForExport(c.id);
          return details || c;
        })
      );
      await downloadAllCasesPDF(fullCases);
      alert(`Successfully exported ${fullCases.length} archived cases summary as PDF`);
    })();
  };

  // Word Export Function for all archived cases
  const exportToWord = async () => {
    if (filteredArchivedCases.length === 0) {
      alert('No archived cases to export');
      return;
    }

    try {
      console.log('Starting consolidated Word export for archived cases...');
      const fullCases = await Promise.all(
        filteredArchivedCases.map(async (c) => {
          const details = await fetchCaseDetailsForExport(c.id);
          return details || c;
        })
      );
      await downloadAllCasesWord(fullCases);
      console.log('Archived cases summary Word exported successfully');
      alert(`Successfully exported ${fullCases.length} archived cases summary as Word`);
    } catch (error) {
      console.error('Error exporting Word documents:', error);
      alert('Error exporting Word documents. Please try again.');
    }
  };

  // CSV Export Function using centralized utility
  const exportToCSV = async () => {
    if (filteredArchivedCases.length === 0) {
      alert('No archived cases to export');
      return;
    }

    try {
      console.log('Starting CSV export for all archived cases...');
      const fullCases = await Promise.all(
        filteredArchivedCases.map(async (c) => {
          const details = await fetchCaseDetailsForExport(c.id);
          return details || c;
        })
      );
      await downloadAllCasesCSV(fullCases);
      console.log('All archived cases exported to CSV successfully');
      alert(`Successfully exported ${filteredArchivedCases.length} archived cases to CSV`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting CSV. Please try again.');
    }
  };



  // Removed global discharged export handlers (ignoring filters)



  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        Error loading discharged cases: {error}
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <h2 className="mb-4 border-bottom pb-3 text-dark">Discharged Cases ({archivedCases.length})</h2>
      <div className="d-flex justify-content-end mb-3">
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
            title="Export all discharged cases"
          >
            <i className="fas fa-download me-1"></i>Export All
          </button>
          <ul className="dropdown-menu" aria-labelledby="exportAllDropdown">
            <li>
              <button className="dropdown-item" onClick={exportToPDF}>
                <i className="fas fa-file-pdf me-2"></i>Export All to PDF
              </button>
            </li>
            <li>
              <button className="dropdown-item" onClick={exportToWord}>
                <i className="fas fa-file-word me-2"></i>Export All to Word
              </button>
            </li>
            <li>
              <button className="dropdown-item" onClick={exportToCSV}>
                <i className="fas fa-file-csv me-2"></i>Export All to CSV
              </button>
            </li>
            {/* Removed global "All Discharged (Ignoring filters)" export options */}
          </ul>
        </div>
      </div>
      
      {/* Controls Section */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="row g-3">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Search discharged cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  padding: '10px 15px'
                }}
              />
            </div>
            <div className="col-md-4">
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
            <div className="col-md-4">
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
                    <i className="fas fa-tags me-2 text-primary"></i>Status
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
                {filteredArchivedCases.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5">
                      <i className="fas fa-archive fa-3x mb-3 text-muted"></i>
                      <br />
                      <span className="text-muted">
                        {searchTerm ? 'No discharged cases match your search criteria.' : 'No discharged cases found.'}
                      </span>
                    </td>
                  </tr>
                ) : (
                  paginatedArchivedCases.map((caseItem, index) => (
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
                          <div 
                            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
                            style={{ width: '40px', height: '40px', fontSize: '16px', fontWeight: 'bold' }}
                          >
                            {caseItem.name ? caseItem.name.charAt(0).toUpperCase() : 'N'}
                          </div>
                          <div>
                            <div className="fw-semibold text-dark">{caseItem.name || 'No Name'}</div>
                            {caseItem.admissionMonth && (
                              <small className="text-info d-block">Admission: {caseItem.admissionMonth}</small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span 
                          className="badge rounded-pill px-3 py-2"
                          style={{ 
                            backgroundColor: '#1e3a8a',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          {caseItem.age || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge bg-info text-dark px-3 py-2 rounded-pill">
                          <i className="fas fa-briefcase me-1"></i>
                          {caseItem.program || caseItem.programType || 'No Program'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge bg-secondary text-white px-3 py-2 rounded-pill">
                          {getArchivedDisplayText(caseItem.status) || 'Discharged'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-dark">
                          <i className="fas fa-calendar-alt me-2 text-muted"></i>
                          {formatDate(caseItem.lastUpdated)}
                        </div>
                        <small className="text-muted">
                          {formatTime(caseItem.lastUpdated)}
                        </small>
                      </td>
                      <td className="px-4 py-3">
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => handleViewCase(caseItem.id)}
                            style={{
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <i className="fas fa-eye me-1"></i>View Details
                          </button>
                          {String(caseItem.status || '').toLowerCase() !== 'after care' && String(caseItem.status || '').toLowerCase() !== 'aftercare' && (
                            <button
                              className="btn btn-outline-warning btn-sm"
                              onClick={() => handleMoveToAfterCare(caseItem)}
                              title="Move to After Care"
                              style={{
                                borderRadius: '6px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <i className="fas fa-hands-helping me-1"></i>After Care
                            </button>
                          )}
                          <div className="dropdown">
                            <button
                              className="btn btn-outline-success btn-sm dropdown-toggle"
                              type="button"
                              id={`exportDropdown-${caseItem.id}`}
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                              title="Export case"
                              style={{
                                borderRadius: '6px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                transition: 'all 0.2s ease'
                              }}
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
                                    exportSingleCaseToPDF(caseItem);
                                  }}
                                >
                                  <i className="fas fa-file-pdf me-2"></i>PDF
                                </button>
                              </li>
                              <li>
                                <button 
                                  className="dropdown-item" 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    exportSingleCaseToWord(caseItem);
                                  }}
                                >
                                  <i className="fas fa-file-word me-2"></i>Word
                                </button>
                              </li>
                              <li>
                                <button 
                                  className="dropdown-item" 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    exportSingleCaseToCSV(caseItem);
                                  }}
                                >
                                  <i className="fas fa-file-csv me-2"></i>CSV
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

      {/* Pagination */}
      {filteredArchivedCases.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}

      {/* Archive Confirmation Modal */}
      {showCaseDetailsModal && selectedCaseForArchive && (
        <CaseDetailsModal
          show={showCaseDetailsModal}
          onHide={handleCloseArchiveModal}
          onConfirmArchive={handleConfirmArchive}
          caseData={selectedCaseForArchive}
        />
      )}
    </div>
  );
};

export default ArchivedCases;