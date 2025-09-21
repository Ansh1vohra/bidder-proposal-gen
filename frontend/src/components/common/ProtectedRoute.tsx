import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth is being checked
  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // If authentication is required but user is not logged in
  if (requireAuth && !user) {
    // Redirect to login page with return url
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If user is logged in but trying to access auth page
  if (!requireAuth && user) {
    // Redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
