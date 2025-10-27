import { createSlice } from '@reduxjs/toolkit';
import { userAPI } from '../api/axiosConfig';
const currentUserSlice = createSlice({
  name: 'currentUser',
  initialState: {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    loading: false
  },
  reducers: {
    loginSuccess: (state, action) => {
      const { user, accessToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.isAuthenticated = true;
      state.loading = false;
      localStorage.setItem('authToken', accessToken);
      localStorage.setItem('userInfo', JSON.stringify(user));
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.loading = false;
      localStorage.removeItem('authToken');
      localStorage.removeItem('userInfo');
    },
    updateUserProfile: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('userInfo', JSON.stringify(state.user));
      }
    },
    updateProfileImage: (state, action) => {
      if (state.user) {
        state.user.profileImage = action.payload;
        localStorage.setItem('userInfo', JSON.stringify(state.user));
      }
    },
    restoreFromStorage: (state) => {
      const token = localStorage.getItem('authToken');
      const userInfo = localStorage.getItem('userInfo');
      if (token && userInfo) {
        try {
          state.accessToken = token;
          state.user = JSON.parse(userInfo);
          state.isAuthenticated = true;
        } catch (error) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userInfo');
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
  updateUserProfile, 
  updateProfileImage, 
  restoreFromStorage, 
  setLoading 
} = currentUserSlice.actions;
export const logoutUser = (navigate) => async (dispatch) => {
  try {
    await userAPI.post('/api/users/logout');
  } catch (error) {
    console.error('Logout API error:', error);
  }
  dispatch(logout());
  navigate('/user/login', { replace: true });
};
export default currentUserSlice.reducer;
