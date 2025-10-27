import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UserRoutes from "../Routes/userRoutes"
import TutorRoutes from "../Routes/tutorRoutes";
import LandingProtection from "./components/RouteProtection/LandingProtection";
import NotFoundPage from "./ui/NotFound";
import AdminRoutes from "../Routes/adminRoutes";
import LoadingPage from "./ui/Loading";
import { useCurrentUser } from "./hooks/useCurrentUser";
import { useCurrentTutor } from "./hooks/useCurrentTutor";
import { useCurrentAdmin } from "./hooks/useCurrentAdmin";
import { restoreFromStorage as restoreUser } from './Redux/currentUserSlice';
import { restoreFromStorage as restoreTutor } from './Redux/currentTutorSlice';
import { restoreFromStorage as restoreAdmin } from './Redux/currentAdminSlice';
const GlobalGuard = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated: isUserAuthenticated } = useCurrentUser();
  const { isAuthenticated: isTutorAuthenticated } = useCurrentTutor();
  const { isAuthenticated: isAdminAuthenticated } = useCurrentAdmin();
  useEffect(() => {
    const authPages = [
      '/tutor/login', '/user/login', '/admin/login',
      '/tutor/register', '/user/register',
      '/tutor/forgot-password', '/user/forgot-password', '/admin/forgot-password'
    ];
    if ((isUserAuthenticated || isTutorAuthenticated || isAdminAuthenticated) && authPages.includes(location.pathname)) {
      if (isUserAuthenticated) {
        navigate('/user/home', { replace: true });
      } else if (isTutorAuthenticated) {
        navigate('/tutor/home', { replace: true });
      } else if (isAdminAuthenticated) {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [location.pathname, navigate, isUserAuthenticated, isTutorAuthenticated, isAdminAuthenticated]);
  return children;
};
function App() {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  
  // Restore auth state from localStorage on app start
  useEffect(() => {
    dispatch(restoreUser());
    dispatch(restoreTutor());
    dispatch(restoreAdmin());
  }, [dispatch]);

  useEffect(() => {
    const hasVisited = sessionStorage.getItem('hasVisited');
    if (hasVisited) {
      setIsLoading(false);
      return;
    }
    const timer = setTimeout(() => {
      setIsLoading(false);
      sessionStorage.setItem('hasVisited', 'true');
    }, 2500);
    return () => clearTimeout(timer);
  }, []);
  if (isLoading) {
    return <LoadingPage />;
  }
  return (
    <>
      <Router>
        <GlobalGuard>
          <Routes>
            <Route path="/" element={<LandingProtection />} />
            <Route path="/user/*" element={<UserRoutes />} />
            <Route path='/tutor/*' element={<TutorRoutes />} />
            <Route path="/admin/*" element={<AdminRoutes />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </GlobalGuard>
      </Router>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  )
}
export default App
