import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Search, Users, BookOpen, GraduationCap, DollarSign, TrendingUp, LogOut, User, Wallet } from 'lucide-react';

import { useLogout } from '../../../hooks/useLogout';
import Footer from '../../../components/Common/Footer';
import NotificationDropdown from '../../../components/Notifications/NotificationDropdown';
export default function AdminLayout({ children, title, subtitle }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useLogout('admin');
    const [adminInfo, setAdminInfo] = useState(null);
    const isActiveRoute = (path) => {
        return location.pathname === path;
    };
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
                    console.log(error)
                }
            }
        };
        loadAdminInfo();
        const handleStorageChange = (e) => {
            if (e.key === 'adminInfo') {
                loadAdminInfo();
            }
        };
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
    const handleLogout = async () => {
        await logout();
    };
    return (
        <div className="min-h-screen bg-gray-50">
            {}
            <header className="bg-white shadow-sm border-b">
                <div className="flex items-center justify-between px-6 py-4">
                    {}
                    <div className="flex items-center space-x-8">
                        <h1 className="text-2xl font-bold text-sky-500">Scholaro</h1>
                        
                    </div>
                    
                    
                    
                    <div className="flex items-center space-x-4">
                        <NotificationDropdown userType="admin" />
                        <img
                                    src={adminInfo?.profileImage}
                                    alt="Profile"
                                    className="h-8 w-8 rounded-full object-cover"
                                    onClick={() => navigate("/user/profile")}
                                  />
                    </div>
                </div>
            </header>
            <div className="flex">
                {}
                <aside className="w-64 bg-white shadow-sm min-h-screen">
                    {}
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
                    {}
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
                                onClick={() => navigate('/admin/categories')}
                                className={getButtonClasses('/admin/categories')}
                            >
                                <BookOpen className="w-5 h-5 mr-3" />
                                Categories
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
                                onClick={() => navigate('/admin/wallet')}
                                className={getButtonClasses('/admin/wallet')}
                            >
                                <Wallet className="w-5 h-5 mr-3" />
                                Wallet
                            </button>
                            
                            <button
                                onClick={() => navigate('/admin/courses')}
                                className={getButtonClasses('/admin/courses')}
                            >
                                <BookOpen className="w-5 h-5 mr-3" />
                                Courses
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
                {}
                <main className="flex-1 p-8">
                    {title && (
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                            {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
                        </div>
                    )}
                    {children}
                </main>
            </div>
            <Footer />
        </div>
    );
}
