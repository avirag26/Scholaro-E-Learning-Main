import { tutorAPI, publicAPI } from './axiosConfig';
export const tutorAuthAPI = {
  register: (tutorData) => publicAPI.post('/api/tutors/register', tutorData),
  login: (credentials) => publicAPI.post('/api/tutors/login', credentials),
  verifyOtp: (otpData) => publicAPI.post('/api/tutors/verify-otp', otpData),
  resendOtp: (email) => publicAPI.post('/api/tutors/resend-otp', { email }),
  forgotPassword: (email) => publicAPI.post('/api/tutors/forgot-password', { email }),
  resetPassword: (token, password) => publicAPI.patch(`/api/tutors/reset-password/${token}`, { password }),
  googleAuth: (credential) => publicAPI.post('/api/tutors/google-auth', { credential }),
};
export const tutorProtectedAPI = {
  checkStatus: () => tutorAPI.get('/api/tutors/check-status'),
  getProfile: () => tutorAPI.get('/api/tutors/profile'),
  updateProfile: (profileData) => tutorAPI.put('/api/tutors/profile', profileData),
  getCourses: () => tutorAPI.get('/api/tutors/courses'),
  createCourse: (courseData) => tutorAPI.post('/api/tutors/courses', courseData),
  updateCourse: (courseId, courseData) => tutorAPI.put(`/api/tutors/courses/${courseId}`, courseData),
  deleteCourse: (courseId) => tutorAPI.delete(`/api/tutors/courses/${courseId}`),
  getStudents: () => tutorAPI.get('/api/tutors/students'),
  getEarnings: () => tutorAPI.get('/api/tutors/earnings'),
  getNotifications: () => tutorAPI.get('/api/tutors/notifications'),
  markNotificationRead: (notificationId) => tutorAPI.patch(`/api/tutors/notifications/${notificationId}/read`),
};
export const tutorAPIService = {
  ...tutorAuthAPI,
  ...tutorProtectedAPI,
};
