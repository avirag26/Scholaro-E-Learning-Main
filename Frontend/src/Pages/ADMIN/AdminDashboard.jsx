import { useState, useEffect } from 'react';
import { ChevronDown, Download, FileText, Users, BookOpen, GraduationCap, DollarSign, TrendingUp } from 'lucide-react';
import Button from '../../ui/Button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import AdminLayout from './common/AdminLayout';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../api/axiosConfig';
const chartData = [
    { month: 'Jan', income: 45000, profit: 35000 },
    { month: 'Feb', income: 52000, profit: 38000 },
    { month: 'Mar', income: 48000, profit: 42000 },
    { month: 'Apr', income: 61000, profit: 45000 },
    { month: 'May', income: 77000, profit: 48000 },
    { month: 'Jun', income: 68000, profit: 52000 },
    { month: 'Jul', income: 72000, profit: 46000 },
    { month: 'Aug', income: 65000, profit: 49000 },
    { month: 'Sep', income: 78000, profit: 55000 },
    { month: 'Oct', income: 82000, profit: 51000 },
    { month: 'Nov', income: 75000, profit: 47000 },
    { month: 'Dec', income: 69000, profit: 43000 }
];
const courseData = [
    {
        name: 'Web Development',
        students: 120,
        enrolled: 80,
        drafts: 5,
        rating: 4.5,
        notice: '₹2000',
        status: 'Published'
    },
    {
        name: 'Data Science',
        students: 95,
        enrolled: 60,
        drafts: 2,
        rating: 4.2,
        notice: '₹1800',
        status: 'Published'
    },
    {
        name: 'Graphic Design',
        students: 70,
        enrolled: 0,
        drafts: 3,
        rating: 3.9,
        notice: '₹2500',
        status: 'Inactive'
    }
];
export default function AdminDashboard() {
    const navigate = useNavigate();
    const [dateFilter, setDateFilter] = useState('This Month');
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalTutors: 0,
        verifiedUsers: 0,
        verifiedTutors: 0,
        blockedUsers: 0,
        blockedTutors: 0
    });
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetchDashboardStats();
    }, []);
    const fetchDashboardStats = async () => {
        try {
            const response = await adminAPI.get('/api/admin/dashboard-stats');
            setStats(response.data);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };
    const handleDownloadPDF = () => {
    };
    const handleDownloadExcel = () => {
    };
    return (
        <AdminLayout title="Dashboard" subtitle="Welcome to your admin dashboard">
            {}
            <div className="space-y-6">
                {}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-xl font-semibold text-gray-800">Analytics Overview</h2>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setDateFilter('This Month')}
                                className={`px-3 py-1 rounded text-sm ${
                                    dateFilter === 'This Month' 
                                        ? 'bg-sky-500 text-white' 
                                        : 'bg-gray-100 text-gray-600'
                                }`}
                            >
                                This Month
                            </button>
                            <button
                                onClick={() => setDateFilter('Last Month')}
                                className={`px-3 py-1 rounded text-sm ${
                                    dateFilter === 'Last Month' 
                                        ? 'bg-sky-500 text-white' 
                                        : 'bg-gray-100 text-gray-600'
                                }`}
                            >
                                Last Month
                            </button>
                            <div className="relative">
                                <button className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200">
                                    <span>{dateFilter}</span>
                                    <ChevronDown className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                    {}
                    <div className="flex items-center space-x-3">
                        <Button 
                            onClick={handleDownloadPDF}
                            className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2"
                        >
                            <FileText className="w-4 h-4" />
                            <span>PDF</span>
                        </Button>
                        <Button 
                            onClick={handleDownloadExcel}
                            className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2"
                        >
                            <Download className="w-4 h-4" />
                            <span>Excel</span>
                        </Button>
                    </div>
                </div>
                {}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Total Students</p>
                                <p className="text-2xl font-bold text-gray-800">{loading ? '...' : stats.totalUsers}</p>
                            </div>
                            <Users className="w-8 h-8 text-sky-500" />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Total Tutors</p>
                                <p className="text-2xl font-bold text-gray-800">{loading ? '...' : stats.totalTutors}</p>
                            </div>
                            <GraduationCap className="w-8 h-8 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Total Courses</p>
                                <p className="text-2xl font-bold text-gray-800">551</p>
                            </div>
                            <BookOpen className="w-8 h-8 text-purple-500" />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-800">₹5,51,000</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-yellow-500" />
                        </div>
                    </div>
                </div>
                {}
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold">Revenue & Profit Overview</h3>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-sky-500 rounded-full"></div>
                                <span className="text-sm text-gray-600">Income</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-sm text-gray-600">Profit</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis 
                                    dataKey="month" 
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#666' }}
                                />
                                <YAxis 
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#666' }}
                                    tickFormatter={(value) => `?${value/1000}k`}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="income" 
                                    stroke="#0ea5e9" 
                                    strokeWidth={3}
                                    dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, stroke: '#0ea5e9', strokeWidth: 2 }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="profit" 
                                    stroke="#10b981" 
                                    strokeWidth={3}
                                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                {}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Course Management</h3>
                            <div className="flex items-center space-x-2">
                                <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200">
                                    Filter
                                </button>
                                <div className="relative">
                                    <button className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200">
                                        <span>{dateFilter}</span>
                                        <ChevronDown className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Course Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Students
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Enrolled
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Drafts
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Rating
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Notice
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {courseData.map((course, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {course.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {course.students}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {course.enrolled}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {course.drafts}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            ? {course.rating}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {course.notice}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                course.status === 'Published' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {course.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
