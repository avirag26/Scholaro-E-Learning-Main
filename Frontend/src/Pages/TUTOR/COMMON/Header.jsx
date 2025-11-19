import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Menu, X } from "lucide-react";
import NotificationDropdown from "../../../components/Notifications/NotificationDropdown";
import { useLogout } from "../../../hooks/useLogout";
export default function Header({ onMenuClick }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [tutorInfo, setTutorInfo] = useState(null);
  const { logout } = useLogout('tutor');
  useEffect(() => {
    const loadTutorInfo = () => {
      const storedTutorInfo = localStorage.getItem('tutorInfo');
      if (storedTutorInfo) {
        try {
          setTutorInfo(JSON.parse(storedTutorInfo));
        } catch (error) {
          console.log(error.message)
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
  const handleLogout = async () => {
    await logout();
  };
  return (
    <>
      <header className="w-full bg-white border-b border-gray-200 shadow-sm sticky top-0 z-[70]">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
          {/* Left side - Logo and Menu */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button Only */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            <div className="flex items-center">
              <span className="text-xl sm:text-2xl font-bold text-sky-500">Scholaro</span>
              <span className="ml-2 text-xs sm:text-sm text-gray-500 font-medium">Tutor</span>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Search - Hidden on mobile */}
            <button className="hidden md:flex p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Search className="h-5 w-5 text-gray-600" />
            </button>

            {/* Notifications */}
            <div>
              <NotificationDropdown userType="tutor" />
            </div>

            {/* Profile */}
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
              <span className="text-gray-700 font-medium hidden md:block">
                {tutorInfo?.name || 'Tutor'}
              </span>
            </button>


          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu - Sidebar style from left */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="lg:hidden fixed inset-0 z-[60]" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside 
            className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-white shadow-lg overflow-y-auto z-[61]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Profile Section */}
            <div className="flex flex-col items-center py-8 border-b border-gray-200">
              {tutorInfo?.profileImage ? (
                <img
                  src={tutorInfo.profileImage}
                  alt="Tutor Profile"
                  className="w-20 h-20 rounded-full object-cover shadow"
                />
              ) : (
                <div className="w-20 h-20 bg-sky-500 rounded-full flex items-center justify-center shadow">
                  <span className="text-white text-2xl font-medium">
                    {tutorInfo?.name?.charAt(0) || 'T'}
                  </span>
                </div>
              )}
              <div className="mt-4 text-sky-500 font-semibold text-base text-center px-2">
                {tutorInfo?.name || 'Tutor'}
              </div>
              <button className="mt-2 px-3 py-1 bg-sky-50 rounded-full text-sky-600 text-xs border flex items-center gap-1 hover:bg-sky-100 transition">
                Share Profile
              </button>
            </div>

            {/* Navigation */}
            <nav className="px-4 py-6 space-y-2">
              <button
                onClick={() => {
                  navigate('/tutor/home');
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full text-left text-base font-medium text-sky-500 hover:bg-sky-50 px-4 py-3 rounded-lg transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  navigate('/tutor/profile');
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full text-left text-base font-medium text-sky-500 hover:bg-sky-50 px-4 py-3 rounded-lg transition-colors"
              >
                Profile
              </button>
              <button
                onClick={() => {
                  navigate('/tutor/courses');
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full text-left text-base font-medium text-sky-500 hover:bg-sky-50 px-4 py-3 rounded-lg transition-colors"
              >
                Courses
              </button>
              <button
                onClick={() => {
                  navigate('/tutor/orders');
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full text-left text-base font-medium text-sky-500 hover:bg-sky-50 px-4 py-3 rounded-lg transition-colors"
              >
                Orders
              </button>
              <button
                onClick={() => {
                  navigate('/tutor/wallet');
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full text-left text-base font-medium text-sky-500 hover:bg-sky-50 px-4 py-3 rounded-lg transition-colors"
              >
                Wallet
              </button>
              <button
                onClick={() => {
                  navigate('/tutor/coupons');
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full text-left text-base font-medium text-sky-500 hover:bg-sky-50 px-4 py-3 rounded-lg transition-colors"
              >
                Coupons
              </button>
              <button
                onClick={() => {
                  navigate('/tutor/chat');
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full text-left text-base font-medium text-sky-500 hover:bg-sky-50 px-4 py-3 rounded-lg transition-colors"
              >
                Chat & Video
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full text-left text-base font-medium text-sky-500 hover:bg-sky-50 px-4 py-3 rounded-lg transition-colors mt-4 pt-4 border-t border-gray-200"
              >
                Logout
              </button>
            </nav>
          </aside>
        </>
      )}
    </>
  );
}
