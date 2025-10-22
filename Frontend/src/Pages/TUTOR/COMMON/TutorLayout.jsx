import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import TutorSidebar from "./TutorSidebar";
import { tutorAPI } from "../../../api/axiosConfig";

const TutorLayout = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    
    const token = localStorage.getItem('tutorAuthToken');
    if (!token) {
      navigate('/tutor/login');
      return;
    }


    tutorAPI.get('/api/tutors/check-status')
      .then(response => {
        const data = response.data;
        if (data.isBlocked) {
          localStorage.removeItem('tutorAuthToken');
          localStorage.removeItem('tutorInfo');
          navigate('/tutor/login');
        }
      })
      .catch(error => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('tutorAuthToken');
          localStorage.removeItem('tutorInfo');
          navigate('/tutor/login');
        }
      });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#f2fbf6] w-full flex flex-col">
      <Header />
      
      <div className="flex flex-1 w-full">
        <TutorSidebar />
        
        <main className="flex-1 my-6 mr-4">
          {children}
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default TutorLayout;