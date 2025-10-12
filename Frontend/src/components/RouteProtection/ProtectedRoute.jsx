import { Navigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const ProtectedRoute = ({ children, userType }) => {
  const { auth } = useAuth();
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const userToken = auth?.accessToken || localStorage.getItem('authToken');
  const tutorToken = localStorage.getItem('tutorAuthToken');
  const adminToken = localStorage.getItem('adminAuthToken');

  // Check if user is blocked
  useEffect(() => {
    const checkBlockedStatus = async () => {
      let token = null;
      let endpoint = '';

      // Determine which token and endpoint to use
      if (userType === 'user' && userToken) {
        token = userToken;
        endpoint = '/api/users/check-status';
      } else if (userType === 'tutor' && tutorToken) {
        token = tutorToken;
        endpoint = '/api/tutors/check-status';
      } else if (userType === 'admin' && adminToken) {
        token = adminToken;
        endpoint = '/api/admin/check-status';
      }

      if (token && endpoint) {
        try {
          console.log(`🔍 Checking ${userType} status at ${endpoint}`);
          
          const response = await fetch(endpoint, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          console.log(`📡 Status check response: ${response.status}`);

          if (response.status === 403) {
            // User is blocked
            console.log('🚫 User is blocked, logging out');
            setIsBlocked(true);
            toast.error('Your account has been blocked by the administrator.');
            
            // Clear all tokens
            localStorage.removeItem('authToken');
            localStorage.removeItem('tutorAuthToken');
            localStorage.removeItem('adminAuthToken');
            localStorage.removeItem('userInfo');
            localStorage.removeItem('tutorInfo');
            localStorage.removeItem('adminInfo');
          } else if (response.ok) {
            console.log('✅ User is active, allowing access');
            setIsBlocked(false);
          } else {
            console.log(`⚠️ Unexpected status: ${response.status}`);
          }
        } catch (error) {
          console.error('Error checking blocked status:', error);
        }
      }
      
      setIsLoading(false);
    };

    // Check immediately
    checkBlockedStatus();

    // Check every 30 seconds to detect if user gets blocked while using the app
    const interval = setInterval(checkBlockedStatus, 30000);

    return () => clearInterval(interval);
  }, [userType, userToken, tutorToken, adminToken]);

  // Show loading while checking status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  // If user is blocked, redirect to login
  if (isBlocked) {
    if (userType === 'user') {
      return <Navigate to="/user/login" replace />;
    } else if (userType === 'tutor') {
      return <Navigate to="/tutor/login" replace />;
    } else if (userType === 'admin') {
      return <Navigate to="/admin/login" replace />;
    }
  }

  // Check if user is trying to access the correct user type
  if (userType === 'user') {
    if (!userToken) {
      // If no user token, check if other user types are logged in
      if (tutorToken) {
        return <Navigate to="/tutor/home" replace />;
      }
      if (adminToken) {
        return <Navigate to="/admin/dashboard" replace />;
      }
      // No one is logged in, redirect to login
      return <Navigate to="/user/login" replace />;
    }
    // User token exists, allow access
    return children;
  }

  if (userType === 'tutor') {
    if (!tutorToken) {
      // If no tutor token, check if other user types are logged in
      if (userToken) {
        return <Navigate to="/user/home" replace />;
      }
      if (adminToken) {
        return <Navigate to="/admin/dashboard" replace />;
      }
      // No one is logged in, redirect to login
      return <Navigate to="/tutor/login" replace />;
    }
    // Tutor token exists, allow access
    return children;
  }

  if (userType === 'admin') {
    if (!adminToken) {
      // If no admin token, check if other user types are logged in
      if (userToken) {
        return <Navigate to="/user/home" replace />;
      }
      if (tutorToken) {
        return <Navigate to="/tutor/home" replace />;
      }
      // No one is logged in, redirect to login
      return <Navigate to="/admin/login" replace />;
    }
    // Admin token exists, allow access
    return children;
  }

  // Default case - redirect to home
  return <Navigate to="/" replace />;
};

export default ProtectedRoute;