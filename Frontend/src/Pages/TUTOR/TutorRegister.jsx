import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import TutorBanner from "../../assets/TutorBanner.jpg";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Create clean API instance for registration without interceptors
const registrationAPI = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});
import OtpModal from "../../ui/OTP";
import DotDotDotSpinner from "../../ui/Spinner/DotSpinner";
import { GoogleLogin } from "@react-oauth/google";
import { useCurrentTutor } from "../../hooks/useCurrentTutor";
export default function TutorRegister() {
  const navigate = useNavigate();
  const { login } = useCurrentTutor();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const validateField = (name, value) => {
    let error = "";
    if (name === "full_name" && !value) error = "Full name is required.";
    if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      error = "Please enter a valid email.";
    if (name === "phone" && !/^\d{10}$/.test(value))
      error = "Please enter a valid 10-digit phone number.";
    if (
      name === "password" &&
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
        value
      )
    )
      error =
        "Password must be 8+ characters with uppercase, lowercase, number, and special character.";
    if (name === "confirmPassword" && value !== formData.password)
      error = "Passwords do not match.";
    return error;
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = Object.keys(formData).reduce((acc, key) => {
      const error = validateField(key, formData[key]);
      if (error) acc[key] = error;
      return acc;
    }, {});
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setIsSubmitting(true);
    try {
      const {  ...registerData } = formData;
      const response = await registrationAPI.post("/api/tutors/register", registerData);
      toast.success(response.data.message);
      setIsOtpModalOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleVerifyOtp = async (otp) => {
    setIsSubmitting(true);
    try {
      const response = await registrationAPI.post("/api/tutors/verify-otp", {
        email: formData.email,
        otp,
      });
      toast.success(response.data.message);
      const tutorData = { 
        name: response.data.name, 
        email: response.data.email,
        phone: response.data.phone,
        subjects: response.data.subjects,
        bio: response.data.bio,
        profileImage: response.data.profileImage
      };
      login(tutorData, response.data.accessToken);
      setIsOtpModalOpen(false);
      navigate("/tutor/home");
    } catch (error) {
      toast.error(error.response?.data?.message || "OTP verification failed.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsSubmitting(true);
      const response = await registrationAPI.post("/api/tutors/google-auth", {
        credential: credentialResponse.credential
      });
      login(response.data.tutor, response.data.accessToken);
      toast.success(response.data.message || "Google registration successful!");
      navigate("/tutor/home");
    } catch (err) {
      toast.error(err.response?.data?.message || "Google registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleGoogleError = () => {
    toast.error("Google registration failed. Please try again.");
  };
  return (
    <div className="min-h-screen flex relative bg-sky-50">
      {}
      <div className="hidden lg:flex lg:w-1/2 bg-sky-100 relative">
        <img
          src={TutorBanner}
          alt="Student learning online"
          className="w-full h-full object-cover"
        />
      </div>
      {}
      <div className="w-full lg:w-1/2 ml-auto flex flex-col p-8 lg:p-12">
        {}
        <div className="absolute top-4 right-6">
          <h1 className="text-2xl font-bold text-sky-600">Scholaro</h1>
        </div>
        <div className="max-w-md w-full mx-auto">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold mb-2">
              Welcome to <span className="text-sky-600">Scholaro...!</span>
            </h2>
            <p className="text-sky-700">
              Education is the passport to the future, for tomorrow belongs to
              those who prepare for it today.
            </p>
          </div>
        <div className="flex flex-col lg:flex-row lg:justify-center items-center gap-2 mb-8">
          <div className="flex gap-2 p-1 bg-sky-100 rounded-full">
            <button
              className="px-6 py-2 text-sky-600 rounded-full hover:bg-sky-200 transition-colors duration-300"
               onClick={()=>navigate('/tutor/login')}
            >
              Login
            </button>
             <button className="px-6 py-2 bg-sky-500 text-white rounded-full transition-colors duration-300">
              Register
            </button>
          </div>
        </div>
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label
                htmlFor="full_name"
                className="block text-sm font-medium text-sky-700 mb-1"
              >
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.full_name ? "border-red-500" : "border-sky-200"
                } focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300 hover:border-sky-300`}
                placeholder="Enter your full name"
                disabled={isSubmitting}
              />
              {errors.full_name && (
                <p className="mt-1 text-xs text-red-500">{errors.full_name}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-sky-700 mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.email ? "border-red-500" : "border-sky-200"
                } focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300 hover:border-sky-300`}
                placeholder="Enter your Email Address"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-sky-700 mb-1"
              >
                Phone Number
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.phone ? "border-red-500" : "border-sky-200"
                } focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300 hover:border-sky-300`}
                placeholder="Enter your phone number"
                disabled={isSubmitting}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-sky-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.password ? "border-red-500" : "border-sky-200"
                  } focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300 hover:border-sky-300`}
                  placeholder="Enter your password"
                  disabled={isSubmitting}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-sky-400"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </span>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-sky-700 mb-1"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.confirmPassword ? "border-red-500" : "border-sky-200"
                  } focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300 hover:border-sky-300`}
                  placeholder="Confirm your password"
                  disabled={isSubmitting}
                />
                <span
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-sky-400"
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </span>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="w-4 h-4 accent-sky-500"
                disabled={isSubmitting}
              />
              <span className="text-sm text-sky-600">
                I agree to the{" "}
                <a href="#" className="text-sky-500 underline">
                  Terms and Conditions
                </a>
              </span>
            </div>
            <p className="text-center text-sm text-sky-600">
              Already have an account?{" "}
              <button
                type="button" onClick={() => navigate('/tutor/login')}
                className="text-sky-500 hover:underline"
              >
                Sign In !
              </button>
            </p>
            <div>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-sky-500 text-white rounded-lg font-semibold text-lg hover:bg-sky-600 transition disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? <DotDotDotSpinner /> : "Register"}
              </button>
            </div>
            {}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-sky-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-sky-50 text-sky-600">Or register with</span>
              </div>
            </div>
            {}
            <div className="mt-6 flex justify-center">
              <div className="w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="outline"
                  size="large"
                  width="100%"
                  text="signup_with"
                  shape="rectangular"
                />
              </div>
            </div>
          </form>
        </div>
      </div>
      <OtpModal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        onVerify={handleVerifyOtp}
        email={formData.email}
        userType="tutor"
      />
    </div>
  );
}
