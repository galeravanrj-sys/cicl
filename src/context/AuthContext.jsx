import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_BASE } from '../utils/apiBase';

export const AuthContext = createContext();

// Add a custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add profile state
  const [userProfile, setUserProfile] = useState(() => {
    // Try to load from localStorage on initial render
    const savedProfile = localStorage.getItem('userProfile');
    return savedProfile ? JSON.parse(savedProfile) : {
      firstName: '',
      lastName: '',
      middleName: '',
      email: '',
      profileImage: null
    };
  });

  // Load user from token on initial render
  useEffect(() => {
    const loadUser = async () => {
      // Check for token in URL (e.g., after Google OAuth redirect)
      try {
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get('token');
        const rememberParam = params.get('remember');
        const googleName = params.get('name');
        const googleEmail = params.get('email');
        const googlePicture = params.get('picture');
        if (urlToken) {
          if (rememberParam === '1') {
            localStorage.setItem('token', urlToken);
            sessionStorage.removeItem('token');
          } else {
            sessionStorage.setItem('token', urlToken);
            localStorage.removeItem('token');
          }
          axios.defaults.headers.common['x-auth-token'] = urlToken;
          axios.defaults.headers.common['Authorization'] = `Bearer ${urlToken}`;

          // If Google profile fields are present, initialize userProfile immediately
          try {
            if (googleEmail && (googleName || googlePicture)) {
              const first = (googleName || '').split(' ')[0] || '';
              const last = (googleName || '').split(' ').slice(1).join(' ') || '';
              const initialProfile = {
                firstName: first,
                lastName: last,
                middleName: '',
                email: googleEmail,
                profileImage: googlePicture || null
              };
              const allProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
              allProfiles[googleEmail] = initialProfile;
              localStorage.setItem('userProfiles', JSON.stringify(allProfiles));
              // Also persist a session-level profile for immediate rehydration on refresh
              localStorage.setItem('userProfile', JSON.stringify(initialProfile));
              setUserProfile(initialProfile);
            }
          } catch (e) {
            console.warn('Failed to initialize Google profile from URL:', e?.message || e);
          }
          
          // Set authentication state immediately for Google OAuth
          setIsAuthenticated(true);
          
          // Clean query params from URL and redirect to dashboard
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, '', cleanUrl);
          
          // Redirect to dashboard after Google OAuth login
          if (window.location.pathname === '/login' || window.location.pathname === '/') {
            window.location.href = '/dashboard';
          }
        }
      } catch (e) {
        console.warn('Failed to process URL token params:', e?.message || e);
      }
      // Support persistent (localStorage) and session-only (sessionStorage) tokens
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        console.log('No token found in storage');
        setLoading(false);
        return;
      }
      
      try {
        // Set default headers for all requests
        axios.defaults.headers.common['x-auth-token'] = token;
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('Attempting to verify token with backend');
        
        // Try the new verification endpoint first
        try {
          await axios.get(`${API_BASE}/auth/verify-token`);
          console.log('Token verified through verify-token endpoint');
          setIsAuthenticated(true);

          // Fetch user details so UI (e.g., Sidebar) has name/role
          try {
            const meRes = await axios.get(`${API_BASE}/auth/me`);
            setUser(meRes.data);

            // Load the profile for this user's email, or create one from server data
            const allProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
            if (meRes.data && meRes.data.email) {
              let prof = allProfiles[meRes.data.email];
              
              // Preserve existing profile image if it exists
              const existingProfileImage = prof?.profileImage || null;
              
              // If no profile exists or profile is missing first/last name, create/update from server data
              if (!prof || !prof.firstName || !prof.lastName) {
                prof = {
                  firstName: meRes.data.first_name || '',
                  lastName: meRes.data.last_name || '',
                  middleName: prof?.middleName || '',
                  email: meRes.data.email,
                  profileImage: existingProfileImage
                };
                allProfiles[meRes.data.email] = prof;
                localStorage.setItem('userProfiles', JSON.stringify(allProfiles));
              }
              
              setUserProfile(prof);
              localStorage.setItem('userProfile', JSON.stringify(prof));
            }
          } catch (meErr) {
            console.warn('Unable to fetch user details after verify-token:', meErr?.message || meErr);
          }
        } catch (verifyErr) {
          console.log('verify-token endpoint failed, falling back to /me endpoint');
          // Fall back to the original /me endpoint
          const res = await axios.get(`${API_BASE}/auth/me`);
          console.log('Token verification successful, user loaded:', res.data);
          
          setUser(res.data);
          setIsAuthenticated(true);
          
          // Load the profile for this user's email, or create one from server data
          const allProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
          if (res.data && res.data.email) {
            let prof = allProfiles[res.data.email];
            
            // Preserve existing profile image if it exists
            const existingProfileImage = prof?.profileImage || null;
            
            // If no profile exists or profile is missing first/last name, create/update from server data
            if (!prof || !prof.firstName || !prof.lastName) {
              prof = {
                firstName: res.data.first_name || '',
                lastName: res.data.last_name || '',
                middleName: prof?.middleName || '',
                email: res.data.email,
                profileImage: existingProfileImage
              };
              allProfiles[res.data.email] = prof;
              localStorage.setItem('userProfiles', JSON.stringify(allProfiles));
            }
            
            setUserProfile(prof);
            localStorage.setItem('userProfile', JSON.stringify(prof));
          }
        }
      } catch (err) {
        console.error('Token verification failed:', err.response?.status, err.response?.data?.message || err.message);
        
        // Always clear the error state first to ensure UI updates
        setError(null);
        
        if (err.message === 'Network Error') {
          console.log('Network error occurred, server may be down');
          setError('Unable to connect to the server. Please check your connection or try again later.');
          
          // For network errors, keep token and assume user is authenticated
          // This allows offline access to the app
          setIsAuthenticated(true);
        } else if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          console.log('Removing invalid token from storage');
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          delete axios.defaults.headers.common['x-auth-token'];
          delete axios.defaults.headers.common['Authorization'];
          // Map backend messages to clearer UI text
          const backendMsg = (err.response?.data?.message || '').toLowerCase();
          if (backendMsg.includes('session is not active') || backendMsg.includes('terminated') || backendMsg.includes('unable to validate session')) {
            setError("You’ve been logged in elsewhere. Please log in again.");
          } else if (backendMsg.includes('expired')) {
            setError('Your session has expired. Please login again.');
          } else if (backendMsg.includes('invalid token') || backendMsg.includes('not valid')) {
            setError('Authentication failed. Please log in again.');
          } else {
            setError('Authentication failed. Please log in again.');
          }
          setIsAuthenticated(false);
        } else {
          console.log('Other error, keeping token');
          // For other errors, keep the token but show error message
          setError('Unable to verify your login. Please try again later.');
          // Assume user is authenticated to prevent immediate logout on temporary issues
          setIsAuthenticated(true);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

  // Register user
  const register = async (userData) => {
    try {
      setLoading(true);
      console.log('Attempting to register:', userData.email);
      const res = await axios.post(`${API_BASE}/auth/register`, userData);
      
      console.log('Registration successful, saving token');
      // Persist token based on remember flag
      if (userData.remember) {
        localStorage.setItem('token', res.data.token);
        sessionStorage.removeItem('token');
      } else {
        sessionStorage.setItem('token', res.data.token);
        localStorage.removeItem('token');
      }
      axios.defaults.headers.common['x-auth-token'] = res.data.token;
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      
      setUser(res.data.user);
      setIsAuthenticated(true);
      setError(null);
      console.log('Authentication state set to true after registration');
      
      // Create initial profile for this user
      if (res.data.user && res.data.user.email) {
        // Use provided form data first, then fallback to server data
        const displayName = res.data.user.name || res.data.user.username || '';
        const initialProfile = {
          firstName: userData.firstName || (displayName ? displayName.split(' ')[0] : ''),
          lastName: userData.lastName || (displayName ? displayName.split(' ').slice(1).join(' ') : ''),
          middleName: '',
          email: res.data.user.email,
          profileImage: null
        };
        
        // Save to profiles by email
        const allProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
        allProfiles[res.data.user.email] = initialProfile;
        localStorage.setItem('userProfiles', JSON.stringify(allProfiles));
        
        setUserProfile(initialProfile);
      }
      
      return true;
    } catch (err) {
      console.error('Registration failed:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (userData) => {
    try {
      setLoading(true);
      console.log('Attempting to login:', userData.email);
      const res = await axios.post(`${API_BASE}/auth/login`, userData);
      
      console.log('Login successful, saving token');
      // Persist token based on remember flag
      if (userData.remember) {
        localStorage.setItem('token', res.data.token);
        sessionStorage.removeItem('token');
      } else {
        sessionStorage.setItem('token', res.data.token);
        localStorage.removeItem('token');
      }
      axios.defaults.headers.common['x-auth-token'] = res.data.token;
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      
      setUser(res.data.user);
      setIsAuthenticated(true);
      setError(null);

      // Immediately fetch full user details (including role)
      try {
        const meRes = await axios.get(`${API_BASE}/auth/me`);
        setUser(meRes.data);
      } catch (meErr) {
        console.warn('Unable to fetch full user details after login:', meErr?.message || meErr);
      }
      
      // Load the profile for this email, or create one from server data
      if (res.data.user && res.data.user.email) {
        const allProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
        
        let prof = allProfiles[res.data.user.email];
        
        // If no profile exists or profile is missing first/last name, create/update from server data
        if (!prof || !prof.firstName || !prof.lastName) {
          // Use server data if available, otherwise fall back to name/username parsing
          const firstName = res.data.user.first_name || 
                           (res.data.user.name ? res.data.user.name.split(' ')[0] : '') ||
                           res.data.user.username || '';
          const lastName = res.data.user.last_name ||
                          (res.data.user.name ? res.data.user.name.split(' ').slice(1).join(' ') : '') ||
                          '';
          
          prof = {
            firstName: firstName,
            lastName: lastName,
            middleName: '',
            email: res.data.user.email,
            profileImage: prof?.profileImage || null
          };
          
          const updatedProfiles = { ...allProfiles, [res.data.user.email]: prof };
          localStorage.setItem('userProfiles', JSON.stringify(updatedProfiles));
        }
        
        setUserProfile(prof);
      }
      
      return true;  // Return success
    } catch (err) {
      console.error('Login failed:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Login failed');
      return false;  // Return failure
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['x-auth-token'] = token;
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
      await axios.post(`${API_BASE}/auth/logout`);
        } catch (e) {
          console.warn('Server logout failed or already cleared:', e?.message || e);
        }
      }
    } finally {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      delete axios.defaults.headers.common['x-auth-token'];
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setIsAuthenticated(false);
      // Don't clear the userProfile - we want to keep this data for future logins
    }
  };

  // Update the setUserProfile function to save by email
  const updateUserProfile = (updatedProfile) => {
    setUserProfile(updatedProfile);
    
    // Save to the email-indexed profiles for persistence between sessions
    if (user && user.email) {
      try {
        const allProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
        allProfiles[user.email] = updatedProfile;
        localStorage.setItem('userProfiles', JSON.stringify(allProfiles));
        
        // Also update temporary userProfile in localStorage for current session
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      } catch (error) {
        console.error("Error saving profile:", error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      loading,
      error,
      register,
      login,
      logout,
      userProfile,
      setUserProfile: updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};