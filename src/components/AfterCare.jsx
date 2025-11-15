import React, { useEffect, useState } from 'react';
import { useCases } from '../context/CaseContext';
import Pagination from './Pagination';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../utils/apiBase';
import { fetchCaseDetailsForExport } from '../utils/exportHelpers';

const AfterCare = () => {
  const { allCases, fetchAllCases, lastUpdate, updateCase } = useCases();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    if (allCases.length === 0) {
      fetchAllCases();
    }
  }, [fetchAllCases, allCases.length]);

  const isAfterCare = (status) => {
    const s = String(status || '').toLowerCase();
    return s === 'after care' || s === 'aftercare';
  };

  // Format a date string for UI display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Format a time string for UI display
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Only include cases currently in After Care
  const afterCareCases = allCases.filter(c => isAfterCare(c.status));

  // Sort by latest update first
  const sortedCases = [...afterCareCases].sort((a, b) => {
    const dateA = new Date(a.lastUpdated || a.timestamp || 0);
    const dateB = new Date(b.lastUpdated || b.timestamp || 0);
    return dateB - dateA;
  });

  // Pagination calculations
  const totalItems = sortedCases.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageItems = sortedCases.slice(startIndex, endIndex);

  // Update current page
  const handlePageChange = (p) => setCurrentPage(p);
  // Update page size and reset to first page
  const handleItemsPerPageChange = (n) => { setItemsPerPage(n); setCurrentPage(1); };
  // Navigate to After Care details page
  const handleViewCase = (caseId) => navigate(`/after-care/${caseId}`);

  // Discharge an After Care case back to archived (server + state + redirect)
  const handleDischarge = async (caseItem) => {
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
        status: 'archived',
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
        guardianName: fullDetails.guardian_name,
        guardianAge: fullDetails.guardian_age,
        guardianEducation: fullDetails.guardian_education,
        guardianOccupation: fullDetails.guardian_occupation,
        guardianOtherSkills: fullDetails.guardian_other_skills,
        guardianRelation: fullDetails.guardian_relation,
        guardianAddress: fullDetails.guardian_address,
        guardianIncome: fullDetails.guardian_income,
        guardianLiving: fullDetails.guardian_living,
        guardianDeceased: fullDetails.guardian_deceased,
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
        status: 'archived',
        lastUpdated: response.data.last_updated || response.data.updated_at || new Date().toISOString(),
        profile_picture: response.data.profile_picture
      };

      updateCase(updatedCase);
      navigate('/archived-cases', { state: { triggerRefresh: true } });
    } catch (err) {
      console.error('Error discharging case from After Care:', err);
      alert(err.response?.data?.message || 'Failed to discharge case');
    }
  };

  useEffect(() => {
    console.log('AfterCare: update', lastUpdate);
  }, [lastUpdate]);

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <h2 className="mb-4 border-bottom pb-3 text-dark">After Care ({totalItems})</h2>

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
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <i className="fas fa-hands-helping fa-3x mb-3 text-muted"></i>
                      <br />
                      <span className="text-muted">No After Care cases.</span>
                    </td>
                  </tr>
                ) : (
                  pageItems.map((c, idx) => (
                    <tr 
                      key={c.id || idx}
                      style={{ borderBottom: '1px solid #eee', transition: 'background-color 0.2s ease' }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center">
                          {(() => {
                            const pic = c.profilePicture || c.profile_picture;
                            return pic ? (
                              <img
                                src={pic}
                                alt={`${c.name || 'Case'} profile`}
                                className="rounded-circle me-3"
                                style={{ width: '40px', height: '40px', objectFit: 'cover', border: '2px solid #e9ecef' }}
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            ) : (
                              <div 
                                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
                                style={{ width: '40px', height: '40px', fontSize: '16px', fontWeight: 'bold' }}
                              >
                                {(c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'N').charAt(0).toUpperCase()}
                              </div>
                            );
                          })()}
                          <div>
                            <div className="fw-semibold text-dark">{c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'No Name'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span 
                          className="badge rounded-pill px-3 py-2"
                          style={{ backgroundColor: '#1e3a8a', color: 'white', fontSize: '12px', fontWeight: '500' }}
                        >
                          {c.age || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge bg-info text-dark px-3 py-2 rounded-pill">
                          <i className="fas fa-briefcase me-1"></i>
                          {c.program || c.programType || 'No Program'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge bg-secondary text-white px-3 py-2 rounded-pill">After Care</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-dark">
                          <i className="fas fa-calendar-alt me-2 text-muted"></i>
                          {formatDate(c.lastUpdated)}
                        </div>
                        <small className="text-muted">{formatTime(c.lastUpdated)}</small>
                      </td>
                      <td className="px-4 py-3">
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => handleViewCase(c.id)}
                            style={{ borderRadius: '6px', padding: '6px 12px', fontSize: '12px' }}
                          >
                            <i className="fas fa-eye me-1"></i>View Details
                          </button>
                          <button
                            className="btn btn-outline-warning btn-sm"
                            title="Discharge"
                            onClick={() => handleDischarge(c)}
                            style={{ borderRadius: '6px', padding: '6px 12px', fontSize: '12px' }}
                          >
                            <i className="fas fa-sign-out-alt me-1"></i>Discharge
                          </button>
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

      {totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}
    </div>
  );
};

export default AfterCare;