import { useSelector, useDispatch } from 'react-redux';
import { 
  loginSuccess, 
  logout, 
  updateTutorProfile, 
  updateProfileImage, 
  setLoading 
} from '../Redux/currentTutorSlice';
export const useCurrentTutor = () => {
  const dispatch = useDispatch();
  const { tutor, accessToken, isAuthenticated, loading } = useSelector(
    (state) => state.currentTutor
  );
  const handleLogin = (tutorData, token) => {
    dispatch(loginSuccess({ tutor: tutorData, accessToken: token }));
  };
  const handleLogout = () => {
    dispatch(logout());
  };
  const handleUpdateProfile = (updatedData) => {
    dispatch(updateTutorProfile(updatedData));
  };
  const handleUpdateProfileImage = (imageUrl) => {
    dispatch(updateProfileImage(imageUrl));
  };
  const setTutorLoading = (isLoading) => {
    dispatch(setLoading(isLoading));
  };
  return {
    tutor,
    accessToken,
    isAuthenticated,
    loading,
    login: handleLogin,
    logout: handleLogout,
    updateProfile: handleUpdateProfile,
    updateProfileImage: handleUpdateProfileImage,
    setLoading: setTutorLoading
  };
};
export default useCurrentTutor;
