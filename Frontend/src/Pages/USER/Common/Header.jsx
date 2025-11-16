import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Search, ShoppingCart, Bell, MoreVertical, Heart, MessageCircle, X } from "lucide-react";
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
  const notificationCount = 0;

  useEffect(() => {
    if (user) {
      dispatch(getCart());
      dispatch(getWishlist());
    }
  }, [dispatch, user]);
  return (
    <>
      <header className="border-b bg-white border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center px-4 justify-between">
          {/* Left side - Logo and Menu */}
          <div className="flex items-center gap-4">
            {/* Hamburger Menu for Mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle mobile menu</span>
            </Button>
            
            {/* Sidebar Menu for Desktop */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:inline-block"
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
          <div className="flex items-center gap-2 md:gap-4">
            {/* Search - Hidden on mobile */}
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Search className="h-5 w-5" />
            </Button>
            
            {/* Wishlist */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-gray-100"
                onClick={() => navigate("/user/wishlist")}
              >
                <Heart className="h-5 w-5" />
                {wishlistItems?.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {wishlistItems.length}
                  </span>
                )}
              </Button>
            </div>

            {/* Cart */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-gray-100"
                onClick={() => navigate("/user/cart")}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-sky-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {cartItemCount}
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
            <div className="hidden sm:block">
              <NotificationDropdown userType="user" />
            </div>
            
            {/* Profile */}
            <img
              src={user?.profileImage || avatar}
              alt="Profile"
              className="h-8 w-8 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-sky-300 transition-all"
              onClick={() => navigate("/user/profile")}
            />
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="fixed top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
            <nav className="px-4 py-6 space-y-4">
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
              
              {/* Mobile-only actions */}
              <div className="pt-4 border-t border-gray-200 space-y-4">
                <Link
                  to="/user/chat"
                  className="flex items-center gap-3 text-base font-medium text-gray-900 hover:text-sky-500 py-2 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <MessageCircle className="h-5 w-5" />
                  Chat
                  {totalUnreadCount > 0 && (
                    <span className="bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                    </span>
                  )}
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
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
