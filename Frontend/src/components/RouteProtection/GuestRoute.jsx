import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
const GuestRoute = ({ children }) => {
    const user = useSelector((state) => state.currentUser);
    const tutor = useSelector((state) => state.currentTutor);
    const admin = useSelector((state) => state.currentAdmin);
    
    if (user.isAuthenticated) {
        return <Navigate to="/user/home" replace />;
    }
    if (tutor.isAuthenticated) {
        return <Navigate to="/tutor/home" replace />;
    }
    if (admin.isAuthenticated) {
        return <Navigate to="/admin/dashboard" replace />;
    }
    return children;
};
export default GuestRoute;
