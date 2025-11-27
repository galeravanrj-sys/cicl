import React, { useState, useRef, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE } from '../utils/apiBase';

const Settings = () => {
  const { userProfile, setUserProfile, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    firstName: userProfile?.firstName || '',
    lastName: userProfile?.lastName || '',
    middleName: userProfile?.middleName || '',
    email: userProfile?.email || '',
    password: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileImage, setProfileImage] = useState(userProfile?.profileImage || null);
  const [imageError, setImageError] = useState('');
  const [isHovering, setIsHovering] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Image constraints - updated to 10MB and 1000x1000 pixels
  const maxImageSize = 10 * 1024 * 1024; // 10MB
  const acceptedFileTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const maxDimensions = { width: 1000, height: 1000 }; // Max 1000x1000 pixels

  // Handle navigation from notifications for archived cases
  useEffect(() => {
    if (location.state) {
      const { highlightCaseId: navHighlightId } = location.state;
      
      if (navHighlightId) {
        // Show a message or highlight functionality for archived cases
        console.log('Navigated to Settings for archived case:', navHighlightId);
        // TODO: Implement archived case highlighting in Settings
      }
      
      // Clear the navigation state to prevent issues on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleImageClick = () => {
    if (!isEditing) return;
    fileInputRef.current.click();
  };

  // Convert file to base64 string for persistent storage
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    if (!acceptedFileTypes.includes(file.type)) {
      setImageError(`Invalid file type. Please upload ${acceptedFileTypes.map(type => type.split('/')[1]).join(', ')} files only.`);
      return;
    }

    // Check file size
    if (file.size > maxImageSize) {
      setImageError(`File is too large. Maximum size is ${maxImageSize / (1024 * 1024)}MB.`);
      return;
    }

    // Check image dimensions
    const img = new Image();
    img.onload = async () => {
      URL.revokeObjectURL(img.src);
      if (img.width > maxDimensions.width || img.height > maxDimensions.height) {
        setImageError(`Image dimensions must not exceed ${maxDimensions.width}x${maxDimensions.height} pixels.`);
        return;
      }

      try {
        // Convert image to base64 for persistent storage
        const base64Image = await convertToBase64(file);
        setProfileImage(base64Image);
        
        // We'll save the image with the rest of the profile data when form is submitted
        setImageError('');
      } catch (error) {
        console.error("Error converting image:", error);
        setImageError("Failed to process image. Please try again.");
      }
    };
    img.src = URL.createObjectURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Update user profile with form data and profile image
    const updatedProfile = {
      ...userProfile,
      firstName: formData.firstName,
      lastName: formData.lastName,
      middleName: formData.middleName,
      email: formData.email,
      profileImage: profileImage
    };
    
    // Update context state
    setUserProfile(updatedProfile);
    
    // Save to localStorage for persistence across sessions
    try {
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      
      // Also update the userProfiles collection if user has an email
      if (updatedProfile.email) {
        const allProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
        allProfiles[updatedProfile.email] = updatedProfile;
        localStorage.setItem('userProfiles', JSON.stringify(allProfiles));
      }
      
      setSaveSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
    }

    // If user entered a new password, attempt to set it
    if (formData.newPassword) {
      setPasswordError('');
      setPasswordSuccess('');
      
      // Validate current password is provided
      if (!formData.password) {
        setPasswordError('Current password is required');
        return;
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        setPasswordError('New password and confirmation do not match');
        return;
      }
      if (formData.newPassword.length < 6) {
        setPasswordError('New password must be at least 6 characters');
        return;
      }

      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const res = await fetch(`${API_BASE}/auth/set-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          },
          body: JSON.stringify({
            currentPassword: formData.password,
            newPassword: formData.newPassword
          })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to update password');
        }
        setPasswordSuccess('Password updated successfully');
        setFormData({ ...formData, password: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setPasswordSuccess(''), 3000);
      } catch (err) {
        setPasswordError(err.message || 'Error updating password');
      }
    }
  };

  const handleSignOut = () => {
    logout();
    // Redirect to Landing Page after logout per test scenario
    navigate('/');
  };

  return (
    <div className="container-fluid p-0" style={{ backgroundColor: '#f8fafc', minHeight: '96vh' }}>
      <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2 p-3">
        <h2 className="mb-0 text-dark">Settings</h2>
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={() => setIsEditing((v) => !v)}
          style={{ minWidth: '90px' }}
        >
          {isEditing ? 'Done' : 'Edit'}
        </button>
      </div>
      <div className="row justify-content-center mx-0">
        <div className="col-md-8">
          {/* Profile Settings Card */}
          <div className="card border-0 shadow-sm rounded-4 mb-4" style={{ backgroundColor: '#  ' }}>
            <div className="card-body p-3">
              <div className="text-center mb-3">
                <div className="avatar-upload mb-2">
                  <div 
                    className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center position-relative" 
                    style={{ width: '100px', height: '100px', cursor: 'pointer', overflow: 'hidden' }}
                    onClick={handleImageClick}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                  >
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-100 h-100 object-fit-cover" />
                  ) : (
                    <i className="fas fa-user fa-3x text-secondary"></i>
                  )}
                    
                    {isHovering && (
                      <div className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center" 
                           style={{ 
                             backgroundColor: 'rgba(0,0,0,0.5)', 
                             top: 0, 
                             left: 0 
                           }}>
                        <div className="text-dark">
                          <i className="fas fa-camera"></i>
                          <small className="d-block">Click to change</small>
                        </div>
                      </div>
                    )}
                    
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="d-none" 
                    accept={acceptedFileTypes.join(',')}
                    onChange={handleImageChange}
                  />
                  </div>
                  {imageError && <small className="text-danger d-block mt-2">{imageError}</small>}
                </div>
                <h4 className="mb-0 text-dark">Profile Settings</h4>
              </div>

              {saveSuccess && (
                <div className="alert alert-success text-center py-2 mb-3" role="alert">
                  Profile saved successfully!
                </div>
              )}

              {(passwordSuccess || passwordError) && (
                <div className={`alert ${passwordError ? 'alert-danger' : 'alert-success'} text-center py-2 mb-3`} role="alert">
                  {passwordError || passwordSuccess}
                </div>
              )}

              <form onSubmit={handleSubmit} className="row g-2">
                <div className="col-md-6">
                  <label className="form-label small text-dark">First Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small text-dark">Last Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small text-dark">Middle Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small text-dark">Email</label>
                  <input
                    type="email"
                    className="form-control form-control-sm"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>

                {isEditing && (
                <div className="col-12">
                  <label className="form-label small text-dark">Set Password</label>
                  <input
                    type="password"
                    className="form-control form-control-sm"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
                )}
                {isEditing && (
                <div className="col-md-6">
                  <label className="form-label small text-dark">New Password</label>
                  <input
                    type="password"
                    className="form-control form-control-sm"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                  />
                </div>
                )}
                {isEditing && (
                <div className="col-md-6">
                  <label className="form-label small text-dark">Confirm Password</label>
                  <input
                    type="password"
                    className="form-control form-control-sm"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
                )}

                <div className="col-12 d-flex justify-content-between align-items-center mt-4">
                  <button 
                    type="button" 
                    className="btn btn-danger btn-sm px-4"
                    onClick={handleSignOut}
                  >
                    <i className="fas fa-sign-out-alt me-2"></i>
                    Sign Out
                  </button>

                  {isEditing && (
                    <button type="submit" className="btn btn-light btn-sm px-4">
                      Save Changes
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
