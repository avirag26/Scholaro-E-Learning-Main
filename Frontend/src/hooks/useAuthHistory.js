import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { checkUserAuth, checkTutorAuth, checkAdminAuth, clearAllData } from '../helpers/auth';
import { axiosPrivate } from '../api/axios';
import { toast } from 'sonner';

export const useAuthProtection = (userType) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.includes('/login') || location.pathname.includes('/register')) {
      return;
    }
    const userToken = checkUserAuth();
    const tutorToken = checkTutorAuth();
    const adminToken = checkAdminAuth();

    const isAuthenticated = (userType === 'user' && userToken) ||
                           (userType === 'tutor' && tutorToken) ||
                           (userType === 'admin' && adminToken);

    if (!isAuthenticated) {
      navigate(`/${userType}/login`, { replace: true });
      return;
    }

    const preventBackToAuth = (event) => {
      const currentPath = location.pathname;
      
      if (isAuthenticated) {
        window.history.pushState(null, '', currentPath);
        event.preventDefault();
      }
    };

    const clearAuthHistory = () => {
      window.history.replaceState(null, '', location.pathname);
    };

    const checkIfBlocked = async () => {
      const statusUrl = `/api/${userType}s/check-status`;

      try {
        await axiosPrivate.get(statusUrl);
      } catch (error) {
        if (error.response?.status === 403) {
          toast.error('Your account has been blocked. Please contact support.');
          clearAllData();
          navigate(`/${userType}/login`, { replace: true });
        }
      }
    };

    clearAuthHistory();
    checkIfBlocked();

    window.addEventListener('popstate', preventBackToAuth);
    
    const blockCheckInterval = setInterval(checkIfBlocked, 30000);

    return () => {
      window.removeEventListener('popstate', preventBackToAuth);
      clearInterval(blockCheckInterval);
    };
  }, [navigate, userType, location.pathname]);
};

export default useAuthProtection;