import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../Redux/currentUserSlice';
import { logoutTutor } from '../Redux/currentTutorSlice';
import { logoutAdmin } from '../Redux/currentAdminSlice';
/**
 * Hook for logout with confirmation dialog
 * @param {string} userType - 'user', 'tutor', or 'admin'
 */
export const useLogoutConfirm = (userType = 'user') => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [showConfirm, setShowConfirm] = useState(false);
    const handleLogout = () => {
        setShowConfirm(true);
    };
    const confirmLogout = async () => {
        if (userType === 'user') {
            dispatch(logoutUser(navigate));
        } else if (userType === 'tutor') {
            dispatch(logoutTutor(navigate));
        } else if (userType === 'admin') {
            dispatch(logoutAdmin(navigate));
        }
    };
    const cancelLogout = () => {
        setShowConfirm(false);
    };
    return {
        logout: handleLogout,
        showConfirm,
        confirmLogout,
        cancelLogout
    };
};
export default useLogoutConfirm;
