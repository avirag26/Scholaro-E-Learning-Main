import { createSlice } from '@reduxjs/toolkit';
import { tutorAPI } from '../api/axiosConfig';
const currentTutorSlice = createSlice({
  name: 'currentTutor',
  initialState: {
    tutor: null,
    accessToken: null,
    isAuthenticated: false,
    loading: false
  },
  reducers: {
    loginSuccess: (state, action) => {
      const { tutor, accessToken } = action.payload;
      state.tutor = tutor;
      state.accessToken = accessToken;
      state.isAuthenticated = true;
      state.loading = false;
      localStorage.setItem('tutorAuthToken', accessToken);
      localStorage.setItem('tutorInfo', JSON.stringify(tutor));
    },
    logout: (state) => {
      state.tutor = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.loading = false;
      localStorage.removeItem('tutorAuthToken');
      localStorage.removeItem('tutorInfo');
    },
    updateTutorProfile: (state, action) => {
      if (state.tutor) {
        state.tutor = { ...state.tutor, ...action.payload };
        localStorage.setItem('tutorInfo', JSON.stringify(state.tutor));
      }
    },
    updateProfileImage: (state, action) => {
      if (state.tutor) {
        state.tutor.profileImage = action.payload;
        localStorage.setItem('tutorInfo', JSON.stringify(state.tutor));
      }
    },
    restoreFromStorage: (state) => {
      const token = localStorage.getItem('tutorAuthToken');
      const tutorInfo = localStorage.getItem('tutorInfo');
      if (token && tutorInfo) {
        try {
          state.accessToken = token;
          state.tutor = JSON.parse(tutorInfo);
          state.isAuthenticated = true;
        } catch (error) {
          localStorage.removeItem('tutorAuthToken');
          localStorage.removeItem('tutorInfo');
        }
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});
export const { 
  loginSuccess, 
  logout, 
  updateTutorProfile, 
  updateProfileImage, 
  restoreFromStorage, 
  setLoading 
} = currentTutorSlice.actions;
export const logoutTutor = (navigate) => async (dispatch) => {
  try {
    await tutorAPI.post('/api/tutors/logout');
  } catch (error) {
    // Handle logout error silently
  }
  dispatch(logout());
  navigate('/tutor/login', { replace: true });
};
export default currentTutorSlice.reducer;
