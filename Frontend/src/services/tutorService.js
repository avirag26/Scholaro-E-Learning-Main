import { userAPI } from '../api/axiosConfig';
/**
 * Service for tutor-related API operations
 */
export const tutorService = {
  /**
   * Fetch all public tutors with optional filters
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  async getPublicTutors(params = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value);
      }
    });
    const response = await userAPI.get(`/api/users/tutors?${queryParams}`);
    return response.data;
  },
  /**
   * Fetch detailed information about a specific tutor
   * @param {string} tutorId - The tutor's ID
   * @returns {Promise} API response
   */
  async getTutorDetails(tutorId) {
    const response = await userAPI.get(`/api/users/tutors/${tutorId}`);
    return response.data;
  },
  /**
   * Transform tutor data for frontend consumption
   * @param {Array} tutors - Raw tutor data from API
   * @returns {Array} Transformed tutor data
   */
  transformTutorData(tutors) {
    return tutors.map(tutor => ({
      ...tutor,
      subjects: tutor.subjects || 'Professional Tutor',
      bio: tutor.bio || 'Experienced tutor ready to help you learn',
      profileImage: tutor.profileImage || tutor.profile_image
    }));
  }
};
