import { userAPI } from '../api/axiosConfig';

export const tutorService = {

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

  async getTutorDetails(tutorId) {
    const response = await userAPI.get(`/api/users/tutors/${tutorId}`);
    return response.data;
  },

  async getTutorStats(tutorId) {
    try {
      const response = await userAPI.get(`/api/users/tutors/${tutorId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tutor stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  transformTutorData(tutors) {
    return tutors.map(tutor => ({
      ...tutor,
      subjects: tutor.subjects || 'Professional Tutor',
      bio: tutor.bio || 'Experienced tutor ready to help you learn',
      profileImage: tutor.profileImage || tutor.profile_image
    }));
  }
};
