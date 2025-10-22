import { useState, useRef, useEffect } from "react";
import { X, Mail, Shield, CheckCircle, Clock } from "lucide-react";
import { toast } from "react-toastify";
import { publicAPI } from "../api/axiosConfig.js";
import { motion, AnimatePresence } from "framer-motion";

const OtpModal = ({ isOpen, onClose, onVerify, email, userType = 'user' }) => {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [timer, setTimer] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isOpen) {
      inputRefs.current[0]?.focus();
      const storedExpiryTime = localStorage.getItem(`otpExpiryTime_${email}`);

      if (storedExpiryTime) {
        const expiryTime = parseInt(storedExpiryTime);
        const currentTime = new Date().getTime();
        const remainingTime = Math.max(0, Math.floor((expiryTime - currentTime) / 1000));
        if (remainingTime > 0) setTimer(remainingTime);
        else {
          setTimer(0);
          localStorage.removeItem(`otpExpiryTime_${email}`);
        }
      } else {
        const newExpiryTime = new Date().getTime() + 60 * 1000;
        localStorage.setItem(`otpExpiryTime_${email}`, newExpiryTime.toString());
        setTimer(60);
      }
      setOtp(Array(6).fill(""));
    }
  }, [isOpen, email]);

  useEffect(() => {
    let interval;
    if (isOpen && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            localStorage.removeItem(`otpExpiryTime_${email}`);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, timer, email]);

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
    }
  };

  const handleResend = async () => {
    if (isResending || timer > 0) return;
    try {
      setIsResending(true);
      let response;
      
      if (userType === 'password-change') {
        const { userAPI } = await import('../api/axiosConfig.js');
        response = await userAPI.post('/api/users/change-password/send-otp');
      } else if (userType === 'email-change') {
        // For email change, we need to get the stored new email and resend OTP
        const storedNewEmail = localStorage.getItem('pendingEmailChange');
        if (storedNewEmail) {
          const { userAPI } = await import('../api/axiosConfig.js');
          response = await userAPI.post('/api/users/change-email/send-otp', {
            newEmail: storedNewEmail
          });
        } else {
          toast.error('Email change session expired. Please try again.');
          onClose();
          return;
        }
      } else {
        response = await publicAPI.post(`/api/${userType}s/resend-otp`, { email });
      }
      
      if (response.status === 200) {
        const newExpiryTime = new Date().getTime() + 60 * 1000;
        localStorage.setItem(`otpExpiryTime_${email}`, newExpiryTime.toString());
        setTimer(60);
        setOtp(Array(6).fill(""));
        toast.success("A new OTP has been sent to your email.");
        inputRefs.current[0]?.focus();
        setFocusedIndex(0);
      } else {
        toast.error(response.data.message || "Failed to resend OTP.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred.");
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error("Please enter a 6-digit OTP.");
      return;
    }
    
    setIsVerifying(true);
    try {
      await onVerify(otpString);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleModalClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 50
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: { 
        type: "spring",
        damping: 25,
        stiffness: 300,
        duration: 0.4
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      y: 50,
      transition: { duration: 0.2 }
    }
  };

  const inputVariants = {
    initial: { opacity: 0, y: 20, scale: 0.8 },
    animate: (index) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: index * 0.1,
        type: "spring",
        damping: 20,
        stiffness: 300
      }
    }),
    focus: {
      scale: 1.1,
      borderColor: "#0ea5e9",
      boxShadow: "0 0 0 4px rgba(14, 165, 233, 0.2)",
      transition: { duration: 0.2 }
    },
    filled: {
      scale: 1.05,
      backgroundColor: "#f0f9ff",
      borderColor: "#0ea5e9",
      transition: { duration: 0.2 }
    }
  };

  const iconVariants = {
    initial: { scale: 0, rotate: -180 },
    animate: { 
      scale: 1, 
      rotate: 0,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 300,
        delay: 0.2
      }
    }
  };

  const progressVariants = {
    initial: { width: "0%" },
    animate: { 
      width: `${((60 - timer) / 60) * 100}%`,
      transition: { duration: 0.5 }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleModalClose}
          />
          
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-sky-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-sky-100 to-sky-200 rounded-full -translate-y-16 translate-x-16 opacity-50" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-sky-50 to-sky-100 rounded-full translate-y-12 -translate-x-12 opacity-30" />
              
              <div className="relative flex justify-between items-start mb-6">
                <div className="flex items-center space-x-3">
                  <motion.div
                    variants={iconVariants}
                    initial="initial"
                    animate="animate"
                    className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center"
                  >
                    <Shield className="w-6 h-6 text-sky-600" />
                  </motion.div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Verify Email</h3>
                    <p className="text-sm text-gray-500">Security verification required</p>
                  </div>
                </div>
                <motion.button
                  onClick={handleModalClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-sky-50 rounded-2xl p-4 mb-6 border border-sky-100"
              >
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-sky-600" />
                  <div>
                    <p className="text-sm text-gray-600">OTP sent to</p>
                    <p className="font-semibold text-gray-900">{email}</p>
                  </div>
                </div>
              </motion.div>

              <div className="mb-6">
                <p className="text-center text-gray-600 mb-4">Enter the 6-digit code</p>
                <div className="flex justify-center gap-3">
                  {otp.map((digit, index) => (
                    <motion.input
                      key={index}
                      type="tel"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onFocus={() => setFocusedIndex(index)}
                      className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none transition-all duration-200 bg-white"
                      ref={(el) => (inputRefs.current[index] = el)}
                      autoComplete="one-time-code"
                      variants={inputVariants}
                      initial="initial"
                      animate="animate"
                      custom={index}
                      whileFocus="focus"
                      style={{
                        borderColor: digit ? "#0ea5e9" : focusedIndex === index ? "#0ea5e9" : "#e5e7eb",
                        backgroundColor: digit ? "#f0f9ff" : "#ffffff"
                      }}
                    />
                  ))}
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mb-6"
              >
                {timer > 0 ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Clock className="w-4 h-4 text-sky-600" />
                      <span className="text-sm text-gray-600">
                        Resend available in <span className="font-semibold text-sky-600">{timer}s</span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <motion.div
                        variants={progressVariants}
                        initial="initial"
                        animate="animate"
                        className="bg-sky-500 h-1 rounded-full"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <motion.button
                      onClick={handleResend}
                      disabled={isResending}
                      className="text-sky-600 font-semibold hover:text-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isResending ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                          <span>Resending...</span>
                        </div>
                      ) : (
                        "Resend OTP"
                      )}
                    </motion.button>
                  </div>
                )}
              </motion.div>

              <motion.button
                onClick={handleVerify}
                disabled={isVerifying || otp.join("").length !== 6}
                className="w-full py-4 rounded-2xl bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
                whileHover={{ scale: isVerifying ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                {isVerifying ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Verify OTP</span>
                  </>
                )}
              </motion.button>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center text-xs text-gray-500 mt-4"
              >
                Didn't receive the code? Check your spam folder or try resending.
              </motion.p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OtpModal;