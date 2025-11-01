import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, BookOpen, GraduationCap, ShoppingBag, Award, LogOut, Heart, Camera } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCurrentUser } from '../hooks/useCurrentUser';

const UserSidebar = ({ 
  activeSection = 'profile',
  // Profile-specific props (optional)
  selectedImage = null,
  uploadingImage = false,
  onImageChange = null,
  onLogout = null
}) => {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const fileInputRef = useRef(null);
  
  // Check if this is the profile page (has image upload functionality)
  const isProfilePage = activeSection === 'profile' && onImageChange;

  const handleSidebarClick = (item) => {
    if (item.id === 'logout') {
      if (onLogout) {
        onLogout(); // Use custom logout handler if provided (for profile page)
      } else {
        toast.info('Logout functionality - Coming soon!');
      }
    } else if (item.path) {
      navigate(item.path);
    } else {
      // Item is already active, no need to do anything
      if (item.id !== activeSection) {
        toast.info(`${item.label} section - Coming soon!`);
      }
    }
  };

  const sidebarItems = [
    { id: 'profile', icon: User, label: 'Profile', path: '/user/profile' },
    { id: 'courses', icon: BookOpen, label: 'My Courses', path: '/user/courses' },
    { id: 'teachers', icon: GraduationCap, label: 'Teachers', path: '/user/teachers' },
    { id: 'orders', icon: ShoppingBag, label: 'My Orders', path: '/user/orders' },
    { id: 'cart', icon: ShoppingBag, label: 'Shopping Cart', path: '/user/cart' },
    { id: 'wishlist', icon: Heart, label: 'Wishlist', path: '/user/wishlist' },
    { id: 'certificates', icon: Award, label: 'Certificates', path: '/user/certificates' },
    { id: 'logout', icon: LogOut, label: 'Logout', path: null }
  ];

  return (
    <div className="w-64 bg-white rounded-2xl shadow-sm p-6">
      {/* Profile Section */}
      <div className="text-center mb-8">
        <div className="relative inline-block">
          <img
            src={selectedImage || user?.profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"}
            alt="Profile"
            className="w-20 h-20 rounded-full object-cover mx-auto"
          />
          {/* Show camera button only on profile page */}
          {isProfilePage && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="absolute -bottom-1 -right-1 bg-teal-600 text-white p-1.5 rounded-full hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingImage ? (
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Camera className="w-3 h-3" />
              )}
            </button>
          )}
          {/* File input for profile page */}
          {isProfilePage && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onImageChange}
              className="hidden"
              disabled={uploadingImage}
            />
          )}
        </div>
        <h3 className="mt-3 font-semibold text-teal-600 text-lg">
          {user?.name || 'John Doe'}
        </h3>
        <button className="mt-2 px-4 py-1 bg-teal-50 text-teal-600 text-sm rounded-full border border-teal-200 hover:bg-teal-100 transition-colors flex items-center gap-1 mx-auto">
          <span>Share Profile</span>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="space-y-1">
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleSidebarClick(item)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeSection === item.id
                ? 'bg-teal-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default UserSidebar;