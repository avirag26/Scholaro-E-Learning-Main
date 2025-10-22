import { useState } from 'react';
import { X, Mail, Shield } from 'lucide-react';
import { toast } from 'react-toastify';
import OtpModal from './OTP.jsx';

const EmailChangeModal = ({ isOpen, onClose, onSubmit, isLoading, currentEmail }) => {
  const [newEmail, setNewEmail] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!newEmail) {
      toast.error('Please enter a new email address');
      return;
    }

    if (newEmail === currentEmail) {
      toast.error('New email must be different from current email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      await onSubmit({ action: 'sendOtp', newEmail });
      // Store the new email for OTP resend functionality
      localStorage.setItem('pendingEmailChange', newEmail);
      toast.success('OTP sent to your new email address');
      setShowOtpModal(true);
    } catch (error) {

    }
  };

  const handleVerifyOtp = async (otp) => {
    try {
      await onSubmit({ action: 'verifyOtp', otp, newEmail });
      // Clear the pending email change after successful verification
      localStorage.removeItem('pendingEmailChange');
      setShowOtpModal(false);
      handleClose();
      toast.success('Email changed successfully!');
    } catch (error) {
      throw error;
    }
  };

  const handleClose = () => {
    setNewEmail('');
    setShowOtpModal(false);
    onClose();
  };

  const handleOtpModalClose = () => {
    setShowOtpModal(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {!showOtpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={handleClose} />
      )}

      <div className="fixed inset-0 flex items-center justify-center z-40 p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto pointer-events-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Change Email Address
                </h3>
                <p className="text-sm text-gray-500">
                  Enter your new email
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Email
                </label>
                <input
                  type="email"
                  value={currentEmail}
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="Enter your new email address"
                  disabled={isLoading}
                />
              </div>

              <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-sky-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-sky-800">Security Notice</p>
                    <p className="text-sm text-sky-700 mt-1">
                      We'll send a verification code to your new email address to confirm the change.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50"
                  disabled={isLoading || !newEmail}
                >
                  {isLoading ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <OtpModal
        isOpen={showOtpModal}
        onClose={handleOtpModalClose}
        onVerify={handleVerifyOtp}
        email={newEmail}
        userType="email-change"
      />
    </>
  );
};

export default EmailChangeModal;