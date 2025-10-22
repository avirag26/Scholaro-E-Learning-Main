import { useState, useRef, useEffect } from 'react';
import { Edit2, Camera, User, Mail, Phone } from 'lucide-react';
import { toast } from 'react-toastify';
import AdminLayout from './common/AdminLayout';
import { adminAPI } from '../../api/axiosConfig';
import { uploadToCloudinary, validateImageFile } from '../../utils/cloudinary';

const AdminProfile = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [adminInfo, setAdminInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const fileInputRef = useRef(null);

    // Load admin data on component mount
    useEffect(() => {
        const loadAdminData = async () => {
            try {
                // First try to fetch from backend
                const response = await adminAPI.get('/api/admin/profile');
                const adminData = response.data.admin;
                setAdminInfo(adminData);
                localStorage.setItem('adminInfo', JSON.stringify(adminData));
            } catch (error) {
                // If API fails, try localStorage as fallback
                try {
                    const storedAdminInfo = localStorage.getItem('adminInfo');
                    if (storedAdminInfo) {
                        const adminData = JSON.parse(storedAdminInfo);
                        setAdminInfo(adminData);
                    } else {
                        // Set empty data if no local data found
                        setAdminInfo({
                            name: '',
                            email: '',
                            phone: ''
                        });
                    }
                } catch (localError) {
                    // Set empty data on error
                    setAdminInfo({
                        name: '',
                        email: '',
                        phone: ''
                    });
                }
            } finally {
                setLoading(false);
            }
        };

        loadAdminData();
    }, []);

    // Update form data when admin info loads
    useEffect(() => {
        if (adminInfo) {
            setFormData({
                name: adminInfo.name || adminInfo.full_name || '',
                email: adminInfo.email || '',
                phone: adminInfo.phone || ''
            });
        }
    }, [adminInfo]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file
        const validation = validateImageFile(file);
        if (!validation.valid) {
            toast.error(validation.error);
            return;
        }

        try {
            setUploadingImage(true);

            // Show preview immediately
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result);
            };
            reader.readAsDataURL(file);

            // Upload to Cloudinary
            const uploadResult = await uploadToCloudinary(file);

            if (!uploadResult.success) {
                toast.error(uploadResult.error || 'Failed to upload image');
                setSelectedImage(null);
                return;
            }

            // Update profile photo in backend
            await adminAPI.post('/api/admin/upload-profile-photo', {
                imageUrl: uploadResult.url
            });

            // Update adminInfo state and localStorage
            const updatedAdminInfo = { ...adminInfo, profileImage: uploadResult.url };
            setAdminInfo(updatedAdminInfo);
            localStorage.setItem('adminInfo', JSON.stringify(updatedAdminInfo));

            // Dispatch custom event to notify header of update
            window.dispatchEvent(new CustomEvent('adminInfoUpdated'));

            // Clear the preview image so it shows the uploaded image from adminInfo
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
        // Reset form data to original values
        if (adminInfo) {
            setFormData({
                name: adminInfo.name || adminInfo.full_name || '',
                email: adminInfo.email || '',
                phone: adminInfo.phone || ''
            });
        }
        // Clear any preview image
        setSelectedImage(null);
    };

    const handleSaveProfile = async () => {
        try {
            setLoading(true);

            const profileData = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone
            };

            const response = await adminAPI.put('/api/admin/profile', profileData);

            // Preserve the existing profile image when updating other fields
            const updatedAdminInfo = {
                ...response.data.admin,
                profileImage: adminInfo?.profileImage || response.data.admin.profileImage
            };

            setAdminInfo(updatedAdminInfo);
            localStorage.setItem('adminInfo', JSON.stringify(updatedAdminInfo));

            // Dispatch custom event to notify header of update
            window.dispatchEvent(new CustomEvent('adminInfoUpdated'));

            setIsEditing(false);
            toast.success('Profile updated successfully!');

        } catch (error) {
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.errors?.join(', ') ||
                'Failed to update profile';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };



    // Show loading state
    if (loading) {
        return (
            <AdminLayout title="Profile Settings" subtitle="Manage your admin profile">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading profile...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Profile Settings" subtitle="Manage your admin profile">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm p-8">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Admin Profile</h2>
                        {!isEditing ? (
                            <button
                                onClick={handleEditClick}
                                className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                            >
                                <Edit2 className="w-4 h-4" />
                                Edit Profile
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={loading}
                                    className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Save'}
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

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Profile Image Section */}
                        <div className="md:col-span-1">
                            <div className="text-center">
                                <div className="relative inline-block">
                                    <img
                                        src={selectedImage || adminInfo?.profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"}
                                        alt="Admin Profile"
                                        className="w-32 h-32 rounded-full object-cover mx-auto shadow-lg border-4 border-sky-100"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingImage}
                                        className="absolute -bottom-2 -right-2 bg-sky-500 text-white p-2 rounded-full hover:bg-sky-600 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {uploadingImage ? (
                                            <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <Camera className="w-4 h-4" />
                                        )}
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                        disabled={uploadingImage}
                                    />
                                </div>
                                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                                    {adminInfo?.name || adminInfo?.full_name || 'Admin'}
                                </h3>
                                <p className="text-gray-600">System Administrator</p>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Name Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <User className="w-4 h-4 inline mr-2" />
                                    Full Name
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        disabled={!isEditing}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 ${isEditing ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50'
                                            }`}
                                        placeholder="Enter your full name"
                                    />
                                    {isEditing && (
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                            <div className="w-6 h-6 bg-sky-100 rounded-full flex items-center justify-center">
                                                <Edit2 className="w-3 h-3 text-sky-600" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Email Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Mail className="w-4 h-4 inline mr-2" />
                                    Email Address
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        disabled={!isEditing}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 ${isEditing ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50'
                                            }`}
                                        placeholder="Enter your email address"
                                    />
                                    {isEditing && (
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                            <div className="w-6 h-6 bg-sky-100 rounded-full flex items-center justify-center">
                                                <Edit2 className="w-3 h-3 text-sky-600" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Phone Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Phone className="w-4 h-4 inline mr-2" />
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        disabled={!isEditing}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 ${isEditing ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50'
                                            }`}
                                        placeholder="Enter your phone number"
                                    />
                                    {isEditing && (
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                            <div className="w-6 h-6 bg-sky-100 rounded-full flex items-center justify-center">
                                                <Edit2 className="w-3 h-3 text-sky-600" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>


                        </div>
                    </div>
                </div>
            </div>


        </AdminLayout>
    );
};

export default AdminProfile;