import { tutorAPI } from '../api/axiosConfig';

export const checkExamStatus = async (courseId) => {
  try {
    const response = await tutorAPI.get(`/api/tutors/courses/${courseId}/exam`);
    
    if (response.data && response.data._id) {
      return {
        exists: true,
        exam: response.data
      };
    } else {
      return {
        exists: false,
        exam: null
      };
    }
  } catch (error) {
    if (error.response?.status === 404) {
      return {
        exists: false,
        exam: null
      };
    } else {
      return {
        exists: false,
        exam: null,
        error: error.message
      };
    }
  }
};