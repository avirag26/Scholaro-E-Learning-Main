import { useState, useRef, useEffect } from 'react';
import { Edit2, Camera, Key, FileText, GraduationCap } from 'lucide-react';
import { toast } from 'react-toastify';
import ChangePasswordModal from '../../ui/ChangePasswordModal';
import EmailChangeModal from '../../ui/EmailChangeModal';
import TutorLayout from './COMMON/TutorLayout';
import { tutorAPI } from '../../api/axiosConfig';
import { uploadToCloudinary, validateImageFile } from '../../utils/cloudinary';


const TutorProfile = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showEmailChangeModal, setShowEmailChangeModal] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isChangingEmail, setIsChangingEmail] = useState(false);
    const [tutorInfo, setTutorInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subjects: '',
        bio: ''
    });
    const fileInputRef = useRef(null);

    // Load tutor data on component mount
    useEffect(() => {
        const loadTutorData = async () => {
            try {
                // First try to fetch from backend
                const response = await tutorAPI.get('/api/tutors/profile');
                const tutorData = response.data.tutor;
                setTutorInfo(tutorData);
                localStorage.setItem('tutorInfo', JSON.stringify(tutorData));
            } catch (error) {
                // If API fails, try localStorage as fallback
                try {
                    const storedTutorInfo = localStorage.getItem('tutorInfo');
                    if (storedTutorInfo) {
                        const tutorData = JSON.parse(storedTutorInfo);
                        setTutorInfo(tutorData);
                    } else {
                        // Set empty data if no local data found
                        setTutorInfo({
                            name: '',
                            email: '',
                            phone: '',
                            subjects: '',
                            bio: ''
                        });
                    }
                } catch (localError) {
                    // Set empty data on error
                    setTutorInfo({
                        name: '',
                        email: '',
                        phone: '',
                        subjects: '',
                        bio: ''
                    });
                }
            } finally {
                setLoading(false);
            }
        };

        loadTutorData();
    }, []);

    // Update form data when tutor info loads
    useEffect(() => {
        if (tutorInfo) {
            setFormData({
                name: tutorInfo.name || tutorInfo.full_name || '',
                email: tutorInfo.email || '',
                phone: tutorInfo.phone || '',
                subjects: tutorInfo.subjects || '',
                bio: tutorInfo.bio || ''
            });
        }
    }, [tutorInfo]);

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
            await tutorAPI.post('/api/tutors/upload-profile-photo', {
                imageUrl: uploadResult.url
            });

            // Update tutorInfo state and localStorage
            const updatedTutorInfo = { ...tutorInfo, profileImage: uploadResult.url };
            setTutorInfo(updatedTutorInfo);
            localStorage.setItem('tutorInfo', JSON.stringify(updatedTutorInfo));
            
            // Dispatch custom event to notify header of update
            window.dispatchEvent(new CustomEvent('tutorInfoUpdated'));

            // Clear the preview image so it shows the uploaded image from tutorInfo
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
        if (tutorInfo) {
            setFormData({
                name: tutorInfo.name || tutorInfo.full_name || '',
                email: tutorInfo.email || '',
                phone: tutorInfo.phone || '',
                subjects: tutorInfo.subjects || '',
                bio: tutorInfo.bio || ''
            });
        }
    };

    const handleSaveProfile = async () => {
        try {
            setLoading(true);

            const profileData = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                subjects: formData.subjects,
                bio: formData.bio
            };

            const response = await tutorAPI.put('/api/tutors/profile', profileData);
            
            // Preserve the existing profile image when updating other fields
            const updatedTutorInfo = {
                ...response.data.tutor,
                profileImage: tutorInfo?.profileImage || response.data.tutor.profileImage
            };
            
            setTutorInfo(updatedTutorInfo);
            localStorage.setItem('tutorInfo', JSON.stringify(updatedTutorInfo));
            
            // Dispatch custom event to notify header of update
            window.dispatchEvent(new CustomEvent('tutorInfoUpdated'));

            setIsEditing(false);
            toast.success('Profile updated successfully!');
        } catch (error) {
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.errors?.join(', ') ||
                'Failed to update profile';
            toast.error(errorMessage);
        } finally {
            setLoading(false)
        }
    };

    const handlePasswordChange = async (passwordData) => {
        setIsChangingPassword(true);
        try {
            if (passwordData.action === 'sendOtp') {
                await tutorAPI.post('/api/tutors/change-password/send-otp');
                toast.success("OTP sent to your email");
            } else if (passwordData.action === 'chnagePassword') {

                await tutorAPI.post('/api/tutors/change-password/verify', {
                    newPassword: passwordData.password,
                    otp: passwordData.otp
                })

                setShowPasswordModal(false);
                toast.success("Password changed successfully");
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
                await tutorAPI.post('/api/tutors/change-email/send-otp', {
                    newEmail: emailData.newEmail
                });
            } else if (emailData.action === 'verifyOtp') {
                const response = await tutorAPI.post('/api/tutors/change-email/verify', {
                    otp: emailData.otp,
                    newEmail: emailData.newEmail
                });
                
                // Update tutor info with new email
                const updatedTutorInfo = {
                    ...tutorInfo,
                    email: emailData.newEmail
                };
                setTutorInfo(updatedTutorInfo);
                localStorage.setItem('tutorInfo', JSON.stringify(updatedTutorInfo));
                
                // Update form data as well
                setFormData(prev => ({
                    ...prev,
                    email: emailData.newEmail
                }));
                
                // Dispatch custom event to notify header of update
                window.dispatchEvent(new CustomEvent('tutorInfoUpdated'));
                
                setShowEmailChangeModal(false);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to change email';
            toast.error(errorMessage);
            throw error; // Re-throw to let modal handle it
        } finally {
            setIsChangingEmail(false);
        }
    };

    // Show loading state
    if (loading) {
        return (
            <TutorLayout>
                <div className="rounded-2xl shadow-md px-8 py-6 bg-white border-4 border-[#b8eec4]/30 flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading profile...</p>
                    </div>
                </div>
            </TutorLayout>
        );
    }

    return (
        <TutorLayout>
            <div className="rounded-2xl shadow-md px-8 py-6 bg-white border-4 border-[#b8eec4]/30">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-sky-600">Profile Settings</h2>
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

                {/* Profile Image Section */}
                <div className="flex justify-center mb-8">
                    <div className="relative">
                        <img
                            src={selectedImage || tutorInfo?.profileImage || "https://randomuser.me/api/portraits/men/75.jpg"}
                            alt="Profile"
                            className="w-24 h-24 rounded-full object-cover shadow-lg"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage}
                            className="absolute -bottom-1 -right-1 bg-sky-500 text-white p-2 rounded-full hover:bg-sky-600 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploadingImage ? (
                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Camera className="w-3 h-3" />
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
                </div>

                {/* Form Fields */}
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
                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 ${isEditing ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50'
                                    }`}
                                placeholder="Enter your name"
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
                                className="px-4 py-3 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 transition-colors font-medium"
                            >
                                Change Email
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Email changes require verification for security
                        </p>
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

                    {/* Subjects Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subjects Teaching
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.subjects}
                                onChange={(e) => handleInputChange('subjects', e.target.value)}
                                disabled={!isEditing}
                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 ${isEditing ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50'
                                    }`}
                                placeholder="e.g., Mathematics, Physics, Chemistry"
                            />
                            {isEditing && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <div className="w-6 h-6 bg-sky-100 rounded-full flex items-center justify-center">
                                        <GraduationCap className="w-3 h-3 text-sky-600" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Separate multiple subjects with commas</p>
                    </div>

                    {/* Bio Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bio
                        </label>
                        <div className="relative">
                            <textarea
                                value={formData.bio}
                                onChange={(e) => handleInputChange('bio', e.target.value)}
                                disabled={!isEditing}
                                rows={4}
                                maxLength={500}
                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none ${isEditing ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50'
                                    }`}
                                placeholder="Tell students about yourself, your teaching experience, and approach..."
                            />
                            {isEditing && (
                                <div className="absolute right-3 top-3">
                                    <div className="w-6 h-6 bg-sky-100 rounded-full flex items-center justify-center">
                                        <FileText className="w-3 h-3 text-sky-600" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between mt-1">
                            <p className="text-sm text-gray-500">Maximum 500 characters</p>
                            <p className="text-sm text-gray-500">{formData.bio.length}/500</p>
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

            {/* Change Password Modal */}
            <ChangePasswordModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                onSubmit={handlePasswordChange}
                isLoading={isChangingPassword}
            />

            {/* Change Email Modal */}
            <EmailChangeModal
                isOpen={showEmailChangeModal}
                onClose={() => setShowEmailChangeModal(false)}
                onSubmit={handleEmailChange}
                isLoading={isChangingEmail}
                currentEmail={tutorInfo?.email || ''}
            />
        </TutorLayout>
    );
};

export default TutorProfile;