/**
 * Navigation utility functions
 */
/**
 * Generate navigation paths for the application
 */
export const ROUTES = {
  USER: {
    HOME: '/user/home',
    TEACHERS: '/user/teachers',
    COURSES: '/user/courses',
    COURSE_DETAIL: (courseId) => `/user/course/${courseId}`,
    TUTOR_DETAIL: (tutorId) => `/user/tutor/${tutorId}`,
    PROFILE: '/user/profile'
  },
  TUTOR: {
    HOME: '/tutor/home',
    COURSES: '/tutor/courses',
    ADD_COURSE: '/tutor/add-course',
    EDIT_COURSE: (courseId) => `/tutor/edit-course/${courseId}`,
    ADD_LESSON: (courseId) => `/tutor/courses/${courseId}/add-lesson`
  },
  ADMIN: {
    HOME: '/admin/home',
    TUTORS: '/admin/tutors',
    CATEGORIES: '/admin/categories'
  }
};
/**
 * Safe navigation function that handles errors gracefully
 * @param {Function} navigate - React Router navigate function
 * @param {string} path - Path to navigate to
 * @param {Object} options - Navigation options
 */
export const safeNavigate = (navigate, path, options = {}) => {
  try {
    navigate(path, options);
  } catch (error) {
    console.error('Navigation error:', error);
    navigate('/user/home');
  }
};
