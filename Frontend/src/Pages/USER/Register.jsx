import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import Banner from "../../assets/Register.jpg";
import DotDotDotSpinner from "../../ui/Spinner/DotSpinner";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Create clean API instance for registration without interceptors
const registrationAPI = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

import { useCurrentUser } from "../../hooks/useCurrentUser";
import OtpModal from "../../ui/OTP";
import { GoogleLogin } from "@react-oauth/google";
export default function Register() {
  const navigate = useNavigate();
  const { login } = useCurrentUser();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  useEffect(() => {
    const savedFormData = localStorage.getItem("registerFormData");
    if (savedFormData) {
      setFormData(JSON.parse(savedFormData));
    }
  }, []);
  useEffect(() => {
    if (Object.values(formData).some((value) => value !== "")) {
      localStorage.setItem("registerFormData", JSON.stringify(formData));
    }
  }, [formData]);
  const [errors, setErrors] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const validationRules = {
    full_name: {
      required: true,
      minLength: 3,
      maxLength: 50,
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    phone: {
      required: true,
      pattern: /^\d{10}$/,
    },
    password: {
      required: true,
      minLength: 8,
      pattern:
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    },
  };
  const validateField = (name, value) => {
    let error = "";
    const rules = validationRules[name];
    if (rules) {
      if (rules.required && !value) {
        error = `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
      } else if (rules.pattern && !rules.pattern.test(value)) {
        switch (name) {
          case "full_name":
            error = "Full name can only contain letters and spaces";
            break;
          case "email":
            error = "Please enter a valid email address";
            break;
          case "phone":
            error = "Please enter a valid 10-digit phone number";
            break;
          case "password":
            error =
              "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character";
            break;
          default:
            error = "Invalid format";
        }
      } else if (rules.minLength && value.length < rules.minLength) {
        error = `Minimum ${rules.minLength} characters required`;
      } else if (rules.maxLength && value.length > rules.maxLength) {
        error = `Maximum ${rules.maxLength} characters allowed`;
      }
    }
    if (name === "confirmPassword" && value !== formData.password) {
      error = "Passwords do not match";
    }
    return error;
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      newErrors[key] = validateField(key, formData[key]);
    });
    if (Object.values(newErrors).some((err) => err)) {
      setErrors(newErrors);
      return;
    }
    setIsSubmitting(true);
    try {
      const { ...registerData } = formData;
      const response = await registrationAPI.post("/api/users", registerData);
      toast.success(response.data.message);
      setIsOtpModalOpen(true);
    } catch (err) {
      if (!err?.response) {
        toast.error("No Server Response");
      } else if (err.response?.status === 400) {
        toast.error(err.response.data.message || "Registration failed.");
      } else {
        toast.error("Registration Failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleVerifyOtp = async (otp) => {
    setIsSubmitting(true);
    try {
      const response = await registrationAPI.post(`/api/users/verify-otp`, {
        email: formData.email,
        otp,
      });
      toast.success(response.data.message);
      const userData = {
        _id: response.data._id,
        name: response.data.name,
        email: response.data.email
      };
      login(userData, response.data.accessToken);
      localStorage.removeItem("registerFormData");
      setIsOtpModalOpen(false);
      navigate("/user/home");
    } catch (error) {
      toast.error(error.response?.data?.message || "OTP verification failed.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsSubmitting(true);
      const response = await registrationAPI.post("/api/users/google-auth", {
        credential: credentialResponse.credential
      });
      const { accessToken, user } = response.data;
      login(user, accessToken);
      localStorage.removeItem("registerFormData");
      toast.success(response.data.message || "Google registration successful!");
      navigate("/user/home");
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
    <div className="min-h-screen flex relative">
      <div className="hidden lg:flex lg:w-1/2 bg-gray-100 relative">
        <img
          src={Banner}
          alt="Student learning online"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="w-full lg:w-1/2 ml-auto flex flex-col p-8 lg:p-12">
        <div className="flex flex-col lg:flex-row lg:justify-center items-center gap-2 mb-8">
          <div className="flex gap-2 p-1 bg-sky-100 rounded-full">
            <button
              className="px-6 py-2 text-sky-600 rounded-full hover:bg-sky-200 transition-colors duration-300"
              onClick={() => navigate('/user/login')}
            >
              Login
            </button>
            <button className="px-6 py-2 bg-sky-500 text-white rounded-full transition-colors duration-300">
              Register
            </button>
          </div>
        </div>
        <div className="absolute top-4 right-6">
          <h1 className="text-2xl font-bold text-sky-500">Scholaro</h1>
        </div>
        <div className="max-w-md w-full mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">
              Welcome to <span className="text-sky-500">Scholaro...!</span>
            </h2>
            <p className="text-gray-600">
              Education is the passport to the future, for tomorrow belongs to
              those who prepare for it today.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="full_name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-lg border ${errors.full_name ? "border-red-500" : "border-gray-200"
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
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-lg border ${errors.email ? "border-red-500" : "border-gray-200"
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
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone Number
              </label>
              <input 
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-lg border ${errors.phone ? "border-red-500" : "border-gray-200"
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
                className="block text-sm font-medium text-gray-700 mb-1"
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
                  className={`w-full px-4 py-3 rounded-lg border ${errors.password ? "border-red-500" : "border-gray-200"
                    } focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300 hover:border-sky-300`}
                  placeholder="Enter your password"
                  disabled={isSubmitting}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
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
                className="block text-sm font-medium text-gray-700 mb-1"
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
                  className={`w-full px-4 py-3 rounded-lg border ${errors.confirmPassword
                    ? "border-red-500"
                    : "border-gray-200"
                    } focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300 hover:border-sky-300`}
                  placeholder="Confirm your password"
                  disabled={isSubmitting}
                />
                <span
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </span>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
            <p className="text-center text-sm text-gray-600">
              Already have Account{" "}
              <a href="/user/login" className="text-sky-500 hover:underline">
                Sign In !
              </a>
            </p>
            <div>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-sky-500 text-white rounded-lg font-semibold text-lg disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? <DotDotDotSpinner /> : "Register"}
              </button>
            </div>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or register with</span>
              </div>
            </div>
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
        <OtpModal
          isOpen={isOtpModalOpen}
          onClose={() => setIsOtpModalOpen(false)}
          onVerify={handleVerifyOtp}
          email={formData.email}
          userType="user"
        />
      </div>
    </div>
  );
}
