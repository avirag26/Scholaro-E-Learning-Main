import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect, useState, useRef } from 'react';
import { userAPI, tutorAPI, adminAPI } from '../../api/axiosConfig';
const ProtectedRoute = ({ children, userType }) => {
  const user = useSelector((state) => state.currentUser);
  const tutor = useSelector((state) => state.currentTutor);
  const admin = useSelector((state) => state.currentAdmin);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hasCheckedStatus = useRef(false);
  const userToken = user.accessToken || localStorage.getItem('authToken');
  const tutorToken = tutor.accessToken || localStorage.getItem('tutorAuthToken');
  const adminToken = admin.accessToken || localStorage.getItem('adminAuthToken');
  useEffect(() => {
    const checkBlockedStatus = async () => {
      if (hasCheckedStatus.current) {
        setIsLoading(false);
        return;
      }
      hasCheckedStatus.current = true;
      let endpoint = '';
      let apiInstance;
      if (userType === 'user' && userToken) {
        endpoint = '/api/users/check-status';
        apiInstance = userAPI;
      } else if (userType === 'tutor' && tutorToken) {
        endpoint = '/api/tutors/check-status';
        apiInstance = tutorAPI;
      } else if (userType === 'admin' && adminToken) {
        endpoint = '/api/admin/check-status';
        apiInstance = adminAPI;
      }
      if (endpoint) {
        try {
          await apiInstance.get(endpoint);
          setIsBlocked(false);
        } catch (error) {
          if (error.response?.status === 403) {
            setIsBlocked(true);
            localStorage.removeItem('authToken');
            localStorage.removeItem('tutorAuthToken');
            localStorage.removeItem('adminAuthToken');
            localStorage.removeItem('userInfo');
            localStorage.removeItem('tutorInfo');
            localStorage.removeItem('adminInfo');
          } else {
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
