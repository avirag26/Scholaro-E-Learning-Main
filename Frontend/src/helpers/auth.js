export const checkUserAuth = () => {
  return localStorage.getItem('authToken');
};

export const checkTutorAuth = () => {
  return localStorage.getItem('tutorAuthToken');
};

export const checkAdminAuth = () => {
  return localStorage.getItem('adminAuthToken');
};

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

export const clearAllData = () => {
  clearUserData();
  clearTutorData();
  clearAdminData();
};

export const redirectAfterLogin = (navigate, userType, destination) => {
  if (destination) {
    navigate(destination, { replace: true });
  } else if (userType === 'user') {
    navigate('/user/home', { replace: true });
  } else if (userType === 'tutor') {
    navigate('/tutor/home', { replace: true });
  } else if (userType === 'admin') {
    navigate('/admin/dashboard', { replace: true });
  }
};

export const clearBrowserHistory = () => {

  window.history.replaceState(null, '', window.location.pathname);


  window.history.pushState(null, '', window.location.pathname);
};