export const getUserType = () => {
  if (localStorage.getItem('authToken')) return 'user';
  if (localStorage.getItem('tutorAuthToken')) return 'tutor';
  if (localStorage.getItem('adminAuthToken')) return 'admin';
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