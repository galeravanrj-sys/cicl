import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE } from '../utils/apiBase';
import { useAuth } from '../context/AuthContext';
import { lifeSkillsService, vitalSignsService } from '../services/lifeSkillsVitalSignsService';
import { useCases } from '../context/CaseContext'
import { useNavigate } from 'react-router-dom'

// Add custom styling to hide focus indicators
const customSelectStyle = {
  outline: 'none',
  boxShadow: 'none',
  cursor: 'pointer'
};

const customInputStyle = {
  outline: 'none'
};

  const EditCaseForm = ({ caseData, onClose, onCaseUpdated }) => {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = ((user?.role || '').toLowerCase()).includes('admin');
  const { updateCase } = useCases();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fullCaseData, setFullCaseData] = useState(null);
  const [formData, setFormData] = useState({
    ...caseData,
    recommendation: '',
    assessment: '',
    birthdate: '',
    clientDescription: '',
    parentsDescription: ''
  });
  const [checklist, setChecklist] = useState([]);
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);

  // Life Skills and Vital Signs state
  const [activeTab, setActiveTab] = useState('lifeSkills');
  const [lifeSkillsData, setLifeSkillsData] = useState({
    activity: '',
    dateCompleted: '',
    performanceRating: '',
    notes: ''
  });
  const [vitalSignsData, setVitalSignsData] = useState({
    date: '',
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    weight: '',
    height: '',
    notes: ''
  });
  const [previousActivities, setPreviousActivities] = useState([]);
  const [previousVitalSigns, setPreviousVitalSigns] = useState([]);
  const [showLifeSkillsDetails, setShowLifeSkillsDetails] = useState(false);

  // Handle picture upload
  const handlePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePicture = () => {
    setProfilePicturePreview(null);
  };

  // Life Skills and Vital Signs options

  const performanceRatings = [
    'Excellent',
    'Good',
    'Fair',
    'Needs Improvement'
  ];

  // Life Skills and Vital Signs handlers
  const handleLifeSkillsChange = (e) => {
    const { name, value } = e.target;
    setLifeSkillsData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVitalSignsChange = (e) => {
    const { name, value } = e.target;
    setVitalSignsData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveLifeSkillsData = async (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    try {
      if (!fullCaseData?.id) {
        setError('Case ID not found');
        console.error('Case ID not found');
        return;
      }

      const lifeSkillPayload = {
        activity: lifeSkillsData.activity,
        dateCompleted: lifeSkillsData.dateCompleted,
        performanceRating: lifeSkillsData.performanceRating,
        notes: lifeSkillsData.notes
      };

      await lifeSkillsService.addLifeSkill(fullCaseData.id, lifeSkillPayload);
      // Provide non-blocking feedback instead of a popup
      console.log('Life Skills data saved successfully');
      
      // Reset form
      setLifeSkillsData({
        activity: '',
        dateCompleted: '',
        performanceRating: '',
        notes: ''
      });

      // Refresh the previous activities list
      loadLifeSkills();
    } catch (error) {
      console.error('Error saving life skills data:', error);
      setError('Failed to save life skills data');
    }
  };

  const saveVitalSignsData = async (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    try {
      if (!fullCaseData?.id) {
        setError('Case ID not found');
        console.error('Case ID not found');
        return;
      }

      const vitalSignsPayload = {
        date: vitalSignsData.date,
        bloodPressure: vitalSignsData.bloodPressure ? String(vitalSignsData.bloodPressure).slice(0, 20).trim() : null,
        heartRate: vitalSignsData.heartRate !== '' && vitalSignsData.heartRate !== null ? parseInt(vitalSignsData.heartRate, 10) : null,
        temperature: vitalSignsData.temperature !== '' && vitalSignsData.temperature !== null ? Number(parseFloat(vitalSignsData.temperature).toFixed(1)) : null,
        weight: vitalSignsData.weight !== '' && vitalSignsData.weight !== null ? Number(parseFloat(vitalSignsData.weight).toFixed(1)) : null,
        height: vitalSignsData.height !== '' && vitalSignsData.height !== null ? parseInt(vitalSignsData.height, 10) : null,
        notes: vitalSignsData.notes
      };

      await vitalSignsService.addVitalSigns(fullCaseData.id, vitalSignsPayload);
      // Provide non-blocking feedback instead of a popup
      console.log('Vital Signs data saved successfully');
      
      // Reset form
      setVitalSignsData({
        date: '',
        bloodPressure: '',
        heartRate: '',
        temperature: '',
        weight: '',
        height: '',
        notes: ''
      });

      // Refresh the previous vital signs list
      loadVitalSigns();
    } catch (error) {
      console.error('Error saving vital signs data:', error);
      setError('Failed to save vital signs data');
    }
  };

  // Load Life Skills data
  const loadLifeSkills = useCallback(async () => {
    try {
      if (fullCaseData?.id) {
        const lifeSkills = await lifeSkillsService.getLifeSkills(fullCaseData.id);
        const formattedActivities = lifeSkills.map(skill => ({
          activity: skill.activity,
          date: new Date(skill.date_completed).toLocaleDateString(),
          rating: skill.performance_rating,
          notes: skill.notes
        }));
        setPreviousActivities(formattedActivities);
      }
    } catch (error) {
      console.error('Error loading life skills:', error);
    }
  }, [fullCaseData?.id]);

  // Load Vital Signs data
  const loadVitalSigns = useCallback(async () => {
    try {
      if (fullCaseData?.id) {
        const vitalSigns = await vitalSignsService.getVitalSigns(fullCaseData.id);
        const formattedVitalSigns = vitalSigns.map(vital => ({
          date: new Date(vital.date_recorded).toLocaleDateString(),
          bloodPressure: vital.blood_pressure,
          heartRate: vital.heart_rate,
          temperature: vital.temperature,
          weight: vital.weight,
          height: vital.height,
          notes: vital.notes
        }));
        setPreviousVitalSigns(formattedVitalSigns);
      }
    } catch (error) {
      console.error('Error loading vital signs:', error);
    }
  }, [fullCaseData?.id]);

  // Fetch the complete case data when the component mounts
  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        setLoading(true);
        
        // Check authentication status from context
        if (!isAuthenticated) {
          setError('Authentication required');
          return;
        }
        
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          setError('Authentication required');
          return;
        }
        
        const config = {
          headers: {
            'x-auth-token': token
          }
        };
        
        const response = await axios.get(`${API_BASE}/cases/${caseData.id}`, config);
        setFullCaseData(response.data);
        
        // Initialize form data with recommendation and assessment only
        setFormData(prevState => ({
          ...prevState,
          recommendation: response.data.recommendation || '',
          assessment: response.data.assessment || '',
          birthdate: response.data.birthdate || '',
          clientDescription: response.data.client_description || '',
          parentsDescription: response.data.parents_description || ''
        }));
        
        // Parse checklist if it exists
        if (response.data.checklist) {
          try {
            // Check if checklist is already a string and not empty
            const checklistData = response.data.checklist;
            if (typeof checklistData === 'string' && checklistData.trim() !== '') {
              const parsedChecklist = JSON.parse(checklistData);
              setChecklist(Array.isArray(parsedChecklist) ? parsedChecklist : []);
            } else if (Array.isArray(checklistData)) {
              // If it's already an array, use it directly
              setChecklist(checklistData);
            } else {
              // If it's empty or invalid, set empty array
              setChecklist([]);
            }
          } catch (e) {
            console.error('Error parsing checklist:', e);
            console.log('Checklist data that failed to parse:', response.data.checklist);
            setChecklist([]);
          }
        } else {
          setChecklist([]);
        }

        // Load existing profile picture if it exists
        if (response.data.profile_picture) {
          setProfilePicturePreview(response.data.profile_picture);
        }

        // Load Life Skills and Vital Signs data
        loadLifeSkills();
        loadVitalSigns();
        
      } catch (err) {
        console.error('Error fetching case details:', err);
        setError(err.response?.data?.message || 'Error loading case details');
      } finally {
        setLoading(false);
      }
    };

    fetchCaseDetails();
  }, [caseData.id, isAuthenticated, loadLifeSkills, loadVitalSigns]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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



  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };
      
      // Validate profile picture size (limit to ~1MB base64)
      let processedProfilePicture = profilePicturePreview;
      if (profilePicturePreview && profilePicturePreview.length > 1500000) {
        setError('Profile picture is too large. Please choose a smaller image (max 1MB).');
        setLoading(false);
        return;
      }
      
      // Create a properly formatted update payload
      const updatedCaseData = {
        firstName: fullCaseData.first_name,
        lastName: fullCaseData.last_name,
        middleName: fullCaseData.middle_name,
        sex: fullCaseData.sex,
        birthdate: formData.birthdate || fullCaseData.birthdate,
        status: fullCaseData.status,
        religion: fullCaseData.religion,
        address: fullCaseData.address,
        sourceOfReferral: fullCaseData.source_of_referral,
        caseType: fullCaseData.case_type,
        programType: fullCaseData.program_type,
        problemPresented: fullCaseData.problem_presented,
        briefHistory: fullCaseData.brief_history,
        economicSituation: fullCaseData.economic_situation,
        medicalHistory: fullCaseData.medical_history,
        familyBackground: fullCaseData.family_background,
        clientDescription: formData.clientDescription ?? fullCaseData.client_description,
        parentsDescription: formData.parentsDescription ?? fullCaseData.parents_description,
        // Preserve and update "Other" fields
        otherSourceOfReferral: formData.otherSourceOfReferral ?? fullCaseData?.other_source_of_referral ?? fullCaseData?.otherSourceOfReferral,
        fatherOtherSkills: formData.fatherOtherSkills ?? fullCaseData?.father_other_skills,
        motherOtherSkills: formData.motherOtherSkills ?? fullCaseData?.mother_other_skills,
        guardianOtherSkills: formData.guardianOtherSkills ?? fullCaseData?.guardian_other_skills,
        recommendation: isAdmin ? formData.recommendation : (fullCaseData?.recommendation || ''),
        assessment: isAdmin ? formData.assessment : (fullCaseData?.assessment || ''),
        checklist: JSON.stringify(checklist),
        profilePicture: processedProfilePicture, // Add profile picture to save data
        lastUpdated: new Date().toISOString()
      };
      
      const response = await axios.put(
        `${API_BASE}/cases/${caseData.id}`, 
        updatedCaseData, 
        config
      );
      
      console.log('Case updated successfully:', response.data);
      
      // Format the response data for the case list
      const updatedCase = {
        id: response.data.id,
        name: `${response.data.first_name} ${response.data.last_name}`,
        age: calculateAge(response.data.birthdate),
        programType: response.data.program_type,
        lastUpdated: formatDate(response.data.last_updated || response.data.updated_at),
        profilePicture: response.data.profile_picture, // Include profile picture in the update (camelCase)
        birthdate: response.data.birthdate,
        sex: response.data.sex
      };
      
      if (onCaseUpdated) onCaseUpdated(updatedCase);
      if (onClose) onClose();
    } catch (err) {
      console.error('Detailed error:', err);
      setError(err.response?.data?.message || 'Error updating case');
      console.error('Error updating case:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDischarge = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('⭐ Starting discharge process...');
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };
        
      // Create a properly formatted update payload with status set to archives
      const updatedCaseData = {
        firstName: fullCaseData.first_name,
        lastName: fullCaseData.last_name,
        middleName: fullCaseData.middle_name,
        sex: fullCaseData.sex,
        birthdate: fullCaseData.birthdate,
        status: 'archived', // Using lowercase to match comparison in filter
        religion: fullCaseData.religion,
        address: fullCaseData.address,
        sourceOfReferral: fullCaseData.source_of_referral,
        caseType: fullCaseData.case_type,
        programType: fullCaseData.program_type,
        problemPresented: fullCaseData.problem_presented,
        briefHistory: fullCaseData.brief_history,
        economicSituation: fullCaseData.economic_situation,
        medicalHistory: fullCaseData.medical_history,
        familyBackground: fullCaseData.family_background,
        clientDescription: fullCaseData.client_description,
        parentsDescription: fullCaseData.parents_description,
        // Preserve "Other" fields during discharge
        otherSourceOfReferral: fullCaseData?.other_source_of_referral ?? fullCaseData?.otherSourceOfReferral,
        fatherOtherSkills: fullCaseData?.father_other_skills,
        motherOtherSkills: fullCaseData?.mother_other_skills,
        guardianOtherSkills: fullCaseData?.guardian_other_skills,
        recommendation: formData.recommendation,
        assessment: formData.assessment,
        checklist: JSON.stringify(checklist),
        lastUpdated: new Date().toISOString() // Add explicit timestamp
      };
      
      console.log('⭐ Sending discharge data to API:', updatedCaseData);
      
      const response = await axios.put(
        `${API_BASE}/cases/${caseData.id}`, 
        updatedCaseData, 
        config
      );
      
      console.log('⭐ Case discharged successfully:', response.data);
      
      // Format the response data for the case list
      const updatedCase = {
        id: response.data.id,
        name: `${response.data.first_name} ${response.data.last_name}`,
        age: calculateAge(response.data.birthdate),
        programType: response.data.program_type,
        status: 'archived', // Keep consistent with the API call
        lastUpdated: formatDate(response.data.last_updated || response.data.updated_at),
        profile_picture: response.data.profile_picture // Include profile picture in the update
      };
      
      // Hide modal and return to case list
      setShowDischargeModal(false);
      
      updateCase(updatedCase);
      navigate('/archived-cases', { state: { triggerRefresh: true } });
      if (onCaseUpdated) onCaseUpdated(updatedCase);
      if (onClose) onClose();
      
    } catch (err) {
      console.error('⭐ Error during discharge:', err);
      setError(err.response?.data?.message || 'Error discharging case');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !fullCaseData) {
    return (
      <div className="container-fluid py-4" style={{ backgroundColor: '#f8fafc', minHeight: '96vh' }}>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-dark mt-3">Loading case details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8fafc', minHeight: '96vh' }}>
      {showDischargeModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" 
             style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="card shadow-sm p-4 mx-2" style={{ maxWidth: '400px' }}>
            <div className="text-center mb-3">
              <i className="fas fa-check-circle text-success" style={{ fontSize: '2rem' }}></i>
              <h5 className="mt-2">Discharge Confirmation</h5>
            </div>
            <p className="text-center">
              Are you sure you want to discharge this case?
            </p>
            <div className="d-flex justify-content-center gap-2 mt-3">
              <button 
                className="btn btn-outline-secondary" 
                onClick={() => setShowDischargeModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-success" 
                onClick={handleDischarge}
              >
                Confirm Discharge
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-dark fw-bold">EDIT CASE</h2>
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

      {error && (
        <div className="alert alert-danger mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row">
          {/* Enhanced Case Details Section */}
          <div className="col-md-8 mb-4">
            <div className="card border-0 shadow-sm rounded-4 bg-white">
              <div className="card-header bg-primary text-white py-3">
                <h5 className="mb-0 fw-bold">CASE DETAILS</h5>
              </div>
              <div className="card-body p-4">
                {/* Name Section with Enhanced Styling */}
                <div className="mb-4">
                  <label className="form-label fw-bold mb-2">Full Name</label>
                  <div className="p-3 bg-light rounded-2 border">
                    <h6 className="text-primary mb-0">
                      {fullCaseData ? `${fullCaseData.first_name || ''} ${fullCaseData.middle_name || ''} ${fullCaseData.last_name || ''}`.trim() : 'Loading...'}
                    </h6>
                  </div>
                </div>
                
                {/* Basic Information Grid */}
                <div className="row mb-4">
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-semibold text-secondary">
                      <i className="fas fa-birthday-cake me-2 text-info"></i>Age
                    </label>
                    <div className="p-3 bg-white rounded-2 border shadow-sm">
                      <span className="text-dark">{formData.birthdate ? calculateAge(formData.birthdate) : 'N/A'}</span>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-semibold text-secondary">
                      <i className="fas fa-venus-mars me-2 text-info"></i>Sex
                    </label>
                    <div className="p-3 bg-white rounded-2 border shadow-sm">
                      <span className="text-dark">{fullCaseData?.sex || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-semibold text-secondary">
                      <i className="fas fa-calendar-alt me-2 text-info"></i>Birthdate
                    </label>
                    <input
                      type="date"
                      name="birthdate"
                      value={formData.birthdate ? new Date(formData.birthdate).toISOString().split('T')[0] : ''}
                      onChange={handleChange}
                      className="form-control p-3 border shadow-sm"
                      style={customInputStyle}
                    />
                  </div>
                </div>

                {/* Additional Details Grid */}
                <div className="row mb-4">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold text-secondary">
                      <i className="fas fa-map-marker-alt me-2 text-warning"></i>Address
                    </label>
                    <div className="p-3 bg-white rounded-2 border shadow-sm">
                      <span className="text-dark">{fullCaseData?.address || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold text-secondary">
                      <i className="fas fa-pray me-2 text-warning"></i>Religion
                    </label>
                    <div className="p-3 bg-white rounded-2 border shadow-sm">
                      <span className="text-dark">{fullCaseData?.religion || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Source of Referral */}
                <div className="mb-4">
                  <label className="form-label fw-semibold text-secondary">
                    <i className="fas fa-share-alt me-2 text-success"></i>Source of Referral
                  </label>
                  <div className="p-3 bg-white rounded-2 border shadow-sm">
                    <span className="text-dark">{fullCaseData?.source_of_referral || fullCaseData?.sourceOfReferral || 'N/A'}</span>
                  </div>
                </div>

                {/* Program and Status Row */}
                <div className="row">
                  <div className="col-md-8 mb-3">
                    <label className="form-label fw-semibold text-secondary">
                      <i className="fas fa-briefcase me-2 text-primary"></i>Program
                    </label>
                    <div className="p-3 bg-gradient-light rounded-2 border shadow-sm">
                      <span className="fw-bold text-primary" style={{ fontSize: '1.1rem' }}>
                        {formData.programType || 'Not specified'}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-semibold text-secondary">
                      <i className="fas fa-check-circle me-2 text-success"></i>Status
                    </label>
                    <div className="p-2 text-center">
                      <span className="badge bg-success px-4 py-2 rounded-pill shadow-sm" 
                            style={{ fontSize: '1rem', fontWeight: '600' }}>
                        <i className="fas fa-check-circle me-2"></i>
                        Active
                      </span>
                      <div className="mt-1">
                        <small className="text-muted">Currently being managed</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Profile Picture Upload Section */}
          <div className="col-md-4 mb-4">
            <div className="card border-0 shadow-sm rounded-4 bg-white h-100 d-flex flex-column">
              <div className="card-header bg-primary text-white py-2">
                <h6 className="mb-0 fw-bold">PROFILE PICTURE</h6>
              </div>
              <div className="card-body p-2 text-center d-flex flex-column flex-grow-1">
                <div className="flex-grow-1 d-flex flex-column mb-2" style={{ height: '400px' }}>
                  {profilePicturePreview ? (
                    <div className="position-relative d-inline-block w-100" style={{ height: '400px' }}>
                      <img 
                        src={profilePicturePreview} 
                        alt="Profile Preview" 
                        className="border border-2 shadow-sm w-100"
                        style={{ 
                          objectFit: 'cover', 
                          borderRadius: '8px', 
                          height: '400px',
                          maxWidth: '100%'
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-danger position-absolute top-0 end-0 rounded-circle shadow-sm"
                        style={{ width: '36px', height: '36px', fontSize: '16px', transform: 'translate(25%, -25%)' }}
                        onClick={removePicture}
                        title="Remove picture"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="d-flex align-items-center justify-content-center bg-light border border-2 border-dashed border-primary shadow-sm w-100"
                      style={{ 
                        borderRadius: '8px', 
                        height: '400px',
                        maxWidth: '100%'
                      }}
                    >
                      <div className="text-center">
                        <i className="fas fa-camera text-primary mb-3" style={{ fontSize: '64px' }}></i>
                        <div className="text-primary fw-bold mb-2" style={{ fontSize: '18px' }}>
                          Click to upload
                        </div>
                        <div className="text-muted mb-2" style={{ fontSize: '14px' }}>
                          Drag & drop or browse files
                        </div>
                        <div className="text-muted" style={{ fontSize: '12px' }}>
                          Maximum file size: 5MB
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-auto">
                  <input
                    type="file"
                    id="profilePicture"
                    accept="image/*"
                    onChange={handlePictureChange}
                    className="form-control shadow-sm"
                    style={{ borderRadius: '6px', fontSize: '14px', ...customInputStyle }}
                  />
                  <small className="text-muted mt-1 d-block" style={{ fontSize: '12px' }}>
                    <i className="fas fa-info-circle me-1"></i>
                    JPG, PNG, or GIF
                  </small>
                </div>
              </div>
            </div>
        </div>
      </div>

        {/* Intake Descriptions Section */}
        <div className="row">
          <div className="col-12 mb-4">
            <div className="card border-0 shadow-sm rounded-4 bg-white">
              <div className="card-header bg-primary text-white py-3">
                <h5 className="mb-0 fw-bold">INTAKE DESCRIPTIONS</h5>
              </div>
              <div className="card-body p-4">
                <div className="row">
                  <div className="col-md-6 mb-4">
                    <label htmlFor="clientDescription" className="form-label fw-bold text-primary mb-3" style={{ fontSize: '1.1rem' }}>
                      <i className="fas fa-user me-2"></i>Brief Description of the Client
                    </label>
                    <textarea
                      id="clientDescription"
                      name="clientDescription"
                      value={formData.clientDescription}
                      onChange={handleChange}
                      className="form-control form-control-lg shadow-sm"
                      rows="6"
                      placeholder="Enter brief description of the client upon intake..."
                      style={{ 
                        borderRadius: '12px',
                        border: '2px solid #e3f2fd',
                        fontSize: '1rem',
                        lineHeight: '1.6'
                      }}
                    ></textarea>
                  </div>
                  <div className="col-md-6 mb-4">
                    <label htmlFor="parentsDescription" className="form-label fw-bold text-primary mb-3" style={{ fontSize: '1.1rem' }}>
                      <i className="fas fa-users me-2"></i>Parents' Description
                    </label>
                    <textarea
                      id="parentsDescription"
                      name="parentsDescription"
                      value={formData.parentsDescription}
                      onChange={handleChange}
                      className="form-control form-control-lg shadow-sm"
                      rows="6"
                      placeholder="Enter parents' description upon intake..."
                      style={{ 
                        borderRadius: '12px',
                        border: '2px solid #e8f5e8',
                        fontSize: '1rem',
                        lineHeight: '1.6'
                      }}
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Assessment and Progress Section */}
        <div className="row">
          <div className="col-12 mb-4">
            <div className="card border-0 shadow-sm rounded-4 bg-white">
              <div className="card-header bg-primary text-white py-3">
                <h5 className="mb-0 fw-bold">ASSESSMENT & PROGRESS</h5>
              </div>
              <div className="card-body p-4">
                <div className="row">
                  <div className="col-md-6 mb-4">
                    <label htmlFor="assessment" className="form-label fw-bold text-primary mb-3" style={{ fontSize: '1.1rem' }}>
                      <i className="fas fa-stethoscope me-2"></i>Assessment
                    </label>
                    <textarea
                      id="assessment"
                      name="assessment"
                      value={formData.assessment}
                      onChange={handleChange}
                      className="form-control form-control-lg shadow-sm"
                      rows="6"
                      placeholder="Enter detailed assessment notes..."
                      style={{ 
                        borderRadius: '12px',
                        border: '2px solid #e3f2fd',
                        fontSize: '1rem',
                        lineHeight: '1.6'
                      }}
                    ></textarea>
                  </div>
                  
                  <div className="col-md-6 mb-4">
                    <label htmlFor="recommendation" className="form-label fw-bold text-primary mb-3" style={{ fontSize: '1.1rem' }}>
                      <i className="fas fa-lightbulb me-2"></i>Recommendation
                    </label>
                    <textarea
                      id="recommendation"
                      name="recommendation"
                      value={formData.recommendation}
                      onChange={handleChange}
                      className="form-control form-control-lg shadow-sm"
                      rows="6"
                      placeholder="Enter recommendations and next steps..."
                      style={{ 
                        borderRadius: '12px',
                        border: '2px solid #e8f5e8',
                        fontSize: '1rem',
                        lineHeight: '1.6'
                      }}
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Life Skills and Vital Signs Section */}
        <div className="row">
          <div className="col-12 mb-4">
            <div className="card border-0 shadow-sm rounded-4 bg-white">
              <div className="card-header bg-primary text-white py-3 position-relative">
                <h5 className="mb-0 fw-bold">LIFE SKILLS & VITAL SIGNS</h5>
                <button
                  type="button"
                  className="btn btn-light btn-sm position-absolute top-50 end-0 translate-middle-y me-3"
                  onClick={() => setShowLifeSkillsDetails(!showLifeSkillsDetails)}
                  style={{ width: '32px', height: '32px', padding: '0' }}
                >
                  <i className={`fas fa-${showLifeSkillsDetails ? 'minus' : 'plus'}`}></i>
                </button>
              </div>
              <div className="card-body p-4">
                {showLifeSkillsDetails && (
                  <div>
                    {/* Tab Navigation */}
                    <ul className="nav nav-tabs mb-4" id="lifeSkillsVitalSignsTabs" role="tablist">
                      <li className="nav-item" role="presentation">
                        <button
                          className={`nav-link ${activeTab === 'lifeSkills' ? 'active' : ''}`}
                          id="life-skills-tab"
                          type="button"
                          role="tab"
                          onClick={() => setActiveTab('lifeSkills')}
                        >
                          <i className="fas fa-brain me-2"></i>Life Skills
                        </button>
                      </li>
                      <li className="nav-item" role="presentation">
                        <button
                          className={`nav-link ${activeTab === 'vitalSigns' ? 'active' : ''}`}
                          id="vital-signs-tab"
                          type="button"
                          role="tab"
                          onClick={() => setActiveTab('vitalSigns')}
                        >
                          <i className="fas fa-heartbeat me-2"></i>Vital Signs
                        </button>
                      </li>
                    </ul>

                    {/* Tab Content */}
                    <div className="tab-content" id="lifeSkillsVitalSignsTabContent">
                  {/* Life Skills Tab */}
                  {activeTab === 'lifeSkills' && (
                    <div className="tab-pane fade show active">
                      <form onSubmit={saveLifeSkillsData} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}>
                        <div className="row">
                          <div className="col-md-6 mb-3">
        <label htmlFor="activity" className="form-label fw-semibold">Activity:</label>
                            <input
                              type="text"
                              id="activity"
                              name="activity"
                              value={lifeSkillsData.activity}
                              onChange={handleLifeSkillsChange}
                              className="form-control"
                              style={customInputStyle}
                              placeholder="Enter activity"
                              required
                            />
                          </div>
                          <div className="col-md-6 mb-3">
        <label htmlFor="dateCompleted" className="form-label fw-semibold">Date Completed:</label>
                            <input
                              type="date"
                              id="dateCompleted"
                              name="dateCompleted"
                              value={lifeSkillsData.dateCompleted}
                              onChange={handleLifeSkillsChange}
                              className="form-control"
                              style={customInputStyle}
                              required
                            />
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-6 mb-3">
        <label htmlFor="performanceRating" className="form-label fw-semibold">Performance Rating:</label>
                            <select
                              id="performanceRating"
                              name="performanceRating"
                              value={lifeSkillsData.performanceRating}
                              onChange={handleLifeSkillsChange}
                              className="form-select"
                              style={customSelectStyle}
                              required
                            >
                              <option value="">Select rating</option>
                              {performanceRatings.map((rating, index) => (
                                <option key={index} value={rating}>{rating}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-6 mb-3">
                            <label htmlFor="lifeSkillsNotes" className="form-label fw-semibold">Notes:</label>
                            <textarea
                              id="lifeSkillsNotes"
                              name="notes"
                              value={lifeSkillsData.notes}
                              onChange={handleLifeSkillsChange}
                              className="form-control"
                              rows="3"
                              placeholder="Additional observations..."
                            ></textarea>
                          </div>
                        </div>
                        <div className="d-flex justify-content-end mb-4">
                          <button type="button" className="btn btn-primary" onClick={saveLifeSkillsData}>Save Life Skills Data</button>
                        </div>
                      </form>

                      {/* Previous Activities */}
                      <div className="mt-4">
                        <h6 className="fw-bold text-primary mb-3">Previous Activities</h6>
                        {previousActivities.length > 0 ? (
                          <div className="row">
                            {previousActivities.map((activity, index) => (
                              <div key={index} className="col-md-6 mb-3">
                                <div className="card border-light">
                                  <div className="card-body p-3">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                      <h6 className="card-title mb-0">{activity.activity}</h6>
                                      <small className="text-muted">{activity.date}</small>
                                    </div>
                                    <span className="badge bg-success mb-2">{activity.rating}</span>
                                    {activity.notes && <p className="card-text small text-muted mb-0">{activity.notes}</p>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted fst-italic">No previous activities recorded yet.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Vital Signs Tab */}
                  {activeTab === 'vitalSigns' && (
                    <div className="tab-pane fade show active">
                      <form onSubmit={saveVitalSignsData} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}>
                        <div className="row">
                          <div className="col-md-6 mb-3">
        <label htmlFor="vitalSignsDate" className="form-label fw-semibold">Date:</label>
                            <input
                              type="date"
                              id="vitalSignsDate"
                              name="date"
                              value={vitalSignsData.date}
                              onChange={handleVitalSignsChange}
                              className="form-control"
                              required
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label htmlFor="bloodPressure" className="form-label fw-semibold">Blood Pressure:</label>
                            <input
                              type="text"
                              id="bloodPressure"
                              name="bloodPressure"
                              value={vitalSignsData.bloodPressure}
                              onChange={handleVitalSignsChange}
                              className="form-control"
                              placeholder="120/80"
                              maxLength={20}
                            />
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label htmlFor="heartRate" className="form-label fw-semibold">Heart Rate (BPM):</label>
                            <input
                              type="number"
                              id="heartRate"
                              name="heartRate"
                              value={vitalSignsData.heartRate}
                              onChange={handleVitalSignsChange}
                              className="form-control"
                              placeholder="72"
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label htmlFor="temperature" className="form-label fw-semibold">Temperature (°C):</label>
                            <input
                              type="number"
                              step="0.1"
                              id="temperature"
                              name="temperature"
                              value={vitalSignsData.temperature}
                              onChange={handleVitalSignsChange}
                              className="form-control"
                              placeholder="36.5"
                            />
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label htmlFor="weight" className="form-label fw-semibold">Weight (KG):</label>
                            <input
                              type="number"
                              step="0.1"
                              id="weight"
                              name="weight"
                              value={vitalSignsData.weight}
                              onChange={handleVitalSignsChange}
                              className="form-control"
                              placeholder="50.0"
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label htmlFor="height" className="form-label fw-semibold">Height (CM):</label>
                            <input
                              type="number"
                              id="height"
                              name="height"
                              value={vitalSignsData.height}
                              onChange={handleVitalSignsChange}
                              className="form-control"
                              placeholder="160"
                            />
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-12 mb-3">
                            <label htmlFor="vitalSignsNotes" className="form-label fw-semibold">Notes:</label>
                            <textarea
                              id="vitalSignsNotes"
                              name="notes"
                              value={vitalSignsData.notes}
                              onChange={handleVitalSignsChange}
                              className="form-control"
                              rows="3"
                              placeholder="Additional health observations..."
                            ></textarea>
                          </div>
                        </div>
                        <div className="d-flex justify-content-end mb-4">
                          <button type="button" className="btn btn-primary" onClick={saveVitalSignsData}>Save Vital Signs Data</button>
                        </div>
                      </form>

                      {/* Previous Vital Signs */}
                      <div className="mt-4">
                        <h6 className="fw-bold text-primary mb-3">Previous Vital Signs</h6>
                        {previousVitalSigns.length > 0 ? (
                          <div className="row">
                            {previousVitalSigns.map((vitals, index) => (
                              <div key={index} className="col-md-6 mb-3">
                                <div className="card border-light">
                                  <div className="card-body p-3">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                      <h6 className="card-title mb-0">Vital Signs</h6>
                                      <small className="text-muted">{vitals.date}</small>
                                    </div>
                                    <div className="small">
                                      <p className="mb-1"><strong>BP:</strong> {vitals.bloodPressure}</p>
                                      <p className="mb-1"><strong>HR:</strong> {vitals.heartRate} BPM</p>
                                      <p className="mb-1"><strong>Temp:</strong> {vitals.temperature}°C</p>
                                      <p className="mb-1"><strong>Weight:</strong> {vitals.weight} KG</p>
                                      <p className="mb-1"><strong>Height:</strong> {vitals.height} CM</p>
                                      {vitals.notes && <p className="text-muted mb-0">{vitals.notes}</p>}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted fst-italic">No vital signs recorded yet.</p>
                        )}
                      </div>
                    </div>
                  )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="row">
          <div className="col-12 mb-4">
            <div className="card border-0 shadow-sm rounded-4 bg-white">
              <div className="card-header bg-primary text-white py-3">
                <h5 className="mb-0 fw-bold">INTERVENTION PLAN</h5>
              </div>
              <div className="card-body p-4">
                <textarea
                  className="form-control mb-3"
                  rows="8"
                  placeholder="Add intervention plan details..."
                  value={checklist.map(item => item.text).join('\n')}
                  onChange={(e) => {
                    const lines = e.target.value.split('\n');
                    const updated = lines
                      .map(line => line.trim())
                      .filter(line => line.length > 0)
                      .map(line => {
                        const text = line; // keep text as typed, no auto bullet manipulation
                        const existing = checklist.find(item => item.text === text);
                        return existing ? existing : { text, timestamp: new Date().toLocaleString() };
                      });
                    setChecklist(updated);
                  }}
                ></textarea>
                
                {/* Checklist preview removed to avoid popup while typing. Data is still captured in checklist state. */}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex justify-content-between mt-4">
          <div>
            {isAdmin && (
              <button
                type="button"
                className="btn btn-danger me-2"
                onClick={() => setShowDischargeModal(true)}
              >
                Discharge Case
              </button>
            )}
          </div>
          <div>
            <button
              type="button"
              className="btn btn-outline-light me-2"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-success"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditCaseForm;