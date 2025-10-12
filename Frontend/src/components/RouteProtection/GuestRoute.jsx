import { Navigate } from 'react-router-dom';

const GuestRoute = ({ children, userType }) => {
    const userToken = localStorage.getItem('authToken');
    const tutorToken = localStorage.getItem('tutorAuthToken');
    const adminToken = localStorage.getItem('adminAuthToken');

    // Simple: If anyone is logged in, redirect to their dashboard
    if (userToken) {
        return <Navigate to="/user/home" replace />;
    }

    if (tutorToken) {
        return <Navigate to="/tutor/home" replace />;
    }

    if (adminToken) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    // No one is logged in, show the page
    return children;
};

export default GuestRoute;