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

  transformTutorData(tutors) {
    return tutors.map(tutor => ({
      ...tutor,
      subjects: tutor.subjects || 'Professional Tutor',
      bio: tutor.bio || 'Experienced tutor ready to help you learn',
      profileImage: tutor.profileImage || tutor.profile_image
    }));
  }
};
