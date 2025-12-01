import React from 'react';

const CaseDetailsModal = ({ caseData, isOpen, onClose, onConfirmArchive, viewOnly = false, size = 'lg' }) => {
  if (!isOpen || !caseData) return null;

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

  return (
    <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className={`modal-dialog modal-${size} modal-dialog-centered`} role="document">
        <div className="modal-content border-0 shadow" style={{ borderRadius: '12px' }}>
          <div className="modal-header bg-primary text-dark" style={{ borderRadius: '12px 12px 0 0' }}>
            <h5 className="modal-title fw-bold">
              <i className="fas fa-info-circle me-2"></i>
              {viewOnly ? 'Case Details - View' : 'Case Details - Discharge Confirmation'}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          
          <div className="modal-body p-4">
            {!viewOnly && (
              <div className="alert alert-warning d-flex align-items-center mb-4">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <div>
                  <strong>Discharge Confirmation</strong>
                  <br />
                  Please review the case details below before discharging. This action will mark the case as discharged.
                </div>
              </div>
            )}

            <div className="row">
              {/* Basic Information */}
              <div className="col-md-6 mb-4">
                <div className="card border-0 bg-light">
                  <div className="card-header bg-primary text-dark py-2">
                    <h6 className="mb-0 fw-bold">
                      <i className="fas fa-user me-2"></i>Basic Information
                    </h6>
                  </div>
                  <div className="card-body p-3">
                    <div className="mb-2">
                      <strong>Name:</strong>
                      <div className="text-muted">{caseData.name || `${caseData.first_name || caseData.firstName || ''} ${caseData.last_name || caseData.lastName || ''}`.trim() || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Middle Name:</strong>
                      <div className="text-muted">{caseData.middle_name || caseData.middleName || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Nickname:</strong>
                      <div className="text-muted">{caseData.nickname || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Age:</strong>
                      <div className="text-muted">{caseData.age || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Sex:</strong>
                      <div className="text-muted">{caseData.sex || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Birthdate:</strong>
                      <div className="text-muted">{formatDate(caseData.birthdate)}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Birthplace:</strong>
                      <div className="text-muted">{caseData.birthplace || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Status:</strong>
                      <div className="text-muted">{caseData.status || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Nationality:</strong>
                      <div className="text-muted">{caseData.nationality || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Religion:</strong>
                      <div className="text-muted">{caseData.religion || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="col-md-6 mb-4">
                <div className="card border-0 bg-light">
                  <div className="card-header bg-info text-dark py-2">
                    <h6 className="mb-0 fw-bold">
                      <i className="fas fa-map-marker-alt me-2"></i>Address Information
                    </h6>
                  </div>
                  <div className="card-body p-3">
                    <div className="mb-2">
                      <strong>Provincial/Permanent Address:</strong>
                      <div className="text-muted">{caseData.provincialAddress || caseData.provincial_address || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Present Address:</strong>
                      <div className="text-muted">{caseData.presentAddress || caseData.present_address || caseData.address || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Contact Number:</strong>
                      <div className="text-muted">{caseData.contact_number || caseData.contactNumber || caseData.phone || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Email:</strong>
                      <div className="text-muted">{caseData.email || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Referral Information */}
              <div className="col-md-6 mb-4">
                <div className="card border-0 bg-light">
                  <div className="card-header bg-warning text-dark py-2">
                    <h6 className="mb-0 fw-bold">
                      <i className="fas fa-handshake me-2"></i>Referral Information
                    </h6>
                  </div>
                  <div className="card-body p-3">
                    <div className="mb-2">
                      <strong>Source of Referral:</strong>
                      <div className="text-muted">{caseData.source_of_referral || caseData.sourceOfReferral || caseData.referralSource || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Other Source of Referral:</strong>
                      <div className="text-muted">{caseData.otherSourceOfReferral || caseData.other_source_of_referral || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Date of Referral:</strong>
                      <div className="text-muted">{formatDate(caseData.dateOfReferral || caseData.date_of_referral)}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Address and Tel:</strong>
                      <div className="text-muted">{caseData.addressAndTel || caseData.address_and_tel || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Relation to Client:</strong>
                      <div className="text-muted">{caseData.relationToClient || caseData.relation_to_client || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Program & Status Information */}
              <div className="col-md-6 mb-4">
                <div className="card border-0 bg-light">
                  <div className="card-header bg-success text-dark py-2">
                    <h6 className="mb-0 fw-bold">
                      <i className="fas fa-briefcase me-2"></i>Program & Status
                    </h6>
                  </div>
                  <div className="card-body p-3">
                    <div className="mb-2">
                      <strong>Case Type:</strong>
                      <div className="text-muted">{caseData.caseType || caseData.case_type || caseData.program_type || caseData.program || caseData.programType || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Assigned Home:</strong>
                      <div className="text-muted">{caseData.assigned_house_parent || caseData.assignedHouseParent || caseData.caseWorker || caseData.assignedWorker || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Current Status:</strong>
                      <div>
                        <span className={`badge px-2 py-1 ${caseData.status === 'active' ? 'bg-primary' : 'bg-secondary'}`}>
                          {caseData.status || 'Active'}
                        </span>
                      </div>
                    </div>
                    <div className="mb-2">
                      <strong>Created Date:</strong>
                      <div className="text-muted">{formatDate(caseData.created_at || caseData.createdAt)}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Admission Month:</strong>
                      <div className="text-muted">{caseData.admission_month || caseData.admissionMonth || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Father Information */}
              <div className="col-md-6 mb-4">
                <div className="card border-0 bg-light">
                  <div className="card-header bg-primary text-dark py-2">
                    <h6 className="mb-0 fw-bold">
                      <i className="fas fa-male me-2"></i>Father Information
                    </h6>
                  </div>
                  <div className="card-body p-3">
                    <div className="mb-2">
                      <strong>Name:</strong>
                      <div className="text-muted">{caseData.fatherName || caseData.father_name || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Age:</strong>
                      <div className="text-muted">{caseData.fatherAge || caseData.father_age || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Education:</strong>
                      <div className="text-muted">{caseData.fatherEducation || caseData.father_education || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Occupation:</strong>
                      <div className="text-muted">{caseData.fatherOccupation || caseData.father_occupation || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Other Skills:</strong>
                      <div className="text-muted">{caseData.fatherOtherSkills || caseData.father_other_skills || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Address:</strong>
                      <div className="text-muted">{caseData.fatherAddress || caseData.father_address || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Income:</strong>
                      <div className="text-muted">{caseData.fatherIncome || caseData.father_income || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Status:</strong>
                      <div className="text-muted">{caseData.fatherLiving ? 'Living' : 'Deceased'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mother Information */}
              <div className="col-md-6 mb-4">
                <div className="card border-0 bg-light">
                  <div className="card-header bg-danger text-white py-2">
                    <h6 className="mb-0 fw-bold">
                      <i className="fas fa-female me-2"></i>Mother Information
                    </h6>
                  </div>
                  <div className="card-body p-3">
                    <div className="mb-2">
                      <strong>Name:</strong>
                      <div className="text-muted">{caseData.motherName || caseData.mother_name || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Age:</strong>
                      <div className="text-muted">{caseData.motherAge || caseData.mother_age || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Education:</strong>
                      <div className="text-muted">{caseData.motherEducation || caseData.mother_education || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Occupation:</strong>
                      <div className="text-muted">{caseData.motherOccupation || caseData.mother_occupation || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Other Skills:</strong>
                      <div className="text-muted">{caseData.motherOtherSkills || caseData.mother_other_skills || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Address:</strong>
                      <div className="text-muted">{caseData.motherAddress || caseData.mother_address || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Income:</strong>
                      <div className="text-muted">{caseData.motherIncome || caseData.mother_income || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Status:</strong>
                      <div className="text-muted">{caseData.motherLiving ? 'Living' : 'Deceased'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guardian Information */}
              <div className="col-md-6 mb-4">
                <div className="card border-0 bg-light">
                  <div className="card-header bg-secondary text-white py-2">
                    <h6 className="mb-0 fw-bold">
                      <i className="fas fa-user-shield me-2"></i>Guardian Information
                    </h6>
                  </div>
                  <div className="card-body p-3">
                    <div className="mb-2">
                      <strong>Name:</strong>
                      <div className="text-muted">{caseData.guardianName || caseData.guardian_name || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Age:</strong>
                      <div className="text-muted">{caseData.guardianAge || caseData.guardian_age || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Education:</strong>
                      <div className="text-muted">{caseData.guardianEducation || caseData.guardian_education || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Occupation:</strong>
                      <div className="text-muted">{caseData.guardianOccupation || caseData.guardian_occupation || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Other Skills:</strong>
                      <div className="text-muted">{caseData.guardianOtherSkills || caseData.guardian_other_skills || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Relation to Client:</strong>
                      <div className="text-muted">{caseData.guardianRelation || caseData.guardian_relation || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Address:</strong>
                      <div className="text-muted">{caseData.guardianAddress || caseData.guardian_address || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Income:</strong>
                      <div className="text-muted">{caseData.guardianIncome || caseData.guardian_income || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Civil Status of Parents */}
              <div className="col-md-6 mb-4">
                <div className="card border-0 bg-light">
                  <div className="card-header bg-info text-dark py-2">
                    <h6 className="mb-0 fw-bold">
                      <i className="fas fa-heart me-2"></i>Civil Status of Parents
                    </h6>
                  </div>
                  <div className="card-body p-3">
                    <div className="mb-2">
                      <strong>Married in Church:</strong>
                      <div className="text-muted">{caseData.marriedInChurch ? 'Yes' : 'No'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Live in Common Law:</strong>
                      <div className="text-muted">{caseData.liveInCommonLaw ? 'Yes' : 'No'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Civil Marriage:</strong>
                      <div className="text-muted">{caseData.civilMarriage ? 'Yes' : 'No'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Separated:</strong>
                      <div className="text-muted">{caseData.separated ? 'Yes' : 'No'}</div>
                    </div>
                    <div className="mb-2">
                      <strong>Marriage Date and Place:</strong>
                      <div className="text-muted">{caseData.marriageDatePlace || caseData.marriage_date_place || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Family Members */}
              {caseData.familyMembers && caseData.familyMembers.length > 0 && (
                <div className="col-md-12 mb-4">
                  <div className="card border-0 bg-light">
                    <div className="card-header bg-primary text-white py-2">
                      <h6 className="mb-0 fw-bold">
                        <i className="fas fa-users me-2"></i>Family Composition (Siblings/Children)
                      </h6>
                    </div>
                    <div className="card-body p-3">
                      <div className="table-responsive">
                        <table className="table table-sm table-bordered">
                          <thead className="table-light">
                            <tr>
                              <th>Name</th>
                              <th>Relation</th>
                              <th>Age/DOB</th>
                              <th>Sex</th>
                              <th>Status</th>
                              <th>Education</th>
                              <th>Address</th>
                              <th>Occupation/Income</th>
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
                    </div>
                  </div>
                </div>
              )}

              {/* Extended Family */}
              {caseData.extendedFamily && caseData.extendedFamily.length > 0 && (
                <div className="col-md-12 mb-4">
                  <div className="card border-0 bg-light">
                    <div className="card-header bg-secondary text-white py-2">
                      <h6 className="mb-0 fw-bold">
                        <i className="fas fa-sitemap me-2"></i>Extended Family
                      </h6>
                    </div>
                    <div className="card-body p-3">
                      <div className="table-responsive">
                        <table className="table table-sm table-bordered">
                          <thead className="table-light">
                            <tr>
                              <th>Name</th>
                              <th>Relationship</th>
                              <th>Age</th>
                              <th>Sex</th>
                              <th>Status</th>
                              <th>Education</th>
                              <th>Occupation/Income</th>
                            </tr>
                          </thead>
                          <tbody>
                            {caseData.extendedFamily.map((member, index) => (
                              <tr key={index}>
                                <td>{member.name || 'N/A'}</td>
                                <td>{member.relationship || 'N/A'}</td>
                                <td>{member.age || 'N/A'}</td>
                                <td>{member.sex || 'N/A'}</td>
                                <td>{member.status || 'N/A'}</td>
                                <td>{member.education || 'N/A'}</td>
                                <td>{member.occupation || 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Case Details & History */}
              <div className="col-md-12 mb-4">
                <div className="card border-0 bg-light">
                  <div className="card-header bg-warning text-dark py-2">
                    <h6 className="mb-0 fw-bold">
                      <i className="fas fa-file-alt me-2"></i>Case Details & History
                    </h6>
                  </div>
                  <div className="card-body p-3">
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <strong>Problem Presented:</strong>
                        <div className="text-muted mt-1" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                          {caseData.problem_presented || caseData.problemPresented || 'N/A'}
                        </div>
                      </div>
                      <div className="col-md-6 mb-3">
                        <strong>Brief History:</strong>
                        <div className="text-muted mt-1" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                          {caseData.brief_history || caseData.briefHistory || 'N/A'}
                        </div>
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

              {/* Assessment & Progress Section */}
              <div className="col-md-12 mb-4">
                <div className="card border-0 bg-light">
                  <div className="card-header bg-primary text-white py-2">
                    <h6 className="mb-0 fw-bold">
                      <i className="fas fa-stethoscope me-2"></i>Assessment & Progress
                    </h6>
                  </div>
                  <div className="card-body p-3">
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <strong>Assessment:</strong>
                        <div className="text-muted mt-1" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                          {caseData.assessment || 'No assessment recorded'}
                        </div>
                      </div>
                      <div className="col-md-6 mb-3">
                        <strong>Progress:</strong>
                        <div className="text-muted mt-1" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                          {caseData.progress || 'No progress recorded'}
                        </div>
                      </div>
                    </div>
                    {caseData.recommendation && (
                      <div className="mb-3">
                        <strong>Recommendation:</strong>
                        <div className="text-muted mt-1" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                          {caseData.recommendation}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Life Skills & Vital Signs Section */}
              <div className="col-md-12 mb-4">
                <div className="card border-0 bg-light">
                  <div className="card-header bg-success text-white py-2">
                    <h6 className="mb-0 fw-bold">
                      <i className="fas fa-heartbeat me-2"></i>Life Skills & Vital Signs
                    </h6>
                  </div>
                  <div className="card-body p-3">
                    <div className="row">
                      {/* Life Skills Activities */}
                      <div className="col-md-6 mb-3">
                        <strong>Life Skills Activities:</strong>
                        {caseData.lifeSkills && caseData.lifeSkills.length > 0 ? (
                          <div className="mt-2">
                            {caseData.lifeSkills.map((skill, index) => (
                              <div key={index} className="border rounded p-2 mb-2 bg-white">
                                <div className="d-flex justify-content-between align-items-start">
                                  <div>
                                    <strong className="text-primary">{skill.activity}</strong>
                                    <div className="small text-muted">
                                      Date: {new Date(skill.date_completed || skill.dateCompleted).toLocaleDateString()}
                                    </div>
                                    <span className={`badge ${
                                      skill.performance_rating === 'Excellent' || skill.performanceRating === 'Excellent' ? 'bg-success' :
                                      skill.performance_rating === 'Good' || skill.performanceRating === 'Good' ? 'bg-primary' :
                                      skill.performance_rating === 'Fair' || skill.performanceRating === 'Fair' ? 'bg-warning' :
                                      'bg-danger'
                                    }`}>
                                      {skill.performance_rating || skill.performanceRating}
                                    </span>
                                  </div>
                                </div>
                                {(skill.notes) && (
                                  <div className="mt-2 small text-muted">
                                    <strong>Notes:</strong> {skill.notes}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-muted mt-1 fst-italic">No life skills activities recorded</div>
                        )}
                      </div>

                      {/* Vital Signs */}
                      <div className="col-md-6 mb-3">
                        <strong>Vital Signs Records:</strong>
                        {caseData.vitalSigns && caseData.vitalSigns.length > 0 ? (
                          <div className="mt-2">
                            {caseData.vitalSigns.map((vital, index) => (
                              <div key={index} className="border rounded p-2 mb-2 bg-white">
                                <div className="small">
                                  <strong>Date:</strong> {new Date(vital.date_recorded || vital.date).toLocaleDateString()}
                                </div>
                                <div className="row mt-1">
                                  {vital.blood_pressure && (
                                    <div className="col-6">
                                      <small><strong>BP:</strong> {vital.blood_pressure}</small>
                                    </div>
                                  )}
                                  {vital.heart_rate && (
                                    <div className="col-6">
                                      <small><strong>HR:</strong> {vital.heart_rate}</small>
                                    </div>
                                  )}
                                  {vital.temperature && (
                                    <div className="col-6">
                                      <small><strong>Temp:</strong> {vital.temperature}</small>
                                    </div>
                                  )}
                                  {vital.weight && (
                                    <div className="col-6">
                                      <small><strong>Weight:</strong> {vital.weight}kg</small>
                                    </div>
                                  )}
                                  {vital.height && (
                                    <div className="col-6">
                                      <small><strong>Height:</strong> {vital.height}cm</small>
                                    </div>
                                  )}
                                </div>
                                {vital.notes && (
                                  <div className="mt-1 small text-muted">
                                    <strong>Notes:</strong> {vital.notes}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-muted mt-1 fst-italic">No vital signs recorded</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Intervention Plan Section */}
              <div className="col-md-12 mb-4">
                <div className="card border-0 bg-light">
                  <div className="card-header bg-info text-white py-2">
                    <h6 className="mb-0 fw-bold">
                      <i className="fas fa-clipboard-list me-2"></i>Intervention Plan
                    </h6>
                  </div>
                  <div className="card-body p-3">
                    <div className="row">
                      <div className="col-md-12 mb-3">
                        <strong>Intervention Plan:</strong>
                        <div className="text-muted mt-1" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                          {caseData.interventionPlan || caseData.intervention_plan || 'No intervention plan recorded'}
                        </div>
                      </div>
                      {(caseData.goals || caseData.objectives) && (
                        <div className="col-md-12 mb-3">
                          <strong>Goals & Objectives:</strong>
                          <div className="text-muted mt-1" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                            {caseData.goals || caseData.objectives || 'No goals recorded'}
                          </div>
                        </div>
                      )}
                      {(caseData.timeline || caseData.expectedOutcome) && (
                        <div className="col-md-12 mb-3">
                          <strong>Timeline & Expected Outcome:</strong>
                          <div className="text-muted mt-1" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                            {caseData.timeline || caseData.expectedOutcome || 'No timeline recorded'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="modal-footer bg-light" style={{ borderRadius: '0 0 12px 12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              <i className="fas fa-times me-2"></i>
              {viewOnly ? 'Close' : 'Cancel'}
            </button>
            {!viewOnly && onConfirmArchive && (
              <div className="d-flex justify-content-end mt-3">
                <button 
                  className="btn btn-danger"
                  onClick={onConfirmArchive}
                >
                -                  <i className="fas fa-archive me-2"></i>
                +                  <i className="fas fa-check me-2"></i>
                  Confirm Discharge
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetailsModal;
