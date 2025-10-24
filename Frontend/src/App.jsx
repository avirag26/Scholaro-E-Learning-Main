
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UserRoutes from "../Routes/userRoutes"
import TutorRoutes from "../Routes/tutorRoutes";
import LandingProtection from "./components/RouteProtection/LandingProtection";
import NotFoundPage from "./ui/NotFound";
import AdminRoutes from "../Routes/adminRoutes";
import LoadingPage from "./ui/Loading";


const GlobalGuard = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    const userToken = localStorage.getItem('authToken');
    const tutorToken = localStorage.getItem('tutorAuthToken');
    const adminToken = localStorage.getItem('adminAuthToken');
    
    const authPages = [
      '/tutor/login', '/user/login', '/admin/login',
      '/tutor/register', '/user/register',
      '/tutor/forgot-password', '/user/forgot-password', '/admin/forgot-password'
    ];
    
    if ((userToken || tutorToken || adminToken) && authPages.includes(location.pathname)) {
      if (userToken) {
        navigate('/user/home', { replace: true });
      } else if (tutorToken) {
        navigate('/tutor/home', { replace: true });
      } else if (adminToken) {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [location.pathname, navigate]);
  
  return children;
};

function App() {
  const [isLoading, setIsLoading] = useState(true);

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
          
         <Route path="/" element={<LandingProtection/>}/>

         <Route path="/user/*" element={<UserRoutes/>}/>
         <Route path ='/tutor/*' element={<TutorRoutes/>}/>
         <Route path="/admin/*" element={<AdminRoutes/>}/>
          <Route path="*" element={<NotFoundPage/>}/>
         
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
