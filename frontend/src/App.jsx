import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CaseProvider } from './context/CaseContext';
import Login from './Login';
import CaseManagement from './CaseManagement';
import axios from 'axios';
import { mapAuthError, setPostRedirectBanner } from './utils/authError';
import './App.css';

// Add axios request interceptor to include token with every request
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);
axios.interceptors.response.use(
  response => response,
  error => {
    const { status } = error.response || {};
    if (status === 401 || status === 403) {
      // Map error to friendly message and set banner for visibility after redirect
      const mapped = mapAuthError(error);
      if (mapped?.message) {
        setPostRedirectBanner(mapped.message, 'error', 8000);
      }

      // Clear tokens from both storages
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      // Remove default headers
      delete axios.defaults.headers.common['x-auth-token'];
      delete axios.defaults.headers.common['Authorization'];
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

function App() {
  // Add useEffect to check if server is up and token is valid
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        // Check if server is running
        await axios.get('http://localhost:5000/');
        console.log('Server is up and running');
        
        // If we have a token, check if it's valid
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          try {
            await axios.get('http://localhost:5000/api/auth/verify-token');
            console.log('Token is valid');
          } catch (error) {
            console.log('Token is invalid, removing...');
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
          }
        }
      } catch (error) {
        console.error('Server is not running or not accessible:', error.message);
      }
    };

    checkServerStatus();
  }, []);

  return (
    <AuthProvider>
      <CaseProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cases" element={<CaseManagement />} />
              
              {/* Catch all route - redirect to login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </Router>
      </CaseProvider>
    </AuthProvider>
  );
}

export default App;
