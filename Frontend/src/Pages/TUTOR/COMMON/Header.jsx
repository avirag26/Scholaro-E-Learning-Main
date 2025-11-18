import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, User, Menu, X } from "lucide-react";
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
      <header className="w-full bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
          {/* Left side - Logo and Menu */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
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
            
            {/* Desktop Sidebar Toggle */}
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            
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
            <div className="hidden sm:block">
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

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="fixed top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
            <nav className="px-4 py-6 space-y-4">
              <button
                onClick={() => {
                  navigate('/tutor/home');
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left text-base font-medium text-gray-900 hover:text-sky-500 py-2 transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  navigate('/tutor/courses');
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left text-base font-medium text-gray-900 hover:text-sky-500 py-2 transition-colors"
              >
                My Courses
              </button>
            
              <button
                onClick={() => {
                  navigate('/tutor/orders');
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left text-base font-medium text-gray-900 hover:text-sky-500 py-2 transition-colors"
              >
                Orders
              </button>
              <button
                onClick={() => {
                  navigate('/tutor/wallet');
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left text-base font-medium text-gray-900 hover:text-sky-500 py-2 transition-colors"
              >
                Wallet
              </button>
                <button
                onClick={() => {
                  handleLogout()
                }}
                className="block w-full text-left text-base font-medium text-gray-900 hover:text-sky-500 py-2 transition-colors"
              >
                Logout
              </button>
              
              {/* Mobile-only actions */}
              <div className="pt-4 border-t border-gray-200 space-y-4">
                <button
                  className="flex items-center gap-3 text-base font-medium text-gray-900 hover:text-sky-500 py-2 transition-colors w-full text-left"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Search className="h-5 w-5" />
                  Search
                </button>
                <div className="flex items-center gap-3 py-2">
                  <NotificationDropdown userType="tutor" />
                  <span className="text-base font-medium text-gray-900">Notifications</span>
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
