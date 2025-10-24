import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTutors } from "../../Redux/tutorSlice";
import AdminLayout from "./common/AdminLayout";
import { toast } from "react-toastify";
import { adminAPI } from "../../api/axiosConfig";
import Swal from "sweetalert2";

const Tutors = () => {
  const dispatch = useDispatch();
  const tutors = useSelector((state) => state.tutors.tutors);
  const pagination = useSelector((state) => state.tutors.pagination);
  const stats = useSelector((state) => state.tutors.stats);
  const loading = useSelector((state) => state.tutors.loading);
  const error = useSelector((state) => state.tutors.error);

  const [actionLoading, setActionLoading] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);


  useEffect(() => {
    dispatch(fetchTutors({
      page: currentPage,
      search: "",
      status: statusFilter
    }));
  }, [dispatch, currentPage, statusFilter]);


  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [statusFilter]);


  const filteredTutors = tutors.filter(tutor => {
    const matchesSearch = searchTerm === "" || 
      tutor.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tutor.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && !tutor.is_blocked) ||
      (statusFilter === "blocked" && tutor.is_blocked);
    
    return matchesSearch && matchesStatus;
  });

  const handleBlockUnblock = async (tutorId, currentStatus) => {


    const action = currentStatus ? 'unblock' : 'block';
    const result = await Swal.fire({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Tutor?`,
      text: currentStatus 
        ? 'This tutor will regain access to their account and can login again.'
        : 'This tutor will be logged out immediately and unable to access their account.',
      icon: currentStatus ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonColor: currentStatus ? '#10b981' : '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Yes, ${action}!`,
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [tutorId]: true }));

    try {
      const action = currentStatus ? 'unblock' : 'block';
      const response = await adminAPI.patch(`/api/admin/tutors/${tutorId}/${action}`);

      if (response.data.success) {
        if (action === 'block') {
          toast.success(`🚫 Tutor has been blocked successfully. They will be logged out on next page refresh.`);
        } else {
          toast.success(`✅ Tutor has been unblocked successfully. They can now access their account.`);
        }

        dispatch(fetchTutors({
          page: currentPage,
          search: searchTerm,
          status: statusFilter
        }));
      }
    } catch (error) {
      const actionText = currentStatus ? 'unblock' : 'block';
      toast.error(`❌ Failed to ${actionText} tutor. ${error.response?.data?.message || 'Please try again.'}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [tutorId]: false }));
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <AdminLayout title="Tutors">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Tutors">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
          <button
            onClick={() => dispatch(fetchTutors({ page: 1, search: '', status: 'all' }))}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Tutors" subtitle="Manage all registered tutors">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="text-2xl text-sky-500 mr-3">👥</div>
            <div>
              <p className="text-sm text-gray-500">Total Tutors</p>
              <p className="text-xl font-semibold text-gray-900">
                {stats?.total || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="text-2xl text-green-500 mr-3">✅</div>
            <div>
              <p className="text-sm text-gray-500">Listed Tutors</p>
              <p className="text-xl font-semibold text-gray-900">
                {stats?.listed || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="text-2xl text-red-500 mr-3">🚫</div>
            <div>
              <p className="text-sm text-gray-500">Unlisted Tutors</p>
              <p className="text-xl font-semibold text-gray-900">
                {stats?.unlisted || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow">
        {/* Header with Search and Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Tutor List
              </h2>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="all">All Tutors</option>
                <option value="active">Active Only</option>
                <option value="blocked">Blocked Only</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search tutors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 w-64"
              />

              <button
                onClick={() => dispatch(fetchTutors({
                  page: currentPage,
                  search: searchTerm,
                  status: statusFilter
                }))}
                className="px-4 py-2 bg-sky-500 text-white text-sm rounded-lg hover:bg-sky-600"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tutor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verification</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(filteredTutors) && filteredTutors.length > 0 ? (
                filteredTutors.map((tutor) => (
                  <tr key={tutor._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white text-sm font-medium mr-3">
                          {tutor.full_name?.charAt(0)?.toUpperCase() || 'T'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{tutor.full_name}</div>
                          <div className="text-xs text-gray-500">ID: {tutor.tutor_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{tutor.email}</div>
                      {tutor.phone && <div className="text-xs text-gray-500">{tutor.phone}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${tutor.is_blocked
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                        }`}>
                        {tutor.is_blocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${tutor.is_verified
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {tutor.is_verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleBlockUnblock(tutor._id, tutor.is_blocked)}
                        disabled={actionLoading[tutor._id]}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${tutor.is_blocked
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                          } ${actionLoading[tutor._id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {actionLoading[tutor._id] ? (
                          'Processing...'
                        ) : tutor.is_blocked ? (
                          'Unblock'
                        ) : (
                          'Block'
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center">
                    <div className="text-gray-500">
                      <div className="text-4xl mb-2">👥</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No tutors found</h3>
                      <p className="text-sm">
                        {searchTerm || statusFilter !== "all"
                          ? "Try adjusting your search or filter criteria"
                          : "Tutors will appear here once they register"
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Server-side Pagination */}
        {pagination && (pagination.totalTutors > 0 || pagination.totalPages > 0) && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.currentPage - 1) * (pagination.limit || 5)) + 1} to {Math.min(pagination.currentPage * (pagination.limit || 5), pagination.totalTutors || 0)} of {pagination.totalTutors || 0} tutors
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center space-x-2">
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className={`px-3 py-1 rounded text-sm font-medium ${!pagination.hasPrev
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="flex space-x-1">
                  {pagination.totalPages > 1 && Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 rounded text-sm font-medium ${pagination.currentPage === page
                        ? 'bg-sky-500 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className={`px-3 py-1 rounded text-sm font-medium ${!pagination.hasNext
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  Next
                </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Tutors;