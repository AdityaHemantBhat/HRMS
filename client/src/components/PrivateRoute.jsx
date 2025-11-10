import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../features/auth/authSlice';
import { Spin } from 'antd';
import { useGetMeQuery } from '../features/auth/authApiSlice';
import { useState, useEffect } from 'react';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  
  // Only call getMe if we have a token
  const hasToken = !!localStorage.getItem('token');
  
  const { isLoading, isFetching, isError } = useGetMeQuery(undefined, {
    skip: !hasToken, // Skip if no token
    refetchOnMountOrArgChange: false,
  });
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Safety timeout: if loading takes more than 5 seconds, redirect to login
  useEffect(() => {
    if (isLoading || isFetching) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isFetching]);

  // If no token, redirect immediately
  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }

  // If timeout or error, redirect to login
  if (loadingTimeout || isError) {
    return <Navigate to="/login" replace />;
  }

  // Show loading spinner while checking authentication
  if (isLoading || isFetching) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated background circles */}
        <div style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          top: '-100px',
          left: '-100px',
          animation: 'float 6s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          bottom: '-50px',
          right: '-50px',
          animation: 'float 8s ease-in-out infinite reverse'
        }} />
        
        {/* Logo/Brand */}
        <div style={{
          fontSize: 48,
          fontWeight: 700,
          color: '#fff',
          marginBottom: 32,
          textShadow: '0 4px 20px rgba(0,0,0,0.2)',
          letterSpacing: '-1px',
          zIndex: 1
        }}>
          TalentSphere
        </div>
        
        {/* Spinner */}
        <Spin size="large" style={{ zIndex: 1 }} />
        
        {/* Loading text */}
        <div style={{ 
          marginTop: 24, 
          color: '#fff', 
          fontSize: 16,
          fontWeight: 500,
          opacity: 0.9,
          zIndex: 1
        }}>
          Loading your workspace...
        </div>
        
        {/* Add keyframes for animation */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
        `}</style>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
