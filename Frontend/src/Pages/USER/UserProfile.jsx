import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Camera, Key } from 'lucide-react';
import { toast } from 'react-toastify';
import Header from './Common/Header';
import Footer from '../../components/Common/Footer';
import UserSidebar from '../../components/UserSidebar';
import ChangePasswordModal from '../../ui/ChangePasswordModal';
import EmailChangeModal from '../../ui/EmailChangeModal';
import { userAPI } from '../../api/axiosConfig';
import { uploadToCloudinary, validateImageFile } from '../../utils/cloudinary';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useLogout } from '../../hooks/useLogout';
const UserProfile = () => {
  const navigate = useNavigate();
  const { user, loading, updateProfile, updateProfileImage } = useCurrentUser();
  const { logout } = useLogout('user');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailChangeModal, setShowEmailChangeModal] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const fileInputRef = useRef(null);
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }
    try {
      setUploadingImage(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
      const uploadResult = await uploadToCloudinary(file);
      if (!uploadResult.success) {
        toast.error(uploadResult.error || 'Failed to upload image');
        setSelectedImage(null);
        return;
      }
      await userAPI.post('/api/users/upload-profile-photo', {
        imageUrl: uploadResult.url
      });
      updateProfileImage(uploadResult.url);
      setSelectedImage(null);
      toast.success('Profile photo updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload profile photo');
      setSelectedImage(null);
    } finally {
      setUploadingImage(false);
    }
  };
  const handleEditClick = () => {
    setIsEditing(true);
  };
  const handleCancelEdit = () => {
    setIsEditing(false);
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
    setSelectedImage(null);
  };
  const handleSaveProfile = async () => {
    try {
      const profileData = {
        name: formData.name,
        phone: formData.phone
      };
      const response = await userAPI.put('/api/users/profile', profileData);
      updateProfile(response.data.user);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.errors?.join(', ') ||
        'Failed to update profile';
      toast.error(errorMessage);
    }
  };
  const handlePasswordChange = async (passwordData) => {
    setIsChangingPassword(true);
    try {
      if (passwordData.action === 'sendOtp') {
        await userAPI.post('/api/users/change-password/send-otp');
        toast.success('OTP sent to your email!');
      } else if (passwordData.action === 'changePassword') {
        await userAPI.post('/api/users/change-password/verify', {
          newPassword: passwordData.password,
          otp: passwordData.otp
        });
        setShowPasswordModal(false);
        toast.success('Password changed successfully!');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to change password';
      toast.error(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };
  const handleEmailChange = async (emailData) => {
    setIsChangingEmail(true);
    try {
      if (emailData.action === 'sendOtp') {
        await userAPI.post('/api/users/change-email/send-otp', {
          newEmail: emailData.newEmail
        });
      } else if (emailData.action === 'verifyOtp') {
          await userAPI.post('/api/users/change-email/verify', {
          otp: emailData.otp,
          newEmail: emailData.newEmail
        });
        updateProfile({ email: emailData.newEmail });
        setShowEmailChangeModal(false);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to change email';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsChangingEmail(false);
    }
  };
  const handleLogout = async () => {
    await logout();
  };
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
          {/* Unified Sidebar with Profile Features */}
          <UserSidebar 
            activeSection={activeSection}
            selectedImage={selectedImage}
            uploadingImage={uploadingImage}
            onImageChange={handleImageChange}
            onLogout={handleLogout}
          />
          <div className="flex-1">
            {}
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
                {}
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
                {}
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
                {}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="flex-1 px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg text-gray-600"
                      placeholder="Enter your email"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmailChangeModal(true)}
                      className="px-4 py-3 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors font-medium"
                    >
                      Change Email
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Email changes require verification for security
                  </p>
                </div>
                {}
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
      <Footer />
      {}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handlePasswordChange}
        isLoading={isChangingPassword}
      />
      {}
      <EmailChangeModal
        isOpen={showEmailChangeModal}
        onClose={() => setShowEmailChangeModal(false)}
        onSubmit={handleEmailChange}
        isLoading={isChangingEmail}
        currentEmail={user?.email || ''}
      />
    </div>
  );
};
export default UserProfile;
