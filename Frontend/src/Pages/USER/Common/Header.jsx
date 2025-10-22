import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, Search, ShoppingCart, Bell, MoreVertical } from "lucide-react";
import Button from "../../../ui/Button";
import avatar from "../../../assets/avt.webp";
import { useNavigate } from "react-router-dom";

export default function Header({ user: initialUser, onMenuClick }) {
  const [user, setUser] = useState(initialUser);
  const navigate = useNavigate();
  const cartItemCount = 0;
  const notificationCount = 0;

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  useEffect(() => {
    const loadUserInfo = () => {
      const storedUserInfo = localStorage.getItem('userInfo');
      if (storedUserInfo) {
        try {
          setUser(JSON.parse(storedUserInfo));
        } catch (error) {
          // Handle parsing error silently
        }
      }
    };

    // Listen for localStorage changes
    const handleStorageChange = (e) => {
      if (e.key === 'userInfo') {
        loadUserInfo();
      }
    };

    // Listen for custom events (for same-tab updates)
    const handleUserInfoUpdate = () => {
      loadUserInfo();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userInfoUpdated', handleUserInfoUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userInfoUpdated', handleUserInfoUpdate);
    };
  }, []);

  return (
    <header className="border-b bg-white border-gray-200">
      {/* Mobile Search Overlay */}
      {/* Main Header Content */}
      <div className="container mx-auto flex h-16 items-center px-4 justify-between">
        {/* Left Section: Menu and Logo */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:inline-block md:inline-block"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>

          <Link
            className="flex items-center gap-2 font-bold text-xl md:text-2xl text-sky-500"
            to="/user/home"
          >
            Scholaro
          </Link>
        </div>

        {/* Desktop Search Box */}
        <div className="hidden md:flex relative flex-1 max-w-lg mx-4">
          <input
            type="text"
            placeholder="Search courses..."
            className="w-full bg-gray-100 text-gray-700 rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            <Search className="h-5 w-5" />
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex gap-6 items-center">
          <Link
            to="/user/home"
            className="text-sm font-medium hover:text-sky-500 text-gray-900"
          >
            Home
          </Link>
          <Link
            to="/user/aboutus"
            className="text-sm font-medium hover:text-sky-500 text-gray-900"
          >
            About Us
          </Link>
          <Link
            to="/user/contact"
            className="text-sm font-medium hover:text-sky-500 text-gray-900"
          >
            Contact
          </Link>
          <Link
            to="/user/courses"
            className="text-sm font-medium hover:text-sky-500 text-gray-900"
          >
            Courses
          </Link>
          <Link
            to="/user/alltutor"
            className="text-sm font-medium pr-4 hover:text-sky-500 text-gray-900"
          >
            Tutors
          </Link>
        </nav>

        {/* Right Section: Search Toggle, Notifications, Cart, Profile, and Theme */}
        <div className="flex items-center gap-4">
          {/* Mobile Search Toggle */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="h-5 w-5" />
          </Button>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-gray-100"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-sky-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {notificationCount}
                </span>
              )}
            </Button>
          </div>
          {/* Cart Button with Counter */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-gray-100"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {cartItemCount}
                </span>
              )}
            </Button>
          </div>

          <img
            src={user?.profileImage || avatar}
            alt="Profile"
            className="h-8 w-8 rounded-full object-cover"
            onClick={() => navigate("/user/profile")}
          />

          <div className="relative lg:hidden">
            <Button variant="ghost" size="icon" className="ml-2">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
