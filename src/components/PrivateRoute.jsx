import React, { useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useContext(AuthContext);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Add a small delay to allow authentication state to settle
    if (!loading && !isAuthenticated) {
      const timer = setTimeout(() => {
        setShouldRedirect(true);
      }, 100);
      
      return () => clearTimeout(timer);
    } else if (isAuthenticated) {
      setShouldRedirect(false);
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated && shouldRedirect) {
    return <Navigate to="/login" replace />;
  }

  // Role-based access control
  const rawRole = user?.role || '';
  const normalizedRole = rawRole.toLowerCase();
  const isAdmin = normalizedRole.includes('admin');
  const effectiveRole = isAdmin ? 'admin' : 'encoder';
  
  // If specific roles were provided for this route, enforce them
  if (allowedRoles && Array.isArray(allowedRoles)) {
    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());
    if (!normalizedAllowed.includes(effectiveRole)) {
      return <Navigate to={isAdmin ? '/dashboard' : '/cases'} replace />;
    }
  }
  
  // Global restrictions for the Encoder user level
  if (effectiveRole === 'encoder') {
    // Allow encoders to access Cases and Settings
    const allowedPaths = ['/cases', '/settings'];
    if (!allowedPaths.includes(location.pathname)) {
      return <Navigate to="/cases" replace />;
    }
  }
  // Restricted/Limited legacy logic removed; using admin/encoder model only.

  return isAuthenticated ? children : <div>Loading...</div>;
};

export default PrivateRoute;