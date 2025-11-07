import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { mapAuthError } from '../utils/authError';

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
          await axios.get('http://localhost:5000/api/auth/verify-token');
          console.log('Token verified through verify-token endpoint');
          setIsAuthenticated(true);
        } catch (verifyErr) {
          console.log('verify-token endpoint failed, falling back to /me endpoint');
          // Fall back to the original /me endpoint
          const res = await axios.get('http://localhost:5000/api/auth/me');
          console.log('Token verification successful, user loaded:', res.data);
          
          setUser(res.data);
          setIsAuthenticated(true);
          
          // Load the profile for this user's email
          const allProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
          if (res.data && res.data.email && allProfiles[res.data.email]) {
            setUserProfile(allProfiles[res.data.email]);
          }
        }
      } catch (err) {
        console.error('Token verification failed:', err.response?.status, err.response?.data?.message || err.message);
        // Always clear the error state first to ensure UI updates
        setError(null);

        const mapped = mapAuthError(err);
        setError(mapped.message);

        // Adjust auth state based on error type
        if (mapped.reason === 'network') {
          // Allow offline access
          setIsAuthenticated(true);
        } else if (mapped.reason === 'unauthorized' || mapped.reason === 'expired' || mapped.reason === 'kicked_out') {
          // Clean up local tokens in case interceptors didn't run yet
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          delete axios.defaults.headers.common['x-auth-token'];
          delete axios.defaults.headers.common['Authorization'];
          setIsAuthenticated(false);
        } else {
          // Unknown/other errors: keep token to avoid abrupt logout
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
      const res = await axios.post('http://localhost:5000/api/auth/register', userData);
      
      console.log('Registration successful, saving token');
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['x-auth-token'] = res.data.token;
      
      setUser(res.data.user);
      setIsAuthenticated(true);
      setError(null);
      
      // Create initial profile for this user
      if (res.data.user && res.data.user.email) {
        const initialProfile = {
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
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
      const res = await axios.post('http://localhost:5000/api/auth/login', userData);
      
      console.log('Login successful, saving token');
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['x-auth-token'] = res.data.token;
      
      setUser(res.data.user);
      setIsAuthenticated(true);
      setError(null);
      
      // Load the profile for this email
      if (res.data.user && res.data.user.email) {
        const allProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
        
        if (allProfiles[res.data.user.email]) {
          setUserProfile(allProfiles[res.data.user.email]);
        } else {
          // Create a default profile if none exists
          const defaultProfile = {
            firstName: res.data.user.name ? res.data.user.name.split(' ')[0] : '',
            lastName: res.data.user.name ? res.data.user.name.split(' ').slice(1).join(' ') : '',
            middleName: '',
            email: res.data.user.email,
            profileImage: null
          };
          
          allProfiles[res.data.user.email] = defaultProfile;
          localStorage.setItem('userProfiles', JSON.stringify(allProfiles));
          setUserProfile(defaultProfile);
        }
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
  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    delete axios.defaults.headers.common['x-auth-token'];
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    // Don't clear the userProfile - we want to keep this data for future logins
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