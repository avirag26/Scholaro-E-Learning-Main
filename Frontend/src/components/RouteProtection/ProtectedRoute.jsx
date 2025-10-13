import { Navigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { userAPI, tutorAPI, adminAPI } from '../../api/axiosConfig';

const ProtectedRoute = ({ children, userType }) => {
  const { auth } = useAuth();
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);


  const userToken = auth?.accessToken || localStorage.getItem('authToken');
  const tutorToken = localStorage.getItem('tutorAuthToken');
  const adminToken = localStorage.getItem('adminAuthToken');


  useEffect(() => {
    const checkBlockedStatus = async () => {
      let endpoint = '';
      let apiInstance;

      if (userType === 'user' && userToken) {
        endpoint = '/api/users/check-status';
        apiInstance = userAPI;
      } else if (userType === 'tutor' && tutorToken) {
        endpoint = '/api/tutors/check-status';
        apiInstance = tutorAPI;
      } else if (userType === 'admin' && adminToken) {
        endpoint = '/api/admin/check-status'; // Assuming this endpoint exists
        apiInstance = adminAPI;
      }

      if (endpoint) {
        try {
          await apiInstance.get(endpoint);
          setIsBlocked(false);
        } catch (error) {
          if (error.response?.status === 403) {
            setIsBlocked(true);
            toast.error('Your account has been blocked by the administrator.');

            localStorage.removeItem('authToken');
            localStorage.removeItem('tutorAuthToken');
            localStorage.removeItem('adminAuthToken');
            localStorage.removeItem('userInfo');
            localStorage.removeItem('tutorInfo');
            localStorage.removeItem('adminInfo');
          } else {
            console.error('Error checking account status:', error);
          }
        }
      }

      setIsLoading(false);
    };

    checkBlockedStatus();

    const interval = setInterval(checkBlockedStatus, 30000);
    return () => clearInterval(interval);
  }, [userType, userToken, tutorToken, adminToken]);


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


  if (isBlocked) {
    if (userType === 'user') return <Navigate to="/user/login" replace />;
    if (userType === 'tutor') return <Navigate to="/tutor/login" replace />;
    if (userType === 'admin') return <Navigate to="/admin/login" replace />;
  }

  if (userType === 'user') {
    if (!userToken) {
      if (tutorToken) return <Navigate to="/tutor/home" replace />;
      if (adminToken) return <Navigate to="/admin/dashboard" replace />;
      return <Navigate to="/user/login" replace />;
    }
    return children;
  }


  if (userType === 'tutor') {
    if (!tutorToken) {
      if (userToken) return <Navigate to="/user/home" replace />;
      if (adminToken) return <Navigate to="/admin/dashboard" replace />;
      return <Navigate to="/tutor/login" replace />;
    }
    return children;
  }


  if (userType === 'admin') {
    if (!adminToken) {
      if (userToken) return <Navigate to="/user/home" replace />;
      if (tutorToken) return <Navigate to="/tutor/home" replace />;
      return <Navigate to="/admin/login" replace />;
    }
    return children;
  }


  return <Navigate to="/" replace />;
};

export default ProtectedRoute;
