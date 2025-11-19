import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Search, ShoppingCart, Heart, MessageCircle, User, Settings, LogOut, BookOpen, ShoppingBag } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import Button from "../../../ui/Button";
import avatar from "../../../assets/avt.webp";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../../../hooks/useCurrentUser";
import { getCart } from "../../../Redux/cartSlice";
import { getWishlist } from "../../../Redux/wishlistSlice";
import NotificationDropdown from "../../../components/Notifications/NotificationDropdown";

export default function Header({ onMenuClick }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useCurrentUser(); // Get user from Redux
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { totalItems: cartItemCount } = useSelector(state => state.cart);
  const { items: wishlistItems } = useSelector(state => state.wishlist);
  const { totalUnreadCount = 0 } = useSelector(state => state.chat || {});


  useEffect(() => {
    if (user) {
      dispatch(getCart());
      dispatch(getWishlist());
    }
  }, [dispatch, user]);

  const handleLogout = () => {
    // Add logout logic here
    localStorage.removeItem('token');
    navigate('/user/login');
  };
  return (
    <>
      <header className="border-b bg-white border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto flex h-14 sm:h-16 items-center px-3 sm:px-4 justify-between">
          {/* Left side - Logo and Menu */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Hamburger Menu for Mobile Only */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 sm:h-10 sm:w-10"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="sr-only">Toggle mobile menu</span>
            </Button>

            <Link
              className="flex items-center gap-2 font-bold text-lg sm:text-xl md:text-2xl text-sky-500"
              to="/user/home"
            >
              Scholaro
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex gap-6 xl:gap-9 items-center">
            <Link
              to="/user/home"
              className="text-sm font-medium hover:text-sky-500 text-gray-900 transition-colors"
            >
              Home
            </Link>
            <Link
              to="/user/aboutus"
              className="text-sm font-medium hover:text-sky-500 text-gray-900 transition-colors"
            >
              About Us
            </Link>
            <Link
              to="/user/contact"
              className="text-sm font-medium hover:text-sky-500 text-gray-900 transition-colors"
            >
              Contact
            </Link>
            <Link
              to="/user/courses"
              className="text-sm font-medium hover:text-sky-500 text-gray-900 transition-colors"
            >
              Courses
            </Link>
            <Link
              to="/user/certificates"
              className="text-sm font-medium hover:text-sky-500 text-gray-900 transition-colors"
            >
              Certificates
            </Link>
            <Link
              to="/user/teachers"
              className="text-sm font-medium hover:text-sky-500 text-gray-900 transition-colors"
            >
              Tutors
            </Link>
          </nav>

          {/* Right side - Actions */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
            {/* Search - Hidden on mobile */}
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Search className="h-5 w-5" />
            </Button>

            {/* Wishlist */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-gray-100 h-8 w-8 sm:h-10 sm:w-10"
                onClick={() => navigate("/user/wishlist")}
              >
                <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
                {wishlistItems?.length > 0 && (
                  <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-medium">
                    {wishlistItems.length > 9 ? '9+' : wishlistItems.length}
                  </span>
                )}
              </Button>
            </div>

            {/* Cart */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-gray-100 h-8 w-8 sm:h-10 sm:w-10"
                onClick={() => navigate("/user/cart")}
              >
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-sky-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-medium">
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </span>
                )}
              </Button>
            </div>

            {/* Chat */}
            <div className="relative hidden sm:block">
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-gray-100"
                onClick={() => navigate("/user/chat")}
              >
                <MessageCircle className="h-5 w-5" />
                {totalUnreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </span>
                )}
              </Button>
            </div>

            {/* Notifications */}
            <div>
              <NotificationDropdown userType="user" />
            </div>

            {/* Profile Button - Direct Navigation */}
            <button
              onClick={() => navigate('/user/profile')}
              className="flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 rounded-full hover:bg-gray-100 transition-colors min-w-[2.5rem] sm:min-w-[3rem] justify-center"
              aria-label="Go to profile"
            >
              <img
                src={user?.profileImage || avatar}
                alt="Profile"
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover ring-2 ring-transparent hover:ring-sky-200 transition-all"
              />
            </button>


          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="fixed top-14 sm:top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg max-h-[calc(100vh-3.5rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto">
            <nav className="px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
              <Link
                to="/user/home"
                className="block text-base font-medium text-gray-900 hover:text-sky-500 py-2 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/user/aboutus"
                className="block text-base font-medium text-gray-900 hover:text-sky-500 py-2 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About Us
              </Link>
              <Link
                to="/user/contact"
                className="block text-base font-medium text-gray-900 hover:text-sky-500 py-2 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </Link>
              <Link
                to="/user/courses"
                className="block text-base font-medium text-gray-900 hover:text-sky-500 py-2 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Courses
              </Link>
              <Link
                to="/user/certificates"
                className="block text-base font-medium text-gray-900 hover:text-sky-500 py-2 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Certificates
              </Link>
              <Link
                to="/user/teachers"
                className="block text-base font-medium text-gray-900 hover:text-sky-500 py-2 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Tutors
              </Link>

              {/* Mobile Profile Section */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-3 px-2 py-3 bg-gray-50 rounded-lg mb-4">
                  <img
                    src={user?.profileImage || avatar}
                    alt="Profile"
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Link
                    to="/user/profile"
                    className="flex items-center gap-3 text-base font-medium text-gray-900 hover:text-sky-500 py-2 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5" />
                    My Profile
                  </Link>

                  <Link
                    to="/user/my-courses"
                    className="flex items-center gap-3 text-base font-medium text-gray-900 hover:text-sky-500 py-2 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <BookOpen className="h-5 w-5" />
                    My Courses
                  </Link>

                  <Link
                    to="/user/my-orders"
                    className="flex items-center gap-3 text-base font-medium text-gray-900 hover:text-sky-500 py-2 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <ShoppingBag className="h-5 w-5" />
                    My Orders
                  </Link>

                  <Link
                    to="/user/chat"
                    className="flex items-center gap-3 text-base font-medium text-gray-900 hover:text-sky-500 py-2 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <MessageCircle className="h-5 w-5" />
                    Chat
                    {totalUnreadCount > 0 && (
                      <span className="bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium ml-auto">
                        {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    to="/user/settings"
                    className="flex items-center gap-3 text-base font-medium text-gray-900 hover:text-sky-500 py-2 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Settings className="h-5 w-5" />
                    Settings
                  </Link>

                  <button
                    className="flex items-center gap-3 text-base font-medium text-gray-900 hover:text-sky-500 py-2 transition-colors w-full text-left"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      // Add search functionality here
                    }}
                  >
                    <Search className="h-5 w-5" />
                    Search
                  </button>

                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 text-base font-medium text-red-600 hover:text-red-700 py-2 transition-colors w-full text-left mt-4 pt-4 border-t border-gray-200"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </button>
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
