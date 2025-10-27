// Redux-compatible auth utilities
export const getUserType = (reduxState) => {
  if (reduxState?.currentUser?.isAuthenticated) return 'user';
  if (reduxState?.currentTutor?.isAuthenticated) return 'tutor';
  if (reduxState?.currentAdmin?.isAuthenticated) return 'admin';
  return null;
};

export const getUserDashboard = (userType) => {
  if (userType === 'user') return '/user/home';
  if (userType === 'tutor') return '/tutor/home';
  if (userType === 'admin') return '/admin/dashboard';
  return '/';
};

export const getUserLogin = (userType) => {
  if (userType === 'user') return '/user/login';
  if (userType === 'tutor') return '/tutor/login';
  if (userType === 'admin') return '/admin/login';
  return '/';
};

// Navigation after login
export const redirectAfterLogin = (navigate, userType, destination) => {
  if (destination) {
    navigate(destination, { replace: true });
  } else {
    navigate(getUserDashboard(userType), { replace: true });
  }
};

// Clear specific user data from localStorage
export const clearUserData = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userInfo');
};

export const clearTutorData = () => {
  localStorage.removeItem('tutorAuthToken');
  localStorage.removeItem('tutorInfo');
};

export const clearAdminData = () => {
  localStorage.removeItem('adminAuthToken');
  localStorage.removeItem('adminInfo');
};

// Clear all auth data (emergency cleanup)
export const clearAllUserData = () => {
  clearUserData();
  clearTutorData();
  clearAdminData();
  localStorage.removeItem('registerFormData');
  localStorage.removeItem('pendingEmailChange');

  // Clear OTP data
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('otpExpiryTime_')) {
      localStorage.removeItem(key);
    }
  });
};

// Browser history cleanup
export const clearBrowserHistory = () => {
  window.history.replaceState(null, '', window.location.pathname);
  window.history.pushState(null, '', window.location.pathname);
};
