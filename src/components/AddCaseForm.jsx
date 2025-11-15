import React, { useState } from 'react';
import axios from 'axios';
import { API_HOST } from '../utils/apiBase';
import CaseDetailsForm from './CaseDetailsForm';
// Removed inline export actions from AddCaseForm

// Create a configured axios instance with authentication
const createAuthAxios = () => {
  // Check both localStorage and sessionStorage for token
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return axios.create({
    baseURL: API_HOST,
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token,
      'Authorization': `Bearer ${token}`
    }
  });
};

// Add custom styling to hide focus indicators
const customSelectStyle = {
  outline: 'none',
  boxShadow: 'none',
  cursor: 'pointer'
};

const customInputStyle = {
  outline: 'none'
};

const AddCaseForm = ({ onClose, onCaseAdded }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    nickname: '',
    sex: '',
    birthdate: '',
    birthplace: '',
    status: '',
    nationality: '',
    religion: '',
    provincialAddress: '',
    presentAddress: '',
    sourceOfReferral: '',
    otherSourceOfReferral: '',
    dateOfReferral: '',
    addressAndTel: '',
    relationToClient: '',
    caseType: '',
    assignedHouseParent: '',
    // Family/Household Composition
    fatherName: '',
    fatherAge: '',
    fatherEducation: '',
    fatherOccupation: '',
    fatherOtherSkills: '',
    fatherAddress: '',
    fatherIncome: '',
    fatherLiving: true,
    motherName: '',
    motherAge: '',
    motherEducation: '',
    motherOccupation: '',
    motherOtherSkills: '',
    motherAddress: '',
    motherIncome: '',
    motherLiving: true,
    guardianName: '',
    guardianAge: '',
    guardianEducation: '',
    guardianOccupation: '',
    guardianOtherSkills: '',
    guardianRelation: '',
    guardianAddress: '',
    guardianIncome: '',
    guardianLiving: true,
    guardianDeceased: false,
    // Civil Status of Parents
    marriedInChurch: false,
    liveInCommonLaw: false,
    civilMarriage: false,
    separated: false,
    marriageDatePlace: '',
    // Family Composition (Siblings/Children)
    familyMembers: [
      { name: '', relation: '', age: '', sex: '', status: '', education: '', address: '', occupation: '', income: '' }
    ],
    // Extended Family
    extendedFamily: [
      { name: '', relationship: '', age: '', sex: '', status: '', education: '', occupation: '', income: '' }
    ],
    // Educational Attainment
    educationalAttainment: {
      elementary: { schoolName: '', schoolAddress: '', year: '' },
      highSchool: { schoolName: '', schoolAddress: '', year: '' },
      seniorHighSchool: { schoolName: '', schoolAddress: '', year: '' },
      vocationalCourse: { schoolName: '', schoolAddress: '', year: '' },
      college: { schoolName: '', schoolAddress: '', year: '' },
      others: { schoolName: '', schoolAddress: '', year: '' }
    },
    // Sacramental Record
    sacramentalRecord: {
      baptism: { dateReceived: '', placeParish: '' },
      firstCommunion: { dateReceived: '', placeParish: '' },
      confirmation: { dateReceived: '', placeParish: '' },
      others: { dateReceived: '', placeParish: '' }
    }
  });
  
  const [showNextForm, setShowNextForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const computeAge = (birthdate) => {
    if (!birthdate) return '';
    const d = new Date(birthdate);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age;
  };

  // Removed: buildCaseDataForExport, handleExportPDF, handleExportCSV

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'caseType') {
      console.log('Program selected:', value);
    }
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFamilyMemberChange = (index, field, value) => {
    const updatedMembers = [...formData.familyMembers];
    updatedMembers[index][field] = value;
    setFormData(prevState => ({
      ...prevState,
      familyMembers: updatedMembers
    }));
  };

  const addFamilyMember = () => {
    setFormData(prevState => ({
      ...prevState,
      familyMembers: [...prevState.familyMembers, 
        { name: '', relation: '', age: '', sex: '', status: '', education: '', address: '', occupation: '', income: '' }
      ]
    }));
  };

  const removeFamilyMember = (index) => {
    if (formData.familyMembers.length > 1) {
      const updatedMembers = formData.familyMembers.filter((_, i) => i !== index);
      setFormData(prevState => ({
        ...prevState,
        familyMembers: updatedMembers
      }));
    }
  };

  const handleExtendedFamilyChange = (index, field, value) => {
    const updatedExtended = [...formData.extendedFamily];
    updatedExtended[index][field] = value;
    setFormData(prevState => ({
      ...prevState,
      extendedFamily: updatedExtended
    }));
  };

  const addExtendedFamilyMember = () => {
    setFormData(prevState => ({
      ...prevState,
      extendedFamily: [...prevState.extendedFamily, 
        { name: '', relationship: '', age: '', sex: '', status: '', education: '', occupation: '', income: '' }
      ]
    }));
  };

  const removeExtendedFamilyMember = (index) => {
    if (formData.extendedFamily.length > 1) {
      const updatedExtended = formData.extendedFamily.filter((_, i) => i !== index);
      setFormData(prevState => ({
        ...prevState,
        extendedFamily: updatedExtended
      }));
    }
  };

  // Educational Attainment handlers
  const handleEducationalAttainmentChange = (level, field, value) => {
    setFormData(prevState => ({
      ...prevState,
      educationalAttainment: {
        ...prevState.educationalAttainment,
        [level]: {
          ...prevState.educationalAttainment[level],
          [field]: value
        }
      }
    }));
  };

  // Sacramental Record handlers
  const handleSacramentalRecordChange = (sacrament, field, value) => {
    setFormData(prevState => ({
      ...prevState,
      sacramentalRecord: {
        ...prevState.sacramentalRecord,
        [sacrament]: {
          ...prevState.sacramentalRecord[sacrament],
          [field]: value
        }
      }
    }));
  };


    
    // setFormData(testData); // removed unused test data initialization

  const handleNext = async (e) => {
    e.preventDefault();
    // Proceed without front-end required field enforcement
    // Check for name uniqueness before proceeding to the next form
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }
      const authAxios = createAuthAxios();
      // Proactive duplicate check to avoid server 400
      const { firstName, lastName, birthdate } = formData;
      if (firstName && lastName) {
        try {
          const dup = await authAxios.get('/api/cases', {
            params: { checkName: 'true', firstName, lastName, birthdate: birthdate || '' }
          });
          if (dup?.data?.exists) {
            setError(dup.data.message || 'A case with this name and birthdate already exists.');
            setLoading(false);
            return;
          }
        } catch (checkErr) {
          console.warn('Name check failed:', checkErr);
          // Continue; backend will still validate
        }
      }
      
      console.log('Form data saved for next step:', formData);
      setShowNextForm(true);
      setLoading(false);
    } catch (err) {
      console.error('Error preparing next step:', err);
      setError('An error occurred while preparing the next step. Please try again.');
      setLoading(false);
    }
  };

  const handleSubmit = async (completeData) => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }
      
      // Use the configured axios instance with authentication
      const authAxios = createAuthAxios();
      
      // Use explicit config with token
      const caseData = {
        ...formData,
        ...completeData,
        programType: formData.caseType, // Main field for program type
        caseType: formData.caseType,    // Keep for backward compatibility
        program_type: formData.caseType, // Also send with underscore format for API
        status: 'active', // Explicitly set active status
        lastUpdated: new Date().toISOString() // Add current timestamp
      };
      
      console.log('Submitting case data:', caseData);
      // Proactive duplicate check to avoid server 400
      if (caseData.firstName && caseData.lastName) {
        try {
          const dup = await authAxios.get('/api/cases', {
            params: { checkName: 'true', firstName: caseData.firstName, lastName: caseData.lastName, birthdate: caseData.birthdate || '' }
          });
          if (dup?.data?.exists) {
            setError(dup.data.message || 'Another case with this name and birthdate already exists.');
            setLoading(false);
            return;
          }
        } catch (checkErr) {
          console.warn('Name check failed:', checkErr);
        }
      }

      // Use the configured axios instance with authentication
      const response = await authAxios.post('/api/cases', caseData);
      
      console.log('Case added successfully:', response.data);
      
      // Format the response data for the case list
      const now = new Date();
      const newCase = {
        id: response.data.id,
        name: `${response.data.first_name} ${response.data.last_name}`,
        firstName: response.data.first_name,
        lastName: response.data.last_name,
        sex: response.data.sex,
        birthdate: response.data.birthdate,
        age: calculateAge(response.data.birthdate),
        programType: response.data.program_type || formData.caseType, // Use the actual program_type or fallback to caseType
        status: 'active', // Explicitly include status
        lastUpdated: formatDate(response.data.last_updated || response.data.created_at || now),
        timestamp: now.getTime() // Add timestamp for notification tracking
      };
      
      if (onCaseAdded) {
        console.log('Calling onCaseAdded with new case:', newCase);
        onCaseAdded(newCase);
      }
      if (onClose) onClose();
      
    } catch (err) {
      console.error('Error adding case:', err);
      const serverMsg = err.response?.data?.message;
      const serverDetails = err.response?.data?.details;
      setError(serverMsg ? `${serverMsg}${serverDetails ? `: ${serverDetails}` : ''}` : 'Error adding case');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  function calculateAge(birthdate) {
    if (!birthdate) return '';
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  function formatDate(date) {
    if (!date) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
  }

  if (showNextForm) {
    return (
      <CaseDetailsForm 
        initialData={formData} 
        onBack={() => setShowNextForm(false)}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      />
    );
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8fafc', minHeight: '96vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-dark fw-bold">ADD NEW CASE</h2>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-light px-3 py-1" 
            onClick={onClose}
            style={{ 
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              fontWeight: '500',
              fontSize: '14px',
              borderRadius: '4px',
              width: 'auto',
              minWidth: '80px'
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          <div className="d-flex align-items-center">
            <i className="fas fa-exclamation-circle me-2" style={{ fontSize: '1.25rem' }}></i>
            <div>
              <strong>Validation Error:</strong> {error}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleNext}>
        <div className="row">
          {/* Personal Information */}
          <div className="col-md-12 mb-4">
            <div className="card border-0 shadow-sm rounded-4 bg-white">
              <div className="card-header bg-primary text-white py-3">
                <h5 className="mb-0 fw-bold">PERSONAL INFORMATION</h5>
              </div>
              <div className="card-body p-4">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="firstName" className="form-label fw-semibold">First Name</label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Enter first name"
                      style={customInputStyle}
                    />
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label htmlFor="lastName" className="form-label fw-semibold">Last Name</label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Enter last name"
                      style={customInputStyle}
                    />
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label htmlFor="middleName" className="form-label fw-semibold">Middle Name</label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      id="middleName"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleChange}
                      placeholder="Enter middle name"
                      style={customInputStyle}
                    />
                  </div>
                  
                  <div className="col-md-4 mb-3">
                    <label htmlFor="nickname" className="form-label fw-semibold">Nickname/a.k.a</label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      id="nickname"
                      name="nickname"
                      value={formData.nickname}
                      onChange={handleChange}
                      placeholder="Enter nickname"
                      style={customInputStyle}
                    />
                  </div>
                  
                  <div className="col-md-4 mb-3">
                    <label htmlFor="sex" className="form-label fw-semibold">Sex</label>
                    <select
                      className="form-select form-select-lg"
                      id="sex"
                      name="sex"
                      value={formData.sex}
                      onChange={handleChange}
                      style={customSelectStyle}
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label htmlFor="birthdate" className="form-label fw-semibold">Birthdate</label>
                    <input
                      type="date"
                      className="form-control form-control-lg"
                      id="birthdate"
                      name="birthdate"
                      value={formData.birthdate}
                      onChange={handleChange}
                      style={customInputStyle}
                    />
                  </div>
                  
                  <div className="col-md-4 mb-3">
                    <label htmlFor="birthplace" className="form-label fw-semibold">Birthplace</label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      id="birthplace"
                      name="birthplace"
                      value={formData.birthplace}
                      onChange={handleChange}
                      placeholder="Enter birthplace"
                      style={customInputStyle}
                    />
                  </div>
                  
                  <div className="col-md-4 mb-3">
                    <label htmlFor="status" className="form-label fw-semibold">Status</label>
                    <select
                      className="form-select form-select-lg"
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      style={customSelectStyle}
                    >
                      <option value="">Select status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Live-in/ Common Law">Live-in/ Common Law</option>
                      <option value="Widow">Widow</option>
                    </select>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="nationality" className="form-label fw-semibold">Nationality</label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      id="nationality"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleChange}
                      placeholder="Enter nationality"
                      style={customInputStyle}
                    />
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label htmlFor="religion" className="form-label fw-semibold">Religion</label>
                    <select
                      className="form-select form-select-lg"
                      id="religion"
                      name="religion"
                      value={formData.religion}
                      onChange={handleChange}
                      style={customSelectStyle}
                    >
                      <option value="">Select religion</option>
                      <option value="Roman Catholic">Roman Catholic</option>
                      <option value="Protestant">Protestant</option>
                      <option value="Islam">Islam</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="provincialAddress" className="form-label fw-semibold">Provincial/Permanent Address</label>
                  <textarea
                    className="form-control"
                    id="provincialAddress"
                    name="provincialAddress"
                    value={formData.provincialAddress}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Enter provincial/permanent address"
                    style={customInputStyle}
                  ></textarea>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="presentAddress" className="form-label fw-semibold">Present Address</label>
                  <textarea
                    className="form-control"
                    id="presentAddress"
                    name="presentAddress"
                    value={formData.presentAddress}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Enter present address"
                    style={customInputStyle}
                  ></textarea>
                </div>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="sourceOfReferral" className="form-label fw-semibold">Source of Referral</label>
                    <select
                      className="form-select form-select-lg"
                      id="sourceOfReferral"
                      name="sourceOfReferral"
                      value={formData.sourceOfReferral}
                      onChange={handleChange}
                      style={customSelectStyle}
                    >
                      <option value="">Select source</option>
                      <option value="Police">Police</option>
                      <option value="DSWD">DSWD</option>
                      <option value="Court">Court</option>
                      <option value="School">School</option>
                      <option value="Family">Family</option>
                      <option value="Other">Other</option>
                    </select>
                    {formData.sourceOfReferral === 'Other' && (
                      <div className="mt-2">
                        <input
                          type="text"
                          className="form-control"
                          id="otherSourceOfReferral"
                          name="otherSourceOfReferral"
                          value={formData.otherSourceOfReferral}
                          onChange={handleChange}
                          placeholder="Please specify"
                          style={customInputStyle}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label htmlFor="dateOfReferral" className="form-label fw-semibold">Date of Referral</label>
                    <input
                      type="date"
                      className="form-control form-control-lg"
                      id="dateOfReferral"
                      name="dateOfReferral"
                      value={formData.dateOfReferral}
                      onChange={handleChange}
                      style={customInputStyle}
                    />
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="addressAndTel" className="form-label fw-semibold">Address and Tel. #</label>
                    <textarea
                      className="form-control"
                      id="addressAndTel"
                      name="addressAndTel"
                      value={formData.addressAndTel}
                      onChange={handleChange}
                      rows="2"
                      placeholder="Enter address and telephone number"
                      style={customInputStyle}
                    ></textarea>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label htmlFor="relationToClient" className="form-label fw-semibold">Relation to client</label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      id="relationToClient"
                      name="relationToClient"
                      value={formData.relationToClient}
                      onChange={handleChange}
                      placeholder="Enter relation to client"
                      style={customInputStyle}
                    />
                  </div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="caseType" className="form-label fw-semibold">Programs</label>
                  <select
                    className="form-select form-select-lg"
                    id="caseType"
                    name="caseType"
                    value={formData.caseType}
                    onChange={handleChange}
                    style={customSelectStyle}
                  >
                    <option value="">Select program</option>
                    <option value="Children">Children</option>
                    <option value="Youth">Youth</option>
                    <option value="Sanctuary">Sanctuary</option>
                    <option value="Crisis Intervention">Crisis Intervention</option>
                  </select>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="assignedHome" className="form-label fw-semibold">Assigned Home</label>
                  <select
                    className="form-select"
                    id="assignedHome"
                    name="assignedHouseParent"
                    value={formData.assignedHouseParent}
                    onChange={handleChange}
                    style={customSelectStyle}
                  >
                    <option value="">Select assigned home</option>
                    <option value="Blessed Rosalie Rendu">Blessed Rosalie Rendu</option>
                    <option value="Blessed Margaret Rutan">Blessed Margaret Rutan</option>
                    <option value="Blessed Martha Wiecka">Blessed Martha Wiecka</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Educational Attainment & Sacramental Record */}
          <div className="col-12 mb-4">
            <div className="card border-0 shadow-sm rounded-4 bg-white mb-4">
              <div className="card-header bg-primary text-white py-3">
                <h5 className="mb-0 fw-bold">EDUCATIONAL ATTAINMENT</h5>
              </div>
              <div className="card-body p-4">
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th width="20%">LEVEL</th>
                        <th width="30%">NAME OF SCHOOL</th>
                        <th width="30%">SCHOOL ADDRESS</th>
                        <th width="20%">YEAR</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="align-middle fw-semibold">Elementary</td>
                        <td>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="School name"
                            value={formData.educationalAttainment.elementary.schoolName}
                            onChange={(e) => handleEducationalAttainmentChange('elementary', 'schoolName', e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="School address"
                            value={formData.educationalAttainment.elementary.schoolAddress}
                            onChange={(e) => handleEducationalAttainmentChange('elementary', 'schoolAddress', e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="number"
                            inputMode="numeric"
                            min="1900"
                            max="2100"
                            className="form-control" 
                            placeholder="Year"
                            value={formData.educationalAttainment.elementary.year}
                            onChange={(e) => handleEducationalAttainmentChange('elementary', 'year', e.target.value)}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle fw-semibold">High School</td>
                        <td>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="School name"
                            value={formData.educationalAttainment.highSchool.schoolName}
                            onChange={(e) => handleEducationalAttainmentChange('highSchool', 'schoolName', e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="School address"
                            value={formData.educationalAttainment.highSchool.schoolAddress}
                            onChange={(e) => handleEducationalAttainmentChange('highSchool', 'schoolAddress', e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="number"
                            inputMode="numeric"
                            min="1900"
                            max="2100"
                            className="form-control" 
                            placeholder="Year"
                            value={formData.educationalAttainment.highSchool.year}
                            onChange={(e) => handleEducationalAttainmentChange('highSchool', 'year', e.target.value)}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle fw-semibold">Senior High School</td>
                        <td>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="School name"
                            value={formData.educationalAttainment.seniorHighSchool.schoolName}
                            onChange={(e) => handleEducationalAttainmentChange('seniorHighSchool', 'schoolName', e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="School address"
                            value={formData.educationalAttainment.seniorHighSchool.schoolAddress}
                            onChange={(e) => handleEducationalAttainmentChange('seniorHighSchool', 'schoolAddress', e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="number"
                            inputMode="numeric"
                            min="1900"
                            max="2100"
                            className="form-control" 
                            placeholder="Year"
                            value={formData.educationalAttainment.seniorHighSchool.year}
                            onChange={(e) => handleEducationalAttainmentChange('seniorHighSchool', 'year', e.target.value)}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle fw-semibold">Vocational Course</td>
                        <td>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="School name"
                            value={formData.educationalAttainment.vocationalCourse.schoolName}
                            onChange={(e) => handleEducationalAttainmentChange('vocationalCourse', 'schoolName', e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="School address"
                            value={formData.educationalAttainment.vocationalCourse.schoolAddress}
                            onChange={(e) => handleEducationalAttainmentChange('vocationalCourse', 'schoolAddress', e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="number"
                            inputMode="numeric"
                            min="1900"
                            max="2100"
                            className="form-control" 
                            placeholder="Year"
                            value={formData.educationalAttainment.vocationalCourse.year}
                            onChange={(e) => handleEducationalAttainmentChange('vocationalCourse', 'year', e.target.value)}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle fw-semibold">College</td>
                        <td>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="School name"
                            value={formData.educationalAttainment.college.schoolName}
                            onChange={(e) => handleEducationalAttainmentChange('college', 'schoolName', e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="School address"
                            value={formData.educationalAttainment.college.schoolAddress}
                            onChange={(e) => handleEducationalAttainmentChange('college', 'schoolAddress', e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="number"
                            inputMode="numeric"
                            min="1900"
                            max="2100"
                            className="form-control" 
                            placeholder="Year"
                            value={formData.educationalAttainment.college.year}
                            onChange={(e) => handleEducationalAttainmentChange('college', 'year', e.target.value)}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle fw-semibold">ALS</td>
                        <td>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="School name"
                            value={formData.educationalAttainment.others.schoolName}
                            onChange={(e) => handleEducationalAttainmentChange('others', 'schoolName', e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="School address"
                            value={formData.educationalAttainment.others.schoolAddress}
                            onChange={(e) => handleEducationalAttainmentChange('others', 'schoolAddress', e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="number"
                            inputMode="numeric"
                            min="1900"
                            max="2100"
                            className="form-control" 
                            placeholder="Year"
                            value={formData.educationalAttainment.others.year}
                            onChange={(e) => handleEducationalAttainmentChange('others', 'year', e.target.value)}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Sacramental Record */}
            <div className="card border-0 shadow-sm rounded-4 bg-white">
              <div className="card-header bg-primary text-white py-3">
                <h5 className="mb-0 fw-bold">SACRAMENTAL RECORD</h5>
              </div>
              <div className="card-body p-4">
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th width="25%">SACRAMENT</th>
                        <th width="35%">DATE RECEIVED</th>
                        <th width="40%">PLACE/PARISH</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="align-middle fw-semibold">Baptism</td>
                        <td>
                          <input 
                            type="date" 
                            className="form-control"
                            value={formData.sacramentalRecord.baptism.dateReceived}
                            onChange={(e) => handleSacramentalRecordChange('baptism', 'dateReceived', e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Enter place/parish"
                            value={formData.sacramentalRecord.baptism.placeParish}
                            onChange={(e) => handleSacramentalRecordChange('baptism', 'placeParish', e.target.value)}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle fw-semibold">First Communion</td>
                        <td>
                          <input 
                            type="date" 
                            className="form-control"
                            value={formData.sacramentalRecord.firstCommunion.dateReceived}
                            onChange={(e) => handleSacramentalRecordChange('firstCommunion', 'dateReceived', e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Enter place/parish"
                            value={formData.sacramentalRecord.firstCommunion.placeParish}
                            onChange={(e) => handleSacramentalRecordChange('firstCommunion', 'placeParish', e.target.value)}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle fw-semibold">Confirmation</td>
                        <td>
                          <input 
                            type="date" 
                            className="form-control"
                            value={formData.sacramentalRecord.confirmation.dateReceived}
                            onChange={(e) => handleSacramentalRecordChange('confirmation', 'dateReceived', e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Enter place/parish"
                            value={formData.sacramentalRecord.confirmation.placeParish}
                            onChange={(e) => handleSacramentalRecordChange('confirmation', 'placeParish', e.target.value)}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="align-middle fw-semibold">Others</td>
                        <td>
                          <input 
                            type="date" 
                            className="form-control"
                            value={formData.sacramentalRecord.others.dateReceived}
                            onChange={(e) => handleSacramentalRecordChange('others', 'dateReceived', e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Enter place/parish"
                            value={formData.sacramentalRecord.others.placeParish}
                            onChange={(e) => handleSacramentalRecordChange('others', 'placeParish', e.target.value)}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          
          {/* Family/Household Composition */}
          <div className="col-md-12 mb-4">
            <div className="card border-0 shadow-sm rounded-4 bg-white">
              <div className="card-header bg-primary text-white py-3">
                <h5 className="mb-0 fw-bold">II. FAMILY/HOUSEHOLD COMPOSITION</h5>
              </div>
              <div className="card-body p-4">
                {/* Father Information */}
                <div className="row mb-4">
                  <div className="col-md-12">
                    <h6 className="fw-bold mb-3">Husband/Father:</h6>
                    <div className="row">
                      <div className="col-md-2 mb-3">
                        <label className="form-label fw-semibold">Name</label>
                        <input
                          type="text"
                          className="form-control"
                          name="fatherName"
                          value={formData.fatherName}
                          onChange={handleChange}
                          placeholder="Father's name"
                          style={customInputStyle}
                        />
                      </div>
                      <div className="col-md-1 mb-3">
                        <label className="form-label fw-semibold">Age</label>
                        <input
                          type="number"
                          className="form-control"
                          name="fatherAge"
                          value={formData.fatherAge}
                          onChange={handleChange}
                          placeholder="Age"
                          style={customInputStyle}
                        />
                      </div>
                      <div className="col-md-2 mb-3">
                        <label className="form-label fw-semibold">Educational Attainment</label>
                        <input
                          type="text"
                          className="form-control"
                          name="fatherEducation"
                          value={formData.fatherEducation}
                          onChange={handleChange}
                          placeholder="Education"
                          style={customInputStyle}
                        />
                      </div>
                      <div className="col-md-1 mb-3">
                        <label className="form-label fw-semibold">Status</label>
                        <div className="d-flex flex-column gap-1">
                          <div className="form-check form-check-inline">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="fatherLiving"
                              id="fatherLiving"
                              checked={formData.fatherLiving}
                              onChange={() => setFormData(prev => ({...prev, fatherLiving: true}))}
                            />
                            <label className="form-check-label small" htmlFor="fatherLiving">Living</label>
                          </div>
                          <div className="form-check form-check-inline">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="fatherLiving"
                              id="fatherDeceased"
                              checked={!formData.fatherLiving}
                              onChange={() => setFormData(prev => ({...prev, fatherLiving: false}))}
                            />
                            <label className="form-check-label small" htmlFor="fatherDeceased">Deceased</label>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-2 mb-3">
                        <label className="form-label fw-semibold">Occupation</label>
                        <input
                          type="text"
                          className="form-control"
                          name="fatherOccupation"
                          value={formData.fatherOccupation || ''}
                          onChange={handleChange}
                          placeholder="Occupation"
                          style={customInputStyle}
                        />
                      </div>
                      <div className="col-md-2 mb-3">
                        <label className="form-label fw-semibold">Other Skills</label>
                        <input
                          type="text"
                          className="form-control"
                          name="fatherOtherSkills"
                          value={formData.fatherOtherSkills}
                          onChange={handleChange}
                          placeholder="Skills"
                          style={customInputStyle}
                        />
                      </div>
                      <div className="col-md-2 mb-3">
                        <label className="form-label fw-semibold">Income</label>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          className="form-control"
                          name="fatherIncome"
                          value={formData.fatherIncome}
                          onChange={handleChange}
                          placeholder="Monthly income"
                          style={customInputStyle}
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-12 mb-3">
                        <label className="form-label fw-semibold">Address and Tel. Nos.</label>
                        <input
                          type="text"
                          className="form-control"
                          name="fatherAddress"
                          value={formData.fatherAddress}
                          onChange={handleChange}
                          placeholder="Address and telephone numbers"
                          style={customInputStyle}
                        />
                      </div>
                    </div>other
                  </div>
                </div>

                {/* Mother Information */}
                <div className="row mb-4">
                  <div className="col-md-12">
                    <h6 className="fw-bold mb-3">Mother/Wife:</h6>
                    <div className="row">
                      <div className="col-md-2 mb-3">
                        <label className="form-label fw-semibold">Name</label>
                        <input
                          type="text"
                          className="form-control"
                          name="motherName"
                          value={formData.motherName}
                          onChange={handleChange}
                          placeholder="Mother's name"
                          style={customInputStyle}
                        />
                      </div>
                      <div className="col-md-1 mb-3">
                        <label className="form-label fw-semibold">Age</label>
                        <input
                          type="number"
                          className="form-control"
                          name="motherAge"
                          value={formData.motherAge}
                          onChange={handleChange}
                          placeholder="Age"
                          style={customInputStyle}
                        />
                      </div>
                      <div className="col-md-2 mb-3">
                        <label className="form-label fw-semibold">Educational Attainment</label>
                        <input
                          type="text"
                          className="form-control"
                          name="motherEducation"
                          value={formData.motherEducation}
                          onChange={handleChange}
                          placeholder="Education"
                          style={customInputStyle}
                        />
                      </div>
                      <div className="col-md-1 mb-3">
                        <label className="form-label fw-semibold">Status</label>
                        <div className="d-flex flex-column gap-1">
                          <div className="form-check form-check-inline">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="motherLiving"
                              id="motherLiving"
                              checked={formData.motherLiving}
                              onChange={() => setFormData(prev => ({...prev, motherLiving: true}))}
                            />
                            <label className="form-check-label small" htmlFor="motherLiving">Living</label>
                          </div>
                          <div className="form-check form-check-inline">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="motherLiving"
                              id="motherDeceased"
                              checked={!formData.motherLiving}
                              onChange={() => setFormData(prev => ({...prev, motherLiving: false}))}
                            />
                            <label className="form-check-label small" htmlFor="motherDeceased">Deceased</label>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-2 mb-3">
                        <label className="form-label fw-semibold">Occupation</label>
                        <input
                          type="text"
                          className="form-control"
                          name="motherOccupation"
                          value={formData.motherOccupation || ''}
                          onChange={handleChange}
                          placeholder="Occupation"
                          style={customInputStyle}
                        />
                      </div>
                      <div className="col-md-2 mb-3">
                        <label className="form-label fw-semibold">Other Skills</label>
                        <input
                          type="text"
                          className="form-control"
                          name="motherOtherSkills"
                          value={formData.motherOtherSkills}
                          onChange={handleChange}
                          placeholder="Skills"
                          style={customInputStyle}
                        />
                      </div>
                      <div className="col-md-2 mb-3">
                        <label className="form-label fw-semibold">Income</label>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          className="form-control"
                          name="motherIncome"
                          value={formData.motherIncome}
                          onChange={handleChange}
                          placeholder="Monthly income"
                          style={customInputStyle}
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-12 mb-3">
                        <label className="form-label fw-semibold">Address and Tel. Nos.</label>
                        <input
                          type="text"
                          className="form-control"
                          name="motherAddress"
                          value={formData.motherAddress}
                          onChange={handleChange}
                          placeholder="Address and telephone numbers"
                          style={customInputStyle}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Guardian Information */}
                <div className="row mb-4">
                  <div className="col-md-12">
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">Guardian:</label>
                        <input
                          type="text"
                          className="form-control"
                          name="guardianName"
                          value={formData.guardianName}
                          onChange={handleChange}
                          placeholder="Guardian's name"
                          style={customInputStyle}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">Relation to the client:</label>
                        <input
                          type="text"
                          className="form-control"
                          name="guardianRelation"
                          value={formData.guardianRelation}
                          onChange={handleChange}
                          placeholder="Relationship"
                          style={customInputStyle}
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-12 mb-3">
                        <label className="form-label fw-semibold">Address:</label>
                        <input
                          type="text"
                          className="form-control"
                          name="guardianAddress"
                          value={formData.guardianAddress}
                          onChange={handleChange}
                          placeholder="Guardian's address"
                          style={customInputStyle}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Civil Status of Parents */}
                <div className="row mb-4">
                  <div className="col-md-12">
                    <h6 className="fw-bold mb-3">CIVIL STATUS OF PARENTS:</h6>
                    <div className="row align-items-start">
                      <div className="col-md-6">
                        <div className="d-flex flex-column gap-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              name="marriedInChurch"
                              id="marriedInChurch"
                              checked={formData.marriedInChurch}
                              onChange={handleChange}
                            />
                            <label className="form-check-label" htmlFor="marriedInChurch">
                              [ ] Married in church
                            </label>
                          </div>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              name="liveInCommonLaw"
                              id="liveInCommonLaw"
                              checked={formData.liveInCommonLaw}
                              onChange={handleChange}
                            />
                            <label className="form-check-label" htmlFor="liveInCommonLaw">
                              [ ] Live-in/Common Law
                            </label>
                          </div>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              name="civilMarriage"
                              id="civilMarriage"
                              checked={formData.civilMarriage}
                              onChange={handleChange}
                            />
                            <label className="form-check-label" htmlFor="civilMarriage">
                              [ ] Civil Marriage
                            </label>
                          </div>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              name="separated"
                              id="separated"
                              checked={formData.separated}
                              onChange={handleChange}
                            />
                            <label className="form-check-label" htmlFor="separated">
                              [ ] Separated
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Date and Place</label>
                        <textarea
                          className="form-control"
                          name="marriageDatePlace"
                          value={formData.marriageDatePlace}
                          onChange={handleChange}
                          rows="4"
                          placeholder="Enter date and place of marriage/union"
                          style={customInputStyle}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
               </div>
             </div>
           </div>

           {/* Family Composition (Siblings/Children) */}
           <div className="col-md-12 mb-4">
             <div className="card border-0 shadow-sm rounded-4 bg-white">
               <div className="card-header bg-primary text-white py-3">
                 <h5 className="mb-0 fw-bold">FAMILY COMPOSITION (Siblings/children):</h5>
               </div>
               <div className="card-body p-4">
                 <div className="table-responsive">
                   <table className="table table-bordered">
                     <thead className="table-light">
                       <tr>
                         <th width="15%">Name</th>
                         <th width="12%">Relation to the client</th>
                         <th width="8%">Age/DOB</th>
                         <th width="8%">Sex</th>
                         <th width="10%">Status</th>
                         <th width="15%">Educ. Attainment</th>
                         <th width="15%">Address</th>
                         <th width="12%">Occupation/Income</th>
                         <th width="5%">Action</th>
                       </tr>
                     </thead>
                     <tbody>
                       {formData.familyMembers.map((member, index) => (
                         <tr key={index}>
                           <td>
                             <input
                               type="text"
                               className="form-control form-control-sm"
                               value={member.name}
                               onChange={(e) => handleFamilyMemberChange(index, 'name', e.target.value)}
                               placeholder="Full name"
                               style={customInputStyle}
                             />
                           </td>
                           <td>
                             <select
                               className="form-select form-select-sm"
                               value={member.relation}
                               onChange={(e) => handleFamilyMemberChange(index, 'relation', e.target.value)}
                               style={customSelectStyle}
                             >
                               <option value="">Select</option>
                               <option value="Brother">Brother</option>
                               <option value="Sister">Sister</option>
                               <option value="Half-brother">Half-brother</option>
                               <option value="Half-sister">Half-sister</option>
                               <option value="Step-brother">Step-brother</option>
                               <option value="Step-sister">Step-sister</option>
                               <option value="Other">Other</option>
                             </select>
                           </td>
                           <td>
                             <input
                               type="text"
                               className="form-control form-control-sm"
                               value={member.age}
                               onChange={(e) => handleFamilyMemberChange(index, 'age', e.target.value)}
                               placeholder="Age/DOB"
                               style={customInputStyle}
                             />
                           </td>
                           <td>
                             <select
                               className="form-select form-select-sm"
                               value={member.sex}
                               onChange={(e) => handleFamilyMemberChange(index, 'sex', e.target.value)}
                               style={customSelectStyle}
                             >
                               <option value="">Select</option>
                               <option value="Male">Male</option>
                               <option value="Female">Female</option>
                             </select>
                           </td>
                           <td>
                             <select
                               className="form-select form-select-sm"
                               value={member.status}
                               onChange={(e) => handleFamilyMemberChange(index, 'status', e.target.value)}
                               style={customSelectStyle}
                             >
                               <option value="">Select</option>
                               <option value="Single">Single</option>
                               <option value="Married">Married</option>
                               <option value="Separated">Separated</option>
                               <option value="Widowed">Widowed</option>
                             </select>
                           </td>
                           <td>
                             <input
                               type="text"
                               className="form-control form-control-sm"
                               value={member.education}
                               onChange={(e) => handleFamilyMemberChange(index, 'education', e.target.value)}
                               placeholder="Education"
                               style={customInputStyle}
                             />
                           </td>
                           <td>
                             <input
                               type="text"
                               className="form-control form-control-sm"
                               value={member.address}
                               onChange={(e) => handleFamilyMemberChange(index, 'address', e.target.value)}
                               placeholder="Address"
                               style={customInputStyle}
                             />
                           </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm mb-1"
                              value={member.occupation}
                              onChange={(e) => handleFamilyMemberChange(index, 'occupation', e.target.value)}
                              placeholder="Occupation"
                              style={customInputStyle}
                            />
                            <input
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              min="0"
                              className="form-control form-control-sm"
                              value={member.income}
                              onChange={(e) => handleFamilyMemberChange(index, 'income', e.target.value)}
                              placeholder="Income"
                              style={customInputStyle}
                            />
                          </td>
                           <td>
                             <div className="d-flex gap-1">
                               {formData.familyMembers.length > 1 && (
                                 <button
                                   type="button"
                                   className="btn btn-danger btn-sm border"
                                   onClick={() => removeFamilyMember(index)}
                                   title="Remove member"
                                   style={{ 
                                     fontSize: '0.65rem', 
                                     lineHeight: '1.2',
                                     padding: '2px 6px'
                                   }}
                                 >
                                   <i className="fas fa-trash" style={{ fontSize: '0.6rem' }}></i>
                                 </button>
                               )}
                               <button
                                 type="button"
                                 className="btn btn-success btn-sm border"
                                 onClick={addFamilyMember}
                                 title="Add new member"
                                 style={{ 
                                   fontSize: '0.65rem', 
                                   lineHeight: '1.2',
                                   padding: '2px 6px'
                                 }}
                               >
                                 <i className="fas fa-plus" style={{ fontSize: '0.6rem' }}></i>
                               </button>
                             </div>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>
             </div>
           </div>

           {/* Extended Family */}
           <div className="col-md-12 mb-4">
             <div className="card border-0 shadow-sm rounded-4 bg-white">
               <div className="card-header bg-primary text-white py-3">
                 <h5 className="mb-0 fw-bold">OTHERS: EXTENDED FAMILY:</h5>
               </div>
               <div className="card-body p-4">
                 <div className="table-responsive">
                   <table className="table table-bordered">
                     <thead className="table-light">
                       <tr>
                         <th width="18%">Name</th>
                         <th width="15%">Relationship</th>
                         <th width="10%">Age</th>
                         <th width="8%">Sex</th>
                         <th width="10%">Status</th>
                         <th width="15%">Educational attainment</th>
                         <th width="15%">Occupation/Income</th>
                         <th width="4%">Action</th>
                       </tr>
                     </thead>
                     <tbody>
                       {formData.extendedFamily.map((member, index) => (
                         <tr key={index}>
                           <td>
                             <input
                               type="text"
                               className="form-control form-control-sm"
                               value={member.name}
                               onChange={(e) => handleExtendedFamilyChange(index, 'name', e.target.value)}
                               placeholder="Full name"
                               style={customInputStyle}
                             />
                           </td>
                           <td>
                             <select
                               className="form-select form-select-sm"
                               value={member.relationship}
                               onChange={(e) => handleExtendedFamilyChange(index, 'relationship', e.target.value)}
                               style={customSelectStyle}
                             >
                               <option value="">Select</option>
                               <option value="Grandparent">Grandparent</option>
                               <option value="Aunt">Aunt</option>
                               <option value="Uncle">Uncle</option>
                               <option value="Cousin">Cousin</option>
                               <option value="Nephew">Nephew</option>
                               <option value="Niece">Niece</option>
                               <option value="Other">Other</option>
                             </select>
                           </td>
                           <td>
                             <input
                               type="number"
                               className="form-control form-control-sm"
                               value={member.age}
                               onChange={(e) => handleExtendedFamilyChange(index, 'age', e.target.value)}
                               placeholder="Age"
                               style={customInputStyle}
                             />
                           </td>
                           <td>
                             <select
                               className="form-select form-select-sm"
                               value={member.sex}
                               onChange={(e) => handleExtendedFamilyChange(index, 'sex', e.target.value)}
                               style={customSelectStyle}
                             >
                               <option value="">Select</option>
                               <option value="Male">Male</option>
                               <option value="Female">Female</option>
                             </select>
                           </td>
                           <td>
                             <select
                               className="form-select form-select-sm"
                               value={member.status}
                               onChange={(e) => handleExtendedFamilyChange(index, 'status', e.target.value)}
                               style={customSelectStyle}
                             >
                               <option value="">Select</option>
                               <option value="Single">Single</option>
                               <option value="Married">Married</option>
                               <option value="Separated">Separated</option>
                               <option value="Widowed">Widowed</option>
                             </select>
                           </td>
                           <td>
                             <input
                               type="text"
                               className="form-control form-control-sm"
                               value={member.education}
                               onChange={(e) => handleExtendedFamilyChange(index, 'education', e.target.value)}
                               placeholder="Education"
                               style={customInputStyle}
                             />
                           </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm mb-1"
                              value={member.occupation}
                              onChange={(e) => handleExtendedFamilyChange(index, 'occupation', e.target.value)}
                              placeholder="Occupation"
                              style={customInputStyle}
                            />
                            <input
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              min="0"
                              className="form-control form-control-sm"
                              value={member.income}
                              onChange={(e) => handleExtendedFamilyChange(index, 'income', e.target.value)}
                              placeholder="Income"
                              style={customInputStyle}
                            />
                          </td>
                           <td>
                             <div className="d-flex gap-1">
                               {formData.extendedFamily.length > 1 && (
                                 <button
                                   type="button"
                                   className="btn btn-danger btn-sm border"
                                   onClick={() => removeExtendedFamilyMember(index)}
                                   title="Remove member"
                                   style={{ 
                                     fontSize: '0.65rem', 
                                     lineHeight: '1.2',
                                     padding: '2px 6px'
                                   }}
                                 >
                                   <i className="fas fa-trash" style={{ fontSize: '0.6rem' }}></i>
                                 </button>
                               )}
                               <button
                                 type="button"
                                 className="btn btn-success btn-sm border"
                                 onClick={addExtendedFamilyMember}
                                 title="Add new member"
                                 style={{ 
                                   fontSize: '0.65rem', 
                                   lineHeight: '1.2',
                                   padding: '2px 6px'
                                 }}
                               >
                                 <i className="fas fa-plus" style={{ fontSize: '0.6rem' }}></i>
                               </button>
                             </div>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>
             </div>
           </div>
        </div>
        
        <div className="d-flex justify-content-end mt-3">
          <button 
            type="submit"
            className="btn btn-primary px-5 py-2" 
            style={{
              borderRadius: '4px',
              fontWeight: '600',
              fontSize: '16px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Validating...
              </>
            ) : (
              <>
                Next <i className="fas fa-arrow-right ms-2"></i>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCaseForm;
