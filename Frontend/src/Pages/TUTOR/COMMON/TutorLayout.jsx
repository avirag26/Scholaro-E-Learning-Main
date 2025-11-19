import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "../../../components/Common/Footer";
import TutorSidebar from "./TutorSidebar";
import { tutorAPI } from "../../../api/axiosConfig";

import { useCurrentTutor } from "../../../hooks/useCurrentTutor";
import { useLogout } from "../../../hooks/useLogout";

const TutorLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
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
  // Check if current page is chat to apply different layout
  const isChatPage = location.pathname.includes('/chat');

  if (isChatPage) {
    // Full height layout for chat page - use consistent chat header
    return (
      <div className="h-screen bg-gray-50 w-full flex flex-col">
        {children}
      </div>
    );
  }

  // Normal layout for other pages
  return (
    <div className="min-h-screen bg-[#f2fbf6] w-full flex flex-col">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 w-full overflow-hidden">
        <TutorSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 my-2 sm:my-4 lg:my-6 mx-2 sm:mx-4 lg:ml-0 lg:mr-4 overflow-x-hidden w-full min-w-0">
          <div className="max-w-full overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};
export default TutorLayout;
