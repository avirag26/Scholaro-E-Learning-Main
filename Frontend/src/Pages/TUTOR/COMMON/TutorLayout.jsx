import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "../../../components/Common/Footer";
import TutorSidebar from "./TutorSidebar";
import { tutorAPI } from "../../../api/axiosConfig";
import { toast } from "sonner";
import { useCurrentTutor } from "../../../hooks/useCurrentTutor";
import { useLogout } from "../../../hooks/useLogout";
const TutorLayout = ({ children }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useCurrentTutor();
  const { forceLogout } = useLogout('tutor');
  const hasCheckedStatus = useRef(false);
  useEffect(() => {
    if (hasCheckedStatus.current) return;
    hasCheckedStatus.current = true;
    if (!isAuthenticated) {
      navigate('/tutor/login');
      return;
    }
    tutorAPI.get('/api/tutors/check-status')
      .then(response => {
        const data = response.data;
        if (data.isBlocked) {
          forceLogout();
        }
      })
      .catch(error => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          forceLogout();
        }
      });
  }, [navigate, isAuthenticated, forceLogout]);
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
