import { useState } from "react";
import { X, Eye, EyeOff, Key } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import OtpModal from "./OTP";

const ChangePasswordModal = ({ isOpen, onClose, onSubmit, isLoading = false }) => {
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        new: false,
        confirm: false
    });
    const [errors, setErrors] = useState({});
    const [userEmail, setUserEmail] = useState('');

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const validatePasswordForm = () => {
        const newErrors = {};


        if (!formData.newPassword) {
            newErrors.newPassword = 'New password is required';
        } else if (formData.newPassword.length < 8) {
            newErrors.newPassword = 'Password must be at least 8 characters';
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(formData.newPassword)) {
            newErrors.newPassword = 'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character';
        } else if (/\s/.test(formData.newPassword)) {
            newErrors.newPassword = 'Password cannot contain spaces';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (validatePasswordForm()) {

            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            setUserEmail(userInfo.email);
            

            await onSubmit({ action: 'sendOtp', password: formData.newPassword });
            setShowOtpModal(true);
        }
    };

    const handleOtpVerify = async (otp) => {

        await onSubmit({ 
            action: 'changePassword', 
            password: formData.newPassword, 
            otp: otp 
        });
        setShowOtpModal(false);
    };

    const handleOtpModalClose = () => {
        setShowOtpModal(false);
    };

    const handleClose = () => {
        setFormData({
            newPassword: '',
            confirmPassword: ''
        });
        setErrors({});
        setShowPasswords({
            new: false,
            confirm: false
        });
        setShowOtpModal(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >

                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                                <Key className="w-5 h-5 text-sky-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
                                <p className="text-sm text-gray-500">Enter your new password</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handlePasswordSubmit} className="space-y-4">

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords.new ? "text" : "password"}
                                    value={formData.newPassword}
                                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors ${errors.newPassword ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('new')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.newPassword && (
                                <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
                            )}
                        </div>


                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords.confirm ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    placeholder="Confirm new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('confirm')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                            )}
                        </div>




                        <div className="flex gap-3 pt-6">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 bg-sky-600 text-white py-3 rounded-lg hover:bg-sky-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Sending OTP...
                                    </>
                                ) : (
                                    'Send OTP'
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isLoading}
                                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>


            <OtpModal
                isOpen={showOtpModal}
                onClose={handleOtpModalClose}
                onVerify={handleOtpVerify}
                email={userEmail}
                userType="password-change"
            />
        </AnimatePresence>
    );
};

export default ChangePasswordModal;