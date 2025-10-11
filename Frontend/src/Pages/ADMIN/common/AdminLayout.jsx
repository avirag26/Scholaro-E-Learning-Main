import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Users, BookOpen, GraduationCap, DollarSign, TrendingUp, LogOut, User } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLayout({ children, title, subtitle }) {
    const navigate = useNavigate();
    const [adminInfo, setAdminInfo] = useState(null);

    useEffect(() => {
        const storedAdminInfo = localStorage.getItem('adminInfo');
        if (storedAdminInfo) {
            try {
                setAdminInfo(JSON.parse(storedAdminInfo));
            } catch (error) {
                console.error('Failed to parse adminInfo from localStorage', error);
            }
        }
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
                            <div className="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-medium text-lg">
                                    {adminInfo?.name?.charAt(0) || 'A'}
                                </span>
                            </div>
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
                                className="w-full text-left px-4 py-3 bg-sky-500 text-white rounded-lg font-medium"
                            >
                                Dashboard
                            </button>
                            <button 
                                onClick={() => navigate('/admin/profile')}
                                className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center"
                            >
                                <User className="w-5 h-5 mr-3" />
                                Profile
                            </button>
                            <button className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                Category
                            </button>
                            <button 
                                onClick={() => navigate('/admin/students')}
                                className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center"
                            >
                                <Users className="w-5 h-5 mr-3" />
                                Students
                            </button>
                            <button 
                                onClick={() => navigate('/admin/tutors')}
                                className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center"
                            >
                                <GraduationCap className="w-5 h-5 mr-3" />
                                Tutors
                            </button>
                            <button className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                Orders
                            </button>
                            <button className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                Coupon
                            </button>
                            <button className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                Courses
                            </button>
                            <button className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                Legal
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center space-x-2"
                            >
                                <LogOut className="w-5 h-5" />
                                <span>Logout</span>
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
                </main>
            </div>
        </div>
    );
}