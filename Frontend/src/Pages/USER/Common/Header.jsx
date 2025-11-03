import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, Search, ShoppingCart, Bell, MoreVertical, Heart, MessageCircle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import Button from "../../../ui/Button";
import avatar from "../../../assets/avt.webp";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../../../hooks/useCurrentUser";
import { getCart } from "../../../Redux/cartSlice";
import { getWishlist } from "../../../Redux/wishlistSlice";
export default function Header({ onMenuClick }) {
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
    <header className="border-b bg-white border-gray-200">
      {}
      {}
      <div className="container mx-auto flex h-16 items-center px-4 justify-between">
        {}
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
        {}
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
        {}
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
            to="/user/teachers"
            className="text-sm font-medium pr-4 hover:text-sky-500 text-gray-900"
          >
            Tutors
          </Link>
        </nav>
        {}
        <div className="flex items-center gap-4">
          {}
          <Button variant="ghost" size="icon" className="md:hidden">
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
          <div className="relative">
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
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-gray-100"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {notificationCount}
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
