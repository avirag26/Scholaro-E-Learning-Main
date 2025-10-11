import { useState, useEffect } from 'react';
import { Search, Ban, Trash2, UserCheck, GraduationCap, Eye, BookOpen } from 'lucide-react';
import { adminService } from '../../services/adminService.js';
import Swal from 'sweetalert2';
import AdminLayout from './common/AdminLayout';

export default function Tutors() {
    const [tutors, setTutors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const tutorsPerPage = 10;

    useEffect(() => {
        loadTutors();
    }, [currentPage, statusFilter]);

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm !== '') {
                setCurrentPage(1);
                loadTutors();
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const loadTutors = async () => {
        try {
            setLoading(true);
            const response = await adminService.getAllTutors({
                page: currentPage,
                limit: tutorsPerPage,
                search: searchTerm,
                status: statusFilter
            });

            setTutors(response.tutors || []);
            setTotalPages(response.totalPages || Math.ceil((response.total || 0) / tutorsPerPage));
        } catch (error) {
            console.error('Error loading tutors:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to load tutors'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleBlock = async (tutorId) => {
        try {
            const tutor = tutors.find(t => t._id === tutorId);
            console.log('Toggling block for tutor:', tutor); // Debug log
            
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: `This will ${tutor.is_blocked ? 'unblock' : 'block'} this tutor`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, proceed!'
            });

            if (result.isConfirmed) {
                // Show loading state
                Swal.fire({
                    title: 'Updating...',
                    text: 'Please wait while we update the tutor status',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                console.log('Making API call to toggle block for tutor ID:', tutorId); // Debug log
                const response = await adminService.toggleTutorBlock(tutorId);
                console.log('Toggle block response:', response); // Debug log
                
                // Update local state immediately for better UX
                setTutors(prevTutors => 
                    prevTutors.map(t => 
                        t._id === tutorId 
                            ? { ...t, is_blocked: response.tutor.is_blocked }
                            : t
                    )
                );
                
                Swal.fire('Success!', `Tutor ${response.tutor.is_blocked ? 'blocked' : 'unblocked'} successfully`, 'success');
                
                // Also refresh from server to ensure consistency
                setTimeout(() => {
                    loadTutors();
                }, 1000);
            }
        } catch (error) {
            console.error('Error in handleToggleBlock:', error); // Debug log
            Swal.fire('Error!', error.message || 'Failed to update tutor status', 'error');
        }
    };

    const handleDelete = async (tutorId) => {
        try {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: 'This will permanently delete this tutor and all their courses',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete!'
            });

            if (result.isConfirmed) {
                await adminService.deleteTutor(tutorId);
                Swal.fire('Deleted!', 'Tutor has been deleted.', 'success');
                loadTutors();
            }
        } catch (error) {
            Swal.fire('Error!', error.message || 'Failed to delete tutor', 'error');
        }
    };

    const handleSearch = () => {
        setCurrentPage(1);
        loadTutors();
    };

    // Use server-side filtering, so no need to filter again on frontend
    const filteredTutors = tutors;

    return (
        <AdminLayout title="Tutors Management" subtitle="Manage all registered tutors">
            {/* Search and Filters */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search tutors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="blocked">Blocked</option>
                        <option value="pending">Pending</option>
                    </select>
                    <button
                        onClick={handleSearch}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                        Search
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Total Tutors</p>
                            <p className="text-2xl font-bold text-gray-800">{tutors.length}</p>
                        </div>
                        <GraduationCap className="w-8 h-8 text-blue-500" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Active Tutors</p>
                            <p className="text-2xl font-bold text-green-600">
                                {tutors.filter(t => !t.is_blocked && t.is_verified).length}
                            </p>
                        </div>
                        <UserCheck className="w-8 h-8 text-green-500" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Blocked Tutors</p>
                            <p className="text-2xl font-bold text-red-600">
                                {tutors.filter(t => t.is_blocked).length}
                            </p>
                        </div>
                        <Ban className="w-8 h-8 text-red-500" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Total Courses</p>
                            <p className="text-2xl font-bold text-purple-600">
                                {tutors.reduce((sum, tutor) => sum + (tutor.courseCount || 0), 0)}
                            </p>
                        </div>
                        <BookOpen className="w-8 h-8 text-purple-500" />
                    </div>
                </div>
            </div>

            {/* Tutors Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading tutors...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tutor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Phone
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Courses
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Joined
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTutors.map((tutor) => (
                                    <tr key={tutor._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                                                        <span className="text-white font-medium">
                                                            {tutor.full_name?.charAt(0) || 'T'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {tutor.full_name || 'N/A'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        ID: {tutor._id?.slice(-6)}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {tutor.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {tutor.phone || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {tutor.courseCount || 0} courses
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                tutor.is_blocked 
                                                    ? 'bg-red-100 text-red-800' 
                                                    : tutor.is_verified 
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {tutor.is_blocked ? 'Blocked' : tutor.is_verified ? 'Active' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(tutor.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleToggleBlock(tutor._id)}
                                                    className={`p-2 rounded-lg ${
                                                        tutor.is_blocked 
                                                            ? 'text-green-600 hover:bg-green-50' 
                                                            : 'text-red-600 hover:bg-red-50'
                                                    }`}
                                                    title={tutor.is_blocked ? 'Unblock' : 'Block'}
                                                >
                                                    {tutor.is_blocked ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(tutor._id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {filteredTutors.length === 0 && (
                            <div className="text-center py-12">
                                <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No tutors found</h3>
                                <p className="text-gray-500">No tutors match your search criteria.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-white px-4 py-6 flex items-center justify-center border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                            {/* Previous Button */}
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 hover:bg-teal-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                            >
                                ←
                            </button>

                            {/* Page Numbers */}
                            {(() => {
                                const pages = [];
                                const maxVisiblePages = 5;
                                let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                                let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                                
                                if (endPage - startPage + 1 < maxVisiblePages) {
                                    startPage = Math.max(1, endPage - maxVisiblePages + 1);
                                }

                                for (let i = startPage; i <= endPage; i++) {
                                    pages.push(
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i)}
                                            className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                                                currentPage === i
                                                    ? 'bg-teal-500 text-white'
                                                    : 'bg-teal-100 text-teal-600 hover:bg-teal-200'
                                            }`}
                                        >
                                            {i}
                                        </button>
                                    );
                                }
                                return pages;
                            })()}

                            {/* Next Button */}
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 hover:bg-teal-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                            >
                                →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}