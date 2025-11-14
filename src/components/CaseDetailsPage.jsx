import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../utils/apiBase';
import { useParams, useNavigate } from 'react-router-dom';
import { isArchivedStatus, getArchivedDisplayText } from '../utils/statusHelpers';

const CaseDetailsPage = () => {
  // Accept both 'caseId' and legacy 'id' param names
  const params = useParams();
  const caseId = params.caseId || params.id;
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCaseData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        if (!token) {
          setError('Authentication token not found. Please log in again.');
          return;
        }

        const response = await fetch(`${API_BASE}/cases/${caseId}`, {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const fullCaseData = await response.json();
          setCaseData(fullCaseData);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to fetch case data:', response.status, errorData);
          
          if (response.status === 401) {
            setError('Authentication failed. Please log in again.');
          } else if (response.status === 404) {
            setError('Case not found.');
          } else {
            setError(`Failed to load case details: ${errorData.message || 'Unknown error'}`);
          }
        }
      } catch (error) {
        console.error('Error fetching case data:', error);
        setError('Error loading case details. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    if (caseId) {
      fetchCaseData();
    }
  }, [caseId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const computeFullName = (data) => {
    const first = data.firstName || data.first_name || '';
    const middle = data.middleName || data.middle_name || '';
    const last = data.lastName || data.last_name || '';
    return [first, middle, last].filter(Boolean).join(' ').trim();
  };

  const parseAddressComponents = (addrRaw) => {
    if (!addrRaw || typeof addrRaw !== 'string') return { address: null, barangay: null, municipality: null, province: null };
    const address = addrRaw.trim();
    const parts = address.split(',').map(s => s.trim()).filter(Boolean);
    const province = parts.length >= 1 ? parts[parts.length - 1] : null;
    const municipality = parts.length >= 2 ? parts[parts.length - 2] : null;
    const barangay = parts.length >= 3 ? parts[parts.length - 3] : null;
    return { address, barangay, municipality, province };
  };

  const hasValue = (v) => v !== undefined && v !== null && String(v).trim() !== '';
  const renderField = (label, value, formatter) => {
    const v = formatter ? formatter(value) : value;
    if (!hasValue(v)) return null;
    return (
      <div className="mb-2">
        <strong>{label}:</strong>
        <div className="text-muted">{v}</div>
      </div>
    );
  };

  const computeAge = (dateString) => {
    if (!dateString) return null;
    const dob = new Date(dateString);
    if (Number.isNaN(dob.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    return age;
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading case details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="alert alert-danger text-center">
              <i className="fas fa-exclamation-triangle fa-2x mb-3"></i>
              <h5>Error Loading Case Details</h5>
              <p>{error}</p>
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/archived-cases')}
              >
                <i className="fas fa-arrow-left me-2"></i>
                Back to Discharged Cases
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="alert alert-warning text-center">
              <i className="fas fa-search fa-2x mb-3"></i>
              <h5>Case Not Found</h5>
              <p>The requested case could not be found.</p>
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/archived-cases')}
              >
                <i className="fas fa-arrow-left me-2"></i>
                Back to Discharged Cases
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isAfterCareStatus = () => {
    const s = String(caseData.status || '').toLowerCase();
    return s === 'after care' || s === 'aftercare';
  };

  if (isAfterCareStatus()) {
    return (<AfterCareDetails caseData={caseData} />);
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">
                <i className="fas fa-info-circle me-2 text-primary"></i>
                Case Details
              </h2>
              <p className="text-muted mb-0">Viewing details for case #{caseData.id}</p>
            </div>
            <button 
              className="btn btn-outline-primary"
              onClick={() => navigate('/archived-cases')}
            >
              <i className="fas fa-arrow-left me-2"></i>
              Back to Discharged Cases
            </button>
          </div>
        </div>
      </div>

      {/* Case Details Content */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 rounded-4 shadow-sm bg-white">
            <div className="card-body p-4">
              <div className="row">
                {/* Basic Information */}
                <div className="col-md-6 mb-4">
                  <div className="card h-100 border-0 rounded-4 shadow-sm bg-white">
                    <div className="card-header bg-primary text-white">
                      <h6 className="mb-0">
                        <i className="fas fa-user me-2"></i>
                        Basic Information
                      </h6>
                    </div>
                    <div className="card-body">
                      {renderField('Full Name', computeFullName(caseData) || caseData.name)}
                      {renderField('Nickname', caseData.nickname)}
                      {renderField('First Name', caseData.firstName || caseData.first_name)}
                      {renderField('Middle Name', caseData.middleName || caseData.middle_name)}
                      {renderField('Last Name', caseData.lastName || caseData.last_name)}
                      {renderField('Sex', caseData.sex)}
                      {renderField('Birthdate', caseData.birthdate || caseData.birth_date, formatDate)}
                      {renderField('Birthplace', caseData.birthplace)}
                      {renderField('Nationality', caseData.nationality)}
                      {renderField('Religion', caseData.religion)}
                      {hasValue(caseData.status) && (
                        <div className="mb-2">
                          <strong>Status:</strong>
                          <span className={`badge ${isArchivedStatus(caseData.status) ? 'bg-secondary' : 'bg-success'}`}>
                            {getArchivedDisplayText(caseData.status)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="col-md-6 mb-4">
                  <div className="card h-100 border-0 rounded-4 shadow-sm bg-white">
                    <div className="card-header bg-info text-white">
                      <h6 className="mb-0">
                        <i className="fas fa-map-marker-alt me-2"></i>
                        Address Information
                      </h6>
                    </div>
                    <div className="card-body">
                      {(() => {
                        const primaryAddr = caseData.presentAddress || caseData.present_address || caseData.address || caseData.provincialAddress || caseData.provincial_address;
                        const parsed = parseAddressComponents(primaryAddr);
                        return (
                          <>
                            {renderField('Address', parsed.address || caseData.address)}
                            {renderField('Barangay', parsed.barangay || caseData.barangay)}
                            {renderField('Municipality', parsed.municipality || caseData.municipality)}
                            {renderField('Province', parsed.province || caseData.province)}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Referral Information */}
                <div className="col-md-6 mb-4">
                  <div className="card h-100 border-0 rounded-4 shadow-sm bg-white">
                    <div className="card-header bg-warning text-dark">
                      <h6 className="mb-0">
                        <i className="fas fa-handshake me-2"></i>
                        Referral Information
                      </h6>
                    </div>
                    <div className="card-body">
                      {renderField('Source of Referral', caseData.sourceOfReferral || caseData.source_of_referral)}
                      {renderField('Other Source', caseData.otherSourceOfReferral || caseData.other_source_of_referral)}
                      {renderField('Date of Referral', caseData.dateOfReferral || caseData.date_of_referral, formatDate)}
                      {renderField('Address & Tel.', caseData.addressAndTel || caseData.address_and_tel)}
                      {renderField('Relation to Client', caseData.relationToClient || caseData.relation_to_client)}
                      {renderField('Assigned Home', caseData.assignedHouseParent || caseData.assigned_house_parent)}
                    </div>
                  </div>
                </div>

                {/* Program Information */}
                <div className="col-md-6 mb-4">
                  <div className="card h-100 border-0 rounded-4 shadow-sm bg-white">
                    <div className="card-header bg-success text-white">
                      <h6 className="mb-0">
                        <i className="fas fa-clipboard-list me-2"></i>
                        Program & Status
                      </h6>
                    </div>
                    <div className="card-body">
                      {renderField('Program Type', caseData.programType || caseData.program_type)}
                      {renderField('Admission Month', caseData.admissionMonth || caseData.admission_month)}
                      {renderField('Admission Year', caseData.admissionYear || caseData.admission_year)}
                      {renderField('Discharged Date', caseData.archivedDate || caseData.archived_date, formatDate)}
                    </div>
                  </div>
                </div>

                {/* Father Information */}
                <div className="col-md-6 mb-4">
                  <div className="card h-100 border-0 rounded-4 shadow-sm bg-white">
                    <div className="card-header bg-primary text-white">
                      <h6 className="mb-0">
                        <i className="fas fa-male me-2"></i>
                        Father Information
                      </h6>
                    </div>
                    <div className="card-body">
                      {renderField('Name', caseData.fatherName || caseData.father_name)}
                      {renderField('Age', caseData.fatherAge || caseData.father_age)}
                      {renderField('Education', caseData.fatherEducation || caseData.father_education)}
                      {renderField('Occupation', caseData.fatherOccupation || caseData.father_occupation)}
                      {renderField('Other Skills', caseData.fatherOtherSkills || caseData.father_other_skills)}
                      {renderField('Address', caseData.fatherAddress || caseData.father_address)}
                      {renderField('Income', caseData.fatherIncome || caseData.father_income)}
                      <div className="mb-2">
                        <strong>Living:</strong>
                        <div className="text-muted">
                          {typeof caseData.fatherLiving === 'boolean' 
                            ? (caseData.fatherLiving ? 'Yes' : 'No') 
                            : (typeof caseData.father_living === 'boolean' 
                              ? (caseData.father_living ? 'Yes' : 'No') 
                              : 'N/A')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mother Information */}
                <div className="col-md-6 mb-4">
                  <div className="card h-100 border-0 rounded-4 shadow-sm bg-white">
                    <div className="card-header bg-danger text-white">
                      <h6 className="mb-0">
                        <i className="fas fa-female me-2"></i>
                        Mother Information
                      </h6>
                    </div>
                    <div className="card-body">
                      {renderField('Name', caseData.motherName || caseData.mother_name)}
                      {renderField('Age', caseData.motherAge || caseData.mother_age)}
                      {renderField('Education', caseData.motherEducation || caseData.mother_education)}
                      {renderField('Occupation', caseData.motherOccupation || caseData.mother_occupation)}
                      {renderField('Other Skills', caseData.motherOtherSkills || caseData.mother_other_skills)}
                      {renderField('Address', caseData.motherAddress || caseData.mother_address)}
                      {renderField('Income', caseData.motherIncome || caseData.mother_income)}
                      <div className="mb-2">
                        <strong>Living:</strong>
                        <div className="text-muted">
                          {typeof caseData.motherLiving === 'boolean' 
                            ? (caseData.motherLiving ? 'Yes' : 'No') 
                            : (typeof caseData.mother_living === 'boolean' 
                              ? (caseData.mother_living ? 'Yes' : 'No') 
                              : 'N/A')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Guardian Information */}
                <div className="col-md-6 mb-4">
                  <div className="card h-100 border-0 rounded-4 shadow-sm bg-white">
                    <div className="card-header bg-secondary text-white">
                      <h6 className="mb-0">
                        <i className="fas fa-user-shield me-2"></i>
                        Guardian Information
                      </h6>
                    </div>
                    <div className="card-body">
                      {renderField('Name', caseData.guardianName || caseData.guardian_name)}
                      {renderField('Age', caseData.guardianAge || caseData.guardian_age)}
                      {renderField('Education', caseData.guardianEducation || caseData.guardian_education)}
                      {renderField('Occupation', caseData.guardianOccupation || caseData.guardian_occupation)}
                      {renderField('Other Skills', caseData.guardianOtherSkills || caseData.guardian_other_skills)}
                      {renderField('Relation to Client', caseData.guardianRelation || caseData.guardian_relation)}
                      {renderField('Address', caseData.guardianAddress || caseData.guardian_address)}
                    </div>
                  </div>
                </div>

                {/* Civil Status of Parents */}
                <div className="col-md-6 mb-4">
                  <div className="card h-100 border-0 rounded-4 shadow-sm bg-white">
                    <div className="card-header bg-dark text-white">
                      <h6 className="mb-0">
                        <i className="fas fa-heart me-2"></i>
                        Civil Status of Parents
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="mb-2">
                        <strong>Married in Church:</strong>
                        <div className="text-muted">
                          {typeof caseData.marriedInChurch === 'boolean' 
                            ? (caseData.marriedInChurch ? 'Yes' : 'No') 
                            : (typeof caseData.married_in_church === 'boolean' 
                              ? (caseData.married_in_church ? 'Yes' : 'No') 
                              : 'N/A')}
                        </div>
                      </div>
                      <div className="mb-2">
                        <strong>Live in Common Law:</strong>
                        <div className="text-muted">
                          {typeof caseData.liveInCommonLaw === 'boolean' 
                            ? (caseData.liveInCommonLaw ? 'Yes' : 'No') 
                            : (typeof caseData.live_in_common_law === 'boolean' 
                              ? (caseData.live_in_common_law ? 'Yes' : 'No') 
                              : 'N/A')}
                        </div>
                      </div>
                      <div className="mb-2">
                        <strong>Civil Marriage:</strong>
                        <div className="text-muted">
                          {typeof caseData.civilMarriage === 'boolean' 
                            ? (caseData.civilMarriage ? 'Yes' : 'No') 
                            : (typeof caseData.civil_marriage === 'boolean' 
                              ? (caseData.civil_marriage ? 'Yes' : 'No') 
                              : 'N/A')}
                        </div>
                      </div>
                      <div className="mb-2">
                        <strong>Separated:</strong>
                        <div className="text-muted">
                          {typeof caseData.separated === 'boolean' 
                            ? (caseData.separated ? 'Yes' : 'No') 
                            : 'N/A'}
                        </div>
                      </div>
                      <div className="mb-2">
                        <strong>Marriage Date/Place:</strong>
                        <div className="text-muted">{caseData.marriageDatePlace || caseData.marriage_date_place || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Family Composition (Siblings/Children) */}
                <div className="col-12 mb-4">
                  <div className="card border-0 rounded-4 shadow-sm bg-white">
                    <div className="card-header bg-info text-white">
                      <h6 className="mb-0">
                        <i className="fas fa-users me-2"></i>
                        Family Composition (Siblings/Children)
                      </h6>
                    </div>
                    <div className="card-body">
                      {caseData.familyMembers && caseData.familyMembers.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-sm table-striped">
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Relation</th>
                                <th>Age</th>
                                <th>Sex</th>
                                <th>Status</th>
                                <th>Education</th>
                                <th>Address</th>
                                <th>Occupation</th>
                              </tr>
                            </thead>
                            <tbody>
                              {caseData.familyMembers.map((member, index) => (
                                <tr key={index}>
                                  <td>{member.name || 'N/A'}</td>
                                  <td>{member.relation || 'N/A'}</td>
                                  <td>{member.age || 'N/A'}</td>
                                  <td>{member.sex || 'N/A'}</td>
                                  <td>{member.status || 'N/A'}</td>
                                  <td>{member.education || 'N/A'}</td>
                                  <td>{member.address || 'N/A'}</td>
                                  <td>{member.occupation || 'N/A'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-muted mb-0">No family members recorded.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Extended Family */}
                <div className="col-12 mb-4">
                  <div className="card border-0 rounded-4 shadow-sm bg-white">
                    <div className="card-header bg-warning text-dark">
                      <h6 className="mb-0">
                        <i className="fas fa-sitemap me-2"></i>
                        Extended Family
                      </h6>
                    </div>
                    <div className="card-body">
                      {caseData.extendedFamily && caseData.extendedFamily.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-sm table-striped">
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Relation</th>
                                <th>Age</th>
                                <th>Sex</th>
                                <th>Status</th>
                                <th>Education</th>
                                <th>Address</th>
                                <th>Occupation</th>
                              </tr>
                            </thead>
                            <tbody>
                              {caseData.extendedFamily.map((member, index) => (
                                <tr key={index}>
                                  <td>{member.name || 'N/A'}</td>
                                  <td>{member.relation || 'N/A'}</td>
                                  <td>{member.age || 'N/A'}</td>
                                  <td>{member.sex || 'N/A'}</td>
                                  <td>{member.status || 'N/A'}</td>
                                  <td>{member.education || 'N/A'}</td>
                                  <td>{member.address || 'N/A'}</td>
                                  <td>{member.occupation || 'N/A'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-muted mb-0">No extended family members recorded.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assessment & Progress Section */}
                <div className="col-12 mb-4">
                  <div className="card border-0 rounded-4 shadow-sm bg-white">
                    <div className="card-header bg-success text-white">
                      <h6 className="mb-0">
                        <i className="fas fa-clipboard-check me-2"></i>
                        Assessment & Progress
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-4 mb-3">
                          <strong>Assessment:</strong>
                          <div className="text-muted mt-1" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                            {caseData.assessment || 'N/A'}
                          </div>
                        </div>
                        <div className="col-md-4 mb-3">
                          <strong>Progress:</strong>
                          <div className="text-muted mt-1" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                            {caseData.progress || 'N/A'}
                          </div>
                        </div>
                        <div className="col-md-4 mb-3">
                          <strong>Recommendation:</strong>
                          <div className="text-muted mt-1" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                            {caseData.recommendation || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Life Skills & Vital Signs Section */}
                <div className="col-12 mb-4">
                  <div className="card border-0 rounded-4 shadow-sm bg-white">
                    <div className="card-header bg-primary text-white">
                      <h6 className="mb-0">
                        <i className="fas fa-heartbeat me-2"></i>
                        Life Skills & Vital Signs
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        {/* Life Skills Activities */}
                        <div className="col-md-6 mb-3">
                          <h6 className="text-primary mb-3">Life Skills Activities</h6>
                          {caseData.lifeSkillsData && caseData.lifeSkillsData.length > 0 ? (
                            <div className="table-responsive">
                              <table className="table table-sm table-striped">
                                <thead>
                                  <tr>
                                    <th>Activity</th>
                                    <th>Performance</th>
                                    <th>Notes</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {caseData.lifeSkillsData.map((skill, index) => (
                                    <tr key={index}>
                                      <td>{skill.activity || 'N/A'}</td>
                                      <td>
                                        <span className={`badge ${
                                          skill.performance === 'Excellent' ? 'bg-success' :
                                          skill.performance === 'Good' ? 'bg-primary' :
                                          skill.performance === 'Fair' ? 'bg-warning' :
                                          skill.performance === 'Poor' ? 'bg-danger' : 'bg-secondary'
                                        }`}>
                                          {skill.performance || 'N/A'}
                                        </span>
                                      </td>
                                      <td>{skill.notes || 'N/A'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-muted">No life skills activities recorded.</p>
                          )}
                        </div>

                        {/* Vital Signs */}
                        <div className="col-md-6 mb-3">
                          <h6 className="text-primary mb-3">Vital Signs Records</h6>
                          {caseData.vitalSignsData && caseData.vitalSignsData.length > 0 ? (
                            <div className="table-responsive">
                              <table className="table table-sm table-striped">
                                <thead>
                                  <tr>
                                    <th>Date</th>
                                    <th>BP</th>
                                    <th>HR</th>
                                    <th>Temp</th>
                                    <th>Weight</th>
                                    <th>Height</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {caseData.vitalSignsData.map((vital, index) => (
                                    <tr key={index}>
                                      <td>{formatDate(vital.date)}</td>
                                      <td>{vital.bloodPressure || 'N/A'}</td>
                                      <td>{vital.heartRate || 'N/A'}</td>
                                      <td>{vital.temperature || 'N/A'}</td>
                                      <td>{vital.weight || 'N/A'}</td>
                                      <td>{vital.height || 'N/A'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-muted">No vital signs records available.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Intervention Plan Section */}
                <div className="col-12 mb-4">
                  <div className="card border-0 rounded-4 shadow-sm bg-white">
                    <div className="card-header bg-warning text-dark">
                      <h6 className="mb-0">
                        <i className="fas fa-tasks me-2"></i>
                        Intervention Plan
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-3 mb-3">
                          <strong>Goals:</strong>
                          <div className="text-muted mt-1" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                            {caseData.interventionGoals || 'N/A'}
                          </div>
                        </div>
                        <div className="col-md-3 mb-3">
                          <strong>Objectives:</strong>
                          <div className="text-muted mt-1" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                            {caseData.interventionObjectives || 'N/A'}
                          </div>
                        </div>
                        <div className="col-md-3 mb-3">
                          <strong>Timeline:</strong>
                          <div className="text-muted mt-1" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                            {caseData.interventionTimeline || 'N/A'}
                          </div>
                        </div>
                        <div className="col-md-3 mb-3">
                          <strong>Expected Outcomes:</strong>
                          <div className="text-muted mt-1" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                            {caseData.expectedOutcomes || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Case Details & History */}
                <div className="col-12 mb-4">
                  <div className="card border-0 rounded-4 shadow-sm bg-white">
                    <div className="card-header bg-dark text-white">
                      <h6 className="mb-0">
                        <i className="fas fa-history me-2"></i>
                        Case Details & History
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <strong>Problem Presented:</strong>
                        <div className="text-muted mt-1" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                          {caseData.problem_presented || caseData.problemPresented || 'N/A'}
                        </div>
                      </div>
                      <div className="mb-3">
                        <strong>Brief History:</strong>
                        <div className="text-muted mt-1" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                          {caseData.brief_history || caseData.briefHistory || 'N/A'}
                        </div>
                      </div>
                      {(caseData.notes || caseData.additional_notes) && (
                        <div className="mb-3">
                          <strong>Additional Notes:</strong>
                          <div className="text-muted mt-1" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                            {caseData.notes || caseData.additional_notes}
                          </div>
                        </div>
                      )}
                      <div className="row">
                        <div className="col-md-6 mb-2">
                          <strong>Last Updated:</strong>
                          <div className="text-muted">
                            <i className="fas fa-clock me-1"></i>
                            {formatTime(caseData.updated_at || caseData.lastUpdated)}
                          </div>
                        </div>
                        <div className="col-md-6 mb-2">
                          <strong>Case ID:</strong>
                          <div className="text-muted">#{caseData.id}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetailsPage;