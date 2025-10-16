import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, BookOpen, GraduationCap, ShoppingBag, Heart, Award, LogOut, Edit2, Camera, Key } from 'lucide-react';
import { toast } from 'react-toastify';
import Header from './Common/Header';
import ChangePasswordModal from '../../ui/ChangePasswordModal';
import Swal from "sweetalert2";
import { userAPI } from '../../api/axiosConfig';


const UserProfile = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const fileInputRef = useRef(null);

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = () => {
      try {
        const storedUserInfo = localStorage.getItem('userInfo');
        if (storedUserInfo) {
          const userData = JSON.parse(storedUserInfo);
          setUserInfo(userData);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Update form data when user info loads
  useEffect(() => {
    if (userInfo) {
      setFormData({
        name: userInfo.name || userInfo.full_name || '',
        email: userInfo.email || '',
        phone: userInfo.phone || ''
      });
    }
  }, [userInfo]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };


  const handleSaveProfile = async () => {
    try {
      setLoading(true);

      const profileData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      };

      const response = await userAPI.put('/api/users/profile', profileData);

      // Update userInfo state with new data
      setUserInfo(response.data.user);

      // Update localStorage
      localStorage.setItem('userInfo', JSON.stringify(response.data.user));

      setIsEditing(false);
      toast.success('Profile updated successfully!');

    } catch (error) {
      console.error('Profile update error:', error);
      
      // Show more specific error message
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.join(', ') || 
                          'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };



  const handlePasswordChange = async (passwordData) => {
    setIsChangingPassword(true);
    try {
      if (passwordData.action === 'sendOtp') {
        // Send OTP for password change
        await userAPI.post('/api/users/change-password/send-otp');
        toast.success('OTP sent to your email!');
      } else if (passwordData.action === 'changePassword') {
        // Verify OTP and change password
        await userAPI.post('/api/users/change-password/verify', {
          newPassword: passwordData.password,
          otp: passwordData.otp
        });
        
        setShowPasswordModal(false);
        toast.success('Password changed successfully!');
      }
    } catch (error) {
      console.error('Password change error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to change password';
      toast.error(errorMessage);
      
      // If there's an error, don't close the modal so user can try again
      if (passwordData.action === 'changePassword') {
        // The OTP modal will stay open for user to retry
      }
    } finally {
      setIsChangingPassword(false);
    }
  };


  const handleSidebarClick = (item) => {
    if (item.id === 'logout') {
      handleLogout();
    } else if (item.path) {
      navigate(item.path);
    } else {
      setActiveSection(item.id);
      // Add functionality for other sections here
      toast.info(`${item.label} section - Coming soon!`);
    }
  };

  const sidebarItems = [
    { id: 'profile', icon: User, label: 'Profile', path: null },
    { id: 'courses', icon: BookOpen, label: 'My Courses', path: '/user/courses' },
    { id: 'teachers', icon: GraduationCap, label: 'Teachers', path: '/user/teachers' },
    { id: 'orders', icon: ShoppingBag, label: 'My Orders', path: '/user/orders' },
    { id: 'wishlist', icon: Heart, label: 'Wishlist', path: '/user/wishlist' },
    { id: 'certificates', icon: Award, label: 'Certificates', path: '/user/certificates' },
    { id: 'logout', icon: LogOut, label: 'Logout', path: null }
  ];


  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out of your account.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, logout!",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userInfo");

        Swal.fire({
          icon: "success",
          title: "Logged out!",
          text: "You have successfully logged out.",
          timer: 1500,
          showConfirmButton: false,
        });

        setTimeout(() => {
          navigate("/user/login");
        }, 1500);
      }
    });
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 bg-white rounded-2xl shadow-sm p-6">
            {/* Profile Section */}
            <div className="text-center mb-8">
              <div className="relative inline-block">
                <img
                  src={selectedImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover mx-auto"
                />
                {isEditing && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 bg-teal-600 text-white p-1.5 rounded-full hover:bg-teal-700 transition-colors"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              <h3 className="mt-3 font-semibold text-teal-600 text-lg">
                {userInfo?.name || userInfo?.full_name || 'Loading...'}
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeSection === item.id
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

          {/* Main Content */}
          <div className="flex-1">
            {/* Profile Form */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
                {!isEditing ? (
                  <button
                    onClick={handleEditClick}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${isEditing ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50'
                        }`}
                      placeholder="Enter your name"

                    />
                    {isEditing && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <Edit2 className="w-3 h-3 text-green-600" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Phone Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${isEditing ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50'
                        }`}
                      placeholder="Enter your phone number"
                    />
                    {isEditing && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <Edit2 className="w-3 h-3 text-green-600" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${isEditing ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50'
                        }`}
                      placeholder="Enter your email"
                    />
                    {isEditing && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <Edit2 className="w-3 h-3 text-green-600" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Change Password Button */}
                <div className="flex justify-center pt-6">
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    <Key className="w-4 h-4" />
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handlePasswordChange}
        isLoading={isChangingPassword}
      />
    </div>
  );
};

export default UserProfile;