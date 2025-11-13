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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const afterCareCases = allCases.filter(c => isAfterCare(c.status));

  const sortedCases = [...afterCareCases].sort((a, b) => {
    const dateA = new Date(a.lastUpdated || a.timestamp || 0);
    const dateB = new Date(b.lastUpdated || b.timestamp || 0);
    return dateB - dateA;
  });

  const totalItems = sortedCases.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageItems = sortedCases.slice(startIndex, endIndex);

  const handlePageChange = (p) => setCurrentPage(p);
  const handleItemsPerPageChange = (n) => { setItemsPerPage(n); setCurrentPage(1); };
  const handleViewCase = (caseId) => navigate(`/case-details/${caseId}`);

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
      alert('Case discharged successfully');
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
    <div className="container-fluid">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="mb-0">After Care</h2>
        <div className="text-muted">Total: {totalItems}</div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="px-4 py-3 fw-bold">Name</th>
                  <th className="px-4 py-3 fw-bold">Age</th>
                  <th className="px-4 py-3 fw-bold">Program</th>
                  <th className="px-4 py-3 fw-bold">Status</th>
                  <th className="px-4 py-3 fw-bold">Last Updated</th>
                  <th className="px-4 py-3 fw-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      No After Care cases.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((c, idx) => (
                    <tr key={c.id || idx}>
                      <td className="px-4 py-3">
                        <div className="fw-semibold">{c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'No Name'}</div>
                      </td>
                      <td className="px-4 py-3">{c.age || 'N/A'}</td>
                      <td className="px-4 py-3">{c.program || c.programType || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span className="badge bg-secondary">After Care</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-dark">
                          <i className="fas fa-calendar-alt me-2 text-muted"></i>
                          {formatDate(c.lastUpdated)}
                        </div>
                        <small className="text-muted">
                          {formatTime(c.lastUpdated)}
                        </small>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => handleViewCase(c.id)}
                        >
                          <i className="fas fa-eye me-1"></i>View Details
                        </button>
                        <button
                          className="btn btn-warning btn-sm ms-2"
                          title="Discharge"
                          onClick={() => handleDischarge(c)}
                        >
                          <i className="fas fa-sign-out-alt me-1"></i>Discharge
                        </button>
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