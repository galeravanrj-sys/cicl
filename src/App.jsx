import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CaseProvider } from './context/CaseContext';
import { NotificationProvider } from './context/NotificationContext.jsx';
import Login from './components/Login';
import Register from './components/Register';
import LandingPage from './components/LandingPage';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './components/Dashboard';
import CaseManagement from './components/CaseManagement';
import ArchivedCases from './components/ArchivedCases';
import Program from './components/Program';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Notifications from './components/Notifications';
import AfterCare from './components/AfterCare';

import CaseDetailsPage from './components/CaseDetailsPage';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import axios from 'axios';
import { API_BASE, API_HOST } from './utils/apiBase';
import 'bootstrap/dist/css/bootstrap.min.css';
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
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      // Clear tokens and headers
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      delete axios.defaults.headers.common['x-auth-token'];
      delete axios.defaults.headers.common['Authorization'];
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
        await axios.get(`${API_HOST}/`);
        console.log('Server is up and running');
        
        // If we have a token, check if it's valid
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          try {
            await axios.get(`${API_BASE}/auth/verify-token`);
            console.log('Token verified successfully');
          } catch (err) {
            console.error('Token verification failed:', err.response?.status, err.response?.data);
          }
        }
      } catch (err) {
        console.error('Server connection failed:', err.message);
      }
    };
    
    checkServerStatus();
  }, []);

  return (
    <AuthProvider>
      <CaseProvider>
        <NotificationProvider>
          <Router>
              <Routes>
                {/* Public routes with centered container */}
                <Route path="/" element={<div className="app-container"><LandingPage /></div>} />
                <Route path="/register" element={<div className="app-container"><Register /></div>} />
                <Route path="/login" element={<div className="app-container"><Login /></div>} />
                <Route path="/forgot-password" element={<div className="app-container"><ForgotPassword /></div>} />
                
                {/* Protected routes with full-width layout */}
                <Route 
                  path="/dashboard" 
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Settings />
                      </Layout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/program" 
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Program />
                      </Layout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/reports" 
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Reports />
                      </Layout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/case-management" 
                  element={
                    <PrivateRoute>
                      <Layout>
                        <CaseManagement />
                      </Layout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/cases" 
                  element={
                    <PrivateRoute>
                      <Layout>
                        <CaseManagement />
                      </Layout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/archived-cases" 
                  element={
                    <PrivateRoute>
                      <Layout>
                        <ArchivedCases />
                      </Layout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/after-care" 
                  element={
                    <PrivateRoute>
                      <Layout>
                        <AfterCare />
                      </Layout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Settings />
                      </Layout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/notifications" 
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Notifications />
                      </Layout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/case/:id" 
                  element={
                    <PrivateRoute>
                      <Layout>
                        <CaseDetailsPage />
                      </Layout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/case-details/:caseId" 
                  element={
                    <PrivateRoute>
                      <Layout>
                        <CaseDetailsPage />
                      </Layout>
                    </PrivateRoute>
                  } 
                />
              </Routes>
          </Router>
        </NotificationProvider>
      </CaseProvider>
    </AuthProvider>
  );
}

export default App;
