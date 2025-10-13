import { useState, useEffect } from 'react';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import LoginBanner from "../../assets/Login.svg";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast, Toaster } from "sonner";
import DotDotDotSpinner from "../../ui/Spinner/DotSpinner.jsx";
import { axiosPublic } from '../../api/axios.js';
import { useAuth } from '../../Context/AuthContext.jsx';
import { GoogleLogin } from "@react-oauth/google";
import {
  clearTutorData,
  clearAdminData,
  redirectAfterLogin,
} from "../../helpers/auth";
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuth();
  const from = location.state?.from?.pathname || "/user/home";

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) navigate("/user/home", { replace: true });
  }, [navigate]);



  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (inputEmail) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!inputEmail) {
      setEmailError("Email is required");
    } else if (!emailRegex.test(inputEmail)) {
      setEmailError("Invalid email format");
    } else {
      setEmailError("");
    }
  };

  const validatePassword = (inputPassword) => {
    if (!inputPassword) {
      setPasswordError("Password is required");
    } else if (inputPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
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

    if(emailError || passwordError || !email || !password){
      return;
    }
    setIsSubmitting(true);

    try{
      const response = await axiosPublic.post('/api/users/login',{email,password});

      const {accessToken, ...user} = response.data;

      clearTutorData();
      clearAdminData();

      setAuth({user,accessToken});
      
      localStorage.setItem("authToken", accessToken);
      localStorage.setItem("userInfo", JSON.stringify(user));

      setEmail("");
      setPassword("");

      toast.success("Login successful! Welcome back.");
      
      redirectAfterLogin(navigate, 'user', from);
    } catch (err) {
      if (!err?.response) {
        toast.error("No Server Response");
      } else if (err.response.status === 403 && err.response.data.blocked) {
        // Handle blocked user specifically
        toast.error(err.response.data.message || "Your account has been blocked");
        // Don't proceed with login, stay on login page
        return;
      } else {
        toast.error(err.response.data.message || "Login Failed");
      }
    } finally {
      setIsSubmitting(false);
    }

    }


    const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsSubmitting(true);
      const response = await axiosPublic.post("/api/users/google-auth", {
        credential: credentialResponse.credential
      });

      const { accessToken, ...user } = response.data;

      clearTutorData();
      clearAdminData();

      setAuth({ user, accessToken });

      localStorage.setItem("authToken", accessToken);
      localStorage.setItem("userInfo", JSON.stringify(user));

      toast.success(response.data.message || "Google login successful!");
      
      redirectAfterLogin(navigate, 'user', from);
    } catch (err) {
      if (err.response?.status === 403 && err.response.data.blocked) {
        // Handle blocked user specifically
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
      <div className="hidden lg:flex lg:w-1/2 bg-gray-100 relative">
        <img
          src={LoginBanner}
          alt="Student learning online"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-12 relative">
        <div className="absolute top-4 right-4 hidden lg:block">
          <h1 className="text-2xl font-bold text-sky-500">Scholaro</h1>
        </div>
        <div className="flex justify-between items-center mb-8 lg:hidden">
          <h1 className="text-2xl font-bold text-sky-500">Scholaro</h1>
        </div>

        <div className="flex flex-col lg:flex-row lg:justify-center items-center gap-2 mb-8">
          <div className="flex gap-2 p-1 bg-sky-100 rounded-full">
            <button className="px-6 py-2 bg-sky-500 text-white rounded-full transition-colors duration-300">
              Login
            </button>
            <button
              className="px-6 py-2 text-sky-600 rounded-full hover:bg-sky-200 transition-colors duration-300"
              onClick={() =>navigate('/user/register') }
            >
              Register
            </button>
          </div>
        </div>

        <div className="max-w-md w-full mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">Welcome to Scholaro...!</h2>
            <p className="text-gray-600">Scholaro makes you perfect</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                User name
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleEmailChange}
                className={`w-full px-4 py-3 rounded-lg border ${
                  emailError
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-200 focus:ring-sky-500"
                } focus:outline-none focus:ring-2 focus:border-sky-500 transition-all duration-300`}
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

            <div className="relative">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={password}
                onChange={handlePasswordChange}
                className={`w-full px-4 py-3 rounded-lg border ${
                  passwordError
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-200 focus:ring-sky-500"
                } focus:outline-none focus:ring-2 focus:border-sky-500 transition-all duration-300`}
                placeholder="Enter your Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition-colors duration-300"
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

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 border-gray-300 rounded text-sky-500 focus:ring-sky-500"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <Link to="/user/forgot-password" className="text-sm text-gray-600 hover:text-sky-500">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full bg-sky-500 text-white py-3 rounded-lg hover:bg-sky-600 transition-colors duration-300 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? <DotDotDotSpinner /> : "Login"}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Sign up with</span>
              </div>
            </div>

            <div className="mt-6">
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

            <p className="text-center text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                to="/user/register"
                className="text-sky-500 hover:underline"
              >
                Sign up free!
              </Link>
            </p>
          </form>
        </div>
        <Toaster />
      </div>
    </div>
  );
}