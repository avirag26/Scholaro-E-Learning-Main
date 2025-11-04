import { createSlice } from '@reduxjs/toolkit';
import { adminAPI } from '../api/axiosConfig';
const currentAdminSlice = createSlice({
  name: 'currentAdmin',
  initialState: {
    admin: null,
    accessToken: null,
    isAuthenticated: false,
    loading: false
  },
  reducers: {
    loginSuccess: (state, action) => {
      const { admin, accessToken } = action.payload;
      state.admin = admin;
      state.accessToken = accessToken;
      state.isAuthenticated = true;
      state.loading = false;
      localStorage.setItem('adminAuthToken', accessToken);
      localStorage.setItem('adminInfo', JSON.stringify(admin));
    },
    logout: (state) => {
      state.admin = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.loading = false;
      localStorage.removeItem('adminAuthToken');
      localStorage.removeItem('adminInfo');
    },
    updateAdminProfile: (state, action) => {
      if (state.admin) {
        state.admin = { ...state.admin, ...action.payload };
        localStorage.setItem('adminInfo', JSON.stringify(state.admin));
      }
    },
    updateProfileImage: (state, action) => {
      if (state.admin) {
        state.admin.profileImage = action.payload;
        localStorage.setItem('adminInfo', JSON.stringify(state.admin));
      }
    },
    restoreFromStorage: (state) => {
      const token = localStorage.getItem('adminAuthToken');
      const adminInfo = localStorage.getItem('adminInfo');
      if (token && adminInfo) {
        try {
          state.accessToken = token;
          state.admin = JSON.parse(adminInfo);
          state.isAuthenticated = true;
        } catch (error) {
          localStorage.removeItem('adminAuthToken');
          localStorage.removeItem('adminInfo');
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
  updateAdminProfile, 
  updateProfileImage, 
  restoreFromStorage, 
  setLoading 
} = currentAdminSlice.actions;
export const logoutAdmin = (navigate) => async (dispatch) => {
  try {
    await adminAPI.post('/api/admins/logout');
  } catch (error) {
    // Handle logout error silently
  }
  dispatch(logout());
  navigate('/admin/login', { replace: true });
};
export default currentAdminSlice.reducer;
