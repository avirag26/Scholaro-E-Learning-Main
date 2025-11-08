import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, User } from "lucide-react";
import NotificationDropdown from "../../../components/Notifications/NotificationDropdown";
export default function Header() {
  const navigate = useNavigate();
  const [tutorInfo, setTutorInfo] = useState(null);
  useEffect(() => {
    const loadTutorInfo = () => {
      const storedTutorInfo = localStorage.getItem('tutorInfo');
      if (storedTutorInfo) {
        try {
          setTutorInfo(JSON.parse(storedTutorInfo));
        } catch (error) {
        }
      }
    };
    loadTutorInfo();
    const handleStorageChange = (e) => {
      if (e.key === 'tutorInfo') {
        loadTutorInfo();
      }
    };
    const handleTutorInfoUpdate = () => {
      loadTutorInfo();
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('tutorInfoUpdated', handleTutorInfoUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tutorInfoUpdated', handleTutorInfoUpdate);
    };
  }, []);
  return (
    <header className="w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-3">
        {}
        <div className="flex items-center">
          <span className="text-2xl font-bold text-sky-500">Scholaro</span>
          <span className="ml-2 text-sm text-gray-500 font-medium">Tutor</span>
        </div>
        {}
        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search courses, students..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-gray-50"
            />
          </div>
        </div>
        {}
        <div className="flex items-center space-x-4">
          {}
          <NotificationDropdown userType="tutor" />
          {}
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate('/tutor/profile')}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {tutorInfo?.profileImage ? (
                <img
                  src={tutorInfo.profileImage}
                  alt="Tutor Profile"
                  className="w-8 h-8 rounded-full object-cover border-2 border-sky-200"
                />
              ) : (
                <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {tutorInfo?.name?.charAt(0) || 'T'}
                  </span>
                </div>
              )}
              <span className="text-gray-700 font-medium hidden sm:block">
                {tutorInfo?.name || 'Tutor'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
