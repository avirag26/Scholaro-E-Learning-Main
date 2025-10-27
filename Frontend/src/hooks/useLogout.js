import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../Redux/currentUserSlice';
import { logoutTutor } from '../Redux/currentTutorSlice';
import { logoutAdmin } from '../Redux/currentAdminSlice';
import Swal from 'sweetalert2';
export const useLogout = (userType = 'user') => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Sign Out?',
      text: 'Are you sure you want to sign out of your account?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, sign out',
      cancelButtonText: 'Cancel'
    });
    if (result.isConfirmed) {
      if (userType === 'user') {
        dispatch(logoutUser(navigate));
      } else if (userType === 'tutor') {
        dispatch(logoutTutor(navigate));
      } else if (userType === 'admin') {
        dispatch(logoutAdmin(navigate));
      }
    }
  };
  const handleForceLogout = async () => {
    if (userType === 'user') {
      dispatch(logoutUser(navigate));
    } else if (userType === 'tutor') {
      dispatch(logoutTutor(navigate));
    } else if (userType === 'admin') {
      dispatch(logoutAdmin(navigate));
    }
  };
  return {
    logout: handleLogout,
    forceLogout: handleForceLogout
  };
};
export default useLogout;
