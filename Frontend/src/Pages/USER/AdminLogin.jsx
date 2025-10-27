import { useState, useEffect } from "react";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { adminAPI } from "../../api/axiosConfig";
import { toast } from "react-toastify";
import DotDotDotSpinner from "../../ui/Spinner/DotSpinner";
import { clearUserData, clearTutorData, redirectAfterLogin } from "../../utils/authUtils";
import { useCurrentAdmin } from "../../hooks/useCurrentAdmin";
export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useCurrentAdmin();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { isAuthenticated } = useCurrentAdmin();
  
  useEffect(() => {
    if (isAuthenticated) navigate("/admin/dashboard", { replace: true });
  }, [navigate, isAuthenticated]);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const validateEmail = (inputEmail) => {
    if (!inputEmail) {
      setEmailError("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputEmail)) {
      setEmailError("Invalid email format");
    } else {
      setEmailError("");
    }
  };
  const validatePassword = (inputPassword) => {
    if (!inputPassword) {
      setPasswordError("Password is required");
    } else {
      setPasswordError("");
    }
  };
  const handleEmailChange = (e) => {
    const inputEmail = e.target.value;
    setEmail(inputEmail);
    validateEmail(inputEmail);
  };
  const handlePasswordChange = (e) => {
    const inputPassword = e.target.value;
    setPassword(inputPassword);
    validatePassword(inputPassword);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    validateEmail(email);
    validatePassword(password);
    if (emailError || passwordError || !email || !password) return;
    setIsSubmitting(true);
    try {
      const response = await adminAPI.post("/api/admin/login", { email, password });
      clearUserData();
      clearTutorData();
      login(response.data.admin, response.data.accessToken);
      toast.success("Admin login successful! Welcome back.");
      redirectAfterLogin(navigate, 'admin');
    } catch (err) {
      if (err.response?.status === 403 && err.response.data.blocked) {
        toast.error(err.response.data.message || "Your account has been blocked");
        return;
      }
      toast.error(err.response?.data?.message || "Login Failed");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen flex">
      {}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-100 relative">
        <img
          src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2026&q=80"
          alt="Admin workspace with clipboard and pen"
          className="w-full h-full object-cover"
        />
      </div>
      {}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 lg:p-12 bg-white">
        {}
        <div className="absolute top-4 right-4 hidden lg:block">
          <h1 className="text-2xl font-bold text-sky-500">Scholaro</h1>
        </div>
        <div className="flex justify-between items-center mb-8 lg:hidden">
          <h1 className="text-2xl font-bold text-sky-500">Scholaro</h1>
        </div>
        {}
        <div className="max-w-md w-full mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-2 text-gray-800">Welcome to lorem..!</h2>
            <p className="text-gray-600">Lorem Ipsum is simply dummy text of the printing and typesetting industry.</p>
          </div>
          {}
          <div className="flex justify-center mb-8">
            <button className="px-8 py-3 bg-sky-500 text-white rounded-full font-medium">
              Login
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                User name
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleEmailChange}
                className={`w-full px-4 py-3 rounded-full border-2 ${emailError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-sky-200 focus:ring-sky-500 focus:border-sky-500"
                  } focus:outline-none focus:ring-2 transition-all duration-300`}
                placeholder="Enter your User name"
                required
              />
              {emailError && (
                <div className="flex items-center text-red-500 text-sm mt-1">
                  <AlertTriangle size={16} className="mr-2" />
                  {emailError}
                </div>
              )}
            </div>
            {}
            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={password}
                onChange={handlePasswordChange}
                className={`w-full px-4 py-3 rounded-full border-2 ${passwordError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-sky-200 focus:ring-sky-500 focus:border-sky-500"
                  } focus:outline-none focus:ring-2 transition-all duration-300`}
                placeholder="Enter your Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-11 text-gray-400 hover:text-gray-600 transition-colors duration-300"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {passwordError && (
                <div className="flex items-center text-red-500 text-sm mt-1">
                  <AlertTriangle size={16} className="mr-2" />
                  {passwordError}
                </div>
              )}
            </div>
            {}
            <div className="flex justify-end">
            </div>
            {}
            <button
              type="submit"
              className="w-full bg-sky-500 text-white py-3 rounded-full hover:bg-sky-600 transition-colors duration-300 disabled:opacity-50 font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? <DotDotDotSpinner /> : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
