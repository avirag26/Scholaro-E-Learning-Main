import { useSelector, useDispatch } from 'react-redux';
import { 
  loginSuccess, 
  logout, 
  updateUserProfile, 
  updateProfileImage, 
  setLoading 
} from '../Redux/currentUserSlice';
export const useCurrentUser = () => {
  const dispatch = useDispatch();
  const { user, accessToken, isAuthenticated, loading } = useSelector(
    (state) => state.currentUser
  );
  const handleLogin = (userData, token) => {
    dispatch(loginSuccess({ user: userData, accessToken: token }));
  };
  const handleLogout = () => {
    dispatch(logout());
  };
  const handleUpdateProfile = (updatedData) => {
    dispatch(updateUserProfile(updatedData));
  };
  const handleUpdateProfileImage = (imageUrl) => {
    dispatch(updateProfileImage(imageUrl));
  };
  const setUserLoading = (isLoading) => {
    dispatch(setLoading(isLoading));
  };
  return {
    user,
    accessToken,
    isAuthenticated,
    loading,
    login: handleLogin,
    logout: handleLogout,
    updateProfile: handleUpdateProfile,
    updateProfileImage: handleUpdateProfileImage,
    setLoading: setUserLoading
  };
};
export default useCurrentUser;
