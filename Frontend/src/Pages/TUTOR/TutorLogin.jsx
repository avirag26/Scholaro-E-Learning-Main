import { useState } from "react";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";
import LoginBanner from "../../assets/Login.svg";
import { Link, useNavigate } from "react-router-dom";
import { tutorAPI } from "../../api/axiosConfig";
import { toast } from "react-toastify";
import DotDotDotSpinner from "../../ui/Spinner/DotSpinner";
import { GoogleLogin } from "@react-oauth/google";
import { clearUserData, clearAdminData, redirectAfterLogin } from "../../helpers/auth";

export default function TutorLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const response = await tutorAPI.post("/api/tutors/login", { email, password });

      clearUserData();
      clearAdminData();

      localStorage.setItem("tutorAuthToken", response.data.accessToken);
      localStorage.setItem("tutorInfo", JSON.stringify(response.data.tutor));
      toast.success("Login successful! Welcome back.");

      redirectAfterLogin(navigate, 'tutor');
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.blocked) {

        toast.error(err.response.data.message || "Your account has been blocked");

        localStorage.removeItem('tutorAuthToken');
        localStorage.removeItem('tutorInfo');

        setEmail("");
        setPassword("");
        return;
      }
      toast.error(err.response?.data?.message || "Login Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsSubmitting(true);
      const response = await tutorAPI.post("/api/tutors/google-auth", {
        credential: credentialResponse.credential
      });

      clearUserData();
      clearAdminData();

      localStorage.setItem("tutorAuthToken", response.data.accessToken);
      localStorage.setItem("tutorInfo", JSON.stringify(response.data.tutor));

      toast.success(response.data.message || "Google login successful!");
      redirectAfterLogin(navigate, 'tutor');
    } catch (err) {
      if (err.response?.status === 403 && err.response.data.blocked) {

        toast.error(err.response.data.message || "Your account has been blocked");
        return;
      }
      toast.error(err.response?.data?.message || "Google login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    toast.error("Google login failed. Please try again.");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-sky-100 relative">
        <img
          src={LoginBanner}
          alt="Student learning online"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right Section */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-12 relative">

        {/* Scholaro Logo */}
        <div className="absolute top-4 right-4 hidden lg:block">
          <h1 className="text-2xl font-bold text-sky-600">Scholaro</h1>
        </div>
        <div className="flex justify-between items-center mb-8 lg:hidden">
          <h1 className="text-2xl font-bold text-sky-600">Scholaro</h1>
        </div>

        {/* Buttons Section */}
        <div className="flex flex-col lg:flex-row lg:justify-center items-center gap-2 mb-8">
          <div className="flex gap-2 p-1 bg-sky-200 rounded-full">
            <button className="px-6 py-2 bg-sky-600 text-white rounded-full transition-colors duration-300">
              Login
            </button>
            <button className="px-6 py-2 text-sky-700 rounded-full hover:bg-sky-300 transition-colors duration-300"
              onClick={() => navigate('/tutor/register')}>
              Register
            </button>
          </div>
        </div>

        {/* Form Section */}
        <div className="max-w-md w-full mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">Welcome to Scholaro...!</h2>
            <p className="text-sky-700">Scholaro makes you perfect</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Username Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-sky-700 mb-1"
              >
                User name
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleEmailChange}
                className={`w-full px-4 py-3 rounded-lg border ${emailError ? "border-red-500" : "border-sky-300"
                  } focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300`}
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

            {/* Password Input with Toggle */}
            <div className="relative">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-sky-700 mb-1"
              >
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={password}
                onChange={handlePasswordChange}
                className={`w-full px-4 py-3 rounded-lg border ${passwordError ? "border-red-500" : "border-sky-300"
                  } focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300`}
                placeholder="Enter your Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-sky-400 hover:text-sky-600 transition-colors duration-300"
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

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 border-sky-300 rounded text-sky-500 focus:ring-sky-500"
                />
                <span className="text-sm text-sky-700">Remember me</span>
              </label>
              <Link to="/tutor/forgot-password" className="text-sm text-sky-700 hover:text-sky-500">
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-sky-600 text-white py-3 rounded-lg hover:bg-sky-700 transition-colors duration-300 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? <DotDotDotSpinner /> : "Login"}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-sky-300"></div>
              </div>
              <div className="relative flex justify-center text-sm text-sky-500 bg-white px-2">
                Sign up with
              </div>
            </div>

            {/* Google Login Button */}
            <div className="mt-6 flex justify-center">
              <div className="w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="outline"
                  size="large"
                  width="100%"
                  text="signin_with"
                  shape="rectangular"
                />
              </div>
            </div>

            {/* Sign Up Link */}
            <p className="text-center text-sm text-sky-700">
              Don&apos;t have an account?{" "}
              <Link to="/tutor/register" className="text-sky-600 hover:underline">
                Sign up free!
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
