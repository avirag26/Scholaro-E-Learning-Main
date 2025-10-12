
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import UserRoutes from "../Routes/userRoutes"
import TutorRoutes from "../Routes/tutorRoutes";
import LandingProtection from "./components/RouteProtection/LandingProtection";
import NotFoundPage from "./ui/NotFound";
import AdminRoutes from "../Routes/adminRoutes";

// Global route guard
const GlobalGuard = ({ children }) => {
  const location = useLocation();
  
  useEffect(() => {
    const userToken = localStorage.getItem('authToken');
    const tutorToken = localStorage.getItem('tutorAuthToken');
    const adminToken = localStorage.getItem('adminAuthToken');
    
    const authPages = [
      '/tutor/login', '/user/login', '/admin/login',
      '/tutor/register', '/user/register',
      '/tutor/forgot-password', '/user/forgot-password', '/admin/forgot-password'
    ];
    
    // If logged in and on auth page, redirect
    if ((userToken || tutorToken || adminToken) && authPages.includes(location.pathname)) {
      if (userToken) {
        window.location.replace('/user/home');
      } else if (tutorToken) {
        window.location.replace('/tutor/home');
      } else if (adminToken) {
        window.location.replace('/admin/dashboard');
      }
    }
  }, [location.pathname]);
  
  return children;
};

function App() {
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
  
    </>
  )
}

export default App
