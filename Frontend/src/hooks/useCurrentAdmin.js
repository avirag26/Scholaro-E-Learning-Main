import { useSelector, useDispatch } from 'react-redux';
import { 
  loginSuccess, 
  logout, 
  updateAdminProfile, 
  updateProfileImage, 
  setLoading 
} from '../Redux/currentAdminSlice';
export const useCurrentAdmin = () => {
  const dispatch = useDispatch();
  const { admin, accessToken, isAuthenticated, loading } = useSelector(
    (state) => state.currentAdmin
  );
  const handleLogin = (adminData, token) => {
    dispatch(loginSuccess({ admin: adminData, accessToken: token }));
  };
  const handleLogout = () => {
    dispatch(logout());
  };
  const handleUpdateProfile = (updatedData) => {
    dispatch(updateAdminProfile(updatedData));
  };
  const handleUpdateProfileImage = (imageUrl) => {
    dispatch(updateProfileImage(imageUrl));
  };
  const setAdminLoading = (isLoading) => {
    dispatch(setLoading(isLoading));
  };
  return {
    admin,
    accessToken,
    isAuthenticated,
    loading,
    login: handleLogin,
    logout: handleLogout,
    updateProfile: handleUpdateProfile,
    updateProfileImage: handleUpdateProfileImage,
    setLoading: setAdminLoading
  };
};
export default useCurrentAdmin;
