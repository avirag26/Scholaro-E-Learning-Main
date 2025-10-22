import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Search, Users, BookOpen, GraduationCap, DollarSign, TrendingUp, LogOut, User } from 'lucide-react';
import { toast } from 'sonner';


export default function AdminLayout({ children, title, subtitle }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [adminInfo, setAdminInfo] = useState(null);

    // Function to check if a route is active
    const isActiveRoute = (path) => {
        return location.pathname === path;
    };

    // Function to get button classes based on active state
    const getButtonClasses = (path) => {
        const baseClasses = "w-full text-left px-4 py-2 rounded-lg flex items-center font-medium transition-colors";
        if (isActiveRoute(path)) {
            return `${baseClasses} bg-sky-500 text-white`;
        }
        return `${baseClasses} text-gray-600 hover:bg-gray-100`;
    };

    useEffect(() => {
        const loadAdminInfo = () => {
            const storedAdminInfo = localStorage.getItem('adminInfo');
            if (storedAdminInfo) {
                try {
                    setAdminInfo(JSON.parse(storedAdminInfo));
                } catch (error) {
                    // Handle parsing error silently
                }
            }
        };

        // Load initial data
        loadAdminInfo();

        // Listen for localStorage changes
        const handleStorageChange = (e) => {
            if (e.key === 'adminInfo') {
                loadAdminInfo();
            }
        };

        // Listen for custom events (for same-tab updates)
        const handleAdminInfoUpdate = () => {
            loadAdminInfo();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('adminInfoUpdated', handleAdminInfoUpdate);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('adminInfoUpdated', handleAdminInfoUpdate);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('adminAuthToken');
        localStorage.removeItem('adminInfo');
        toast.success('Logged out successfully');
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="flex items-center justify-between px-6 py-4">
                    {/* Left side */}
                    <div className="flex items-center space-x-8">
                        <h1 className="text-2xl font-bold text-sky-500">Scholaro</h1>
                        <nav className="hidden md:flex space-x-6">
                            <a href="#" className="text-gray-600 hover:text-sky-500">Categories</a>
                        </nav>
                    </div>

                    {/* Center - Search */}
                    <div className="flex-1 max-w-md mx-8">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search course"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                            />
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center space-x-4">
                        <button className="p-2 text-gray-600 hover:text-sky-500">
                            <Bell className="w-5 h-5" />
                        </button>
                        <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                                {adminInfo?.name?.charAt(0) || 'A'}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 bg-white shadow-sm min-h-screen">
                    {/* Profile Section */}
                    <div className="p-6 border-b">
                        <div className="flex items-center space-x-3">
                            {adminInfo?.profileImage ? (
                                <img
                                    src={adminInfo.profileImage}
                                    alt="Admin Profile"
                                    className="w-12 h-12 rounded-full object-cover border-2 border-sky-200"
                                />
                            ) : (
                                <div className="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-medium text-lg">
                                        {adminInfo?.name?.charAt(0) || 'A'}
                                    </span>
                                </div>
                            )}
                            <div>
                                <h3 className="font-semibold text-gray-900">
                                    {adminInfo?.name || 'Admin'}
                                </h3>
                                <button
                                    onClick={() => navigate('/admin/profile')}
                                    className="text-sky-500 text-sm hover:underline"
                                >
                                    View Profile
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="p-4">
                        <div className="space-y-2">
                            <button
                                onClick={() => navigate('/admin/dashboard')}
                                className={getButtonClasses('/admin/dashboard')}
                            >
                                <TrendingUp className="w-5 h-5 mr-3" />
                                Dashboard
                            </button>
                            <button
                                onClick={() => navigate('/admin/profile')}
                                className={getButtonClasses('/admin/profile')}
                            >
                                <User className="w-5 h-5 mr-3" />
                                Profile
                            </button>
                            <button
                                onClick={() => navigate('/admin/category')}
                                className={getButtonClasses('/admin/category')}
                            >
                                <BookOpen className="w-5 h-5 mr-3" />
                                Category
                            </button>
                            <button
                                onClick={() => navigate('/admin/students')}
                                className={getButtonClasses('/admin/students')}
                            >
                                <Users className="w-5 h-5 mr-3" />
                                Students
                            </button>
                            <button
                                onClick={() => navigate('/admin/tutors')}
                                className={getButtonClasses('/admin/tutors')}
                            >
                                <GraduationCap className="w-5 h-5 mr-3" />
                                Tutors
                            </button>
                            <button
                                onClick={() => navigate('/admin/orders')}
                                className={getButtonClasses('/admin/orders')}
                            >
                                <DollarSign className="w-5 h-5 mr-3" />
                                Orders
                            </button>
                            <button
                                onClick={() => navigate('/admin/coupon')}
                                className={getButtonClasses('/admin/coupon')}
                            >
                                <DollarSign className="w-5 h-5 mr-3" />
                                Coupon
                            </button>
                            <button
                                onClick={() => navigate('/admin/courses')}
                                className={getButtonClasses('/admin/courses')}
                            >
                                <BookOpen className="w-5 h-5 mr-3" />
                                Courses
                            </button>
                            <button
                                onClick={() => navigate('/admin/legal')}
                                className={getButtonClasses('/admin/legal')}
                            >
                                <BookOpen className="w-5 h-5 mr-3" />
                                Legal
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center font-medium transition-colors"
                            >
                                <LogOut className="w-5 h-5 mr-3" />
                                Logout
                            </button>
                        </div>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8">
                    {title && (
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                            {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
                        </div>
                    )}
                    {children}

                    {/* Footer */}
                
                </main>
            </div>
        </div>
    );
}