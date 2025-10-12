import { Navigate } from 'react-router-dom';
import LandingPage from '../../Landing/LandingPage';

const LandingProtection = () => {
    const userToken = localStorage.getItem('authToken');
    const tutorToken = localStorage.getItem('tutorAuthToken');
    const adminToken = localStorage.getItem('adminAuthToken');

    if (userToken) {
        return <Navigate to="/user/home" replace />;
    }

    if (tutorToken) {
        return <Navigate to="/tutor/home" replace />;
    }

    if (adminToken) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    return <LandingPage />;
};

export default LandingProtection;