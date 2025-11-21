import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { adminAPI } from "../../api/axiosConfig";
import Swal from "sweetalert2";
import PropTypes from "prop-types";

const UserManagementTable = ({
  userType = 'student',
  fetchAction,
  updateStatusAction,
  stateKey,
  apiEndpoint,
  showViewButton = false,
  viewRoute
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const users = useSelector((state) => state[stateKey][stateKey]);
  const pagination = useSelector((state) => state[stateKey].pagination);
  const stats = useSelector((state) => state[stateKey].stats);
  const loading = useSelector((state) => state[stateKey].loading);
  const error = useSelector((state) => state[stateKey].error);

  const [actionLoading, setActionLoading] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const userTypeCapitalized = userType.charAt(0).toUpperCase() + userType.slice(1);
  const userTypePlural = userType === 'student' ? 'Students' : 'Tutors';

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);


  useEffect(() => {
    dispatch(fetchAction({
      page: currentPage,
      search: debouncedSearchTerm,
      status: statusFilter
    }));
  }, [dispatch, currentPage, statusFilter, debouncedSearchTerm, fetchAction]);


  useEffect(() => {
    setCurrentPage(1);

  }, [statusFilter, debouncedSearchTerm]);

  const handleBlockUnblock = async (userId, currentStatus) => {
    const action = currentStatus ? 'unblock' : 'block';
    const result = await Swal.fire({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} ${userTypeCapitalized}?`,
      text: currentStatus
        ? `This ${userType} will regain access to their account and can login again.`
        : `This ${userType} will be logged out immediately and unable to access their account.`,
      icon: currentStatus ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonColor: currentStatus ? '#10b981' : '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Yes, ${action}!`,
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    setActionLoading(prev => ({ ...prev, [userId]: true }));

    try {
      const response = await adminAPI.patch(`${apiEndpoint}/${userId}/${action}`);

      if (response.data.success) {
  
        if (updateStatusAction) {
          dispatch(updateStatusAction({
            userId,
            isBlocked: action === 'block'
          }));
        } else {
          dispatch(fetchAction({
            page: currentPage,
            search: debouncedSearchTerm,
            status: statusFilter
          }));
        }

        toast.success(
          action === 'block'
            ? `${userTypeCapitalized} has been blocked successfully`
            : `${userTypeCapitalized} has been unblocked successfully`
        );
      }
    } catch (error) {
      const actionText = currentStatus ? 'unblock' : 'block';
      toast.error(`Failed to ${actionText} ${userType}. ${error.response?.data?.message || 'Please try again.'}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
        <button
          onClick={() => dispatch(fetchAction({ page: 1, search: '', status: 'all' }))}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4">
          <div className="flex items-center">
            <div className="text-2xl text-blue-500 mr-3">👥</div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Total {userTypePlural}</p>
              <p className="text-lg sm:text-xl font-semibold text-gray-900">
                {stats?.total || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4">
          <div className="flex items-center">
            <div className="text-2xl text-green-500 mr-3">✅</div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Active {userTypePlural}</p>
              <p className="text-lg sm:text-xl font-semibold text-gray-900">
                {stats?.listed || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center">
            <div className="text-2xl text-red-500 mr-3">🚫</div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Blocked {userTypePlural}</p>
              <p className="text-lg sm:text-xl font-semibold text-gray-900">
                {stats?.unlisted || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow">
        {/* Header with Search and Filters */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                {userTypeCapitalized} List
              </h2>
              <button
                onClick={() => dispatch(fetchAction({
                  page: currentPage,
                  search: searchTerm,
                  status: statusFilter
                }))}
                className="px-3 py-2 bg-sky-500 text-white text-sm rounded-lg hover:bg-sky-600 self-start sm:self-auto"
              >
                Refresh
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="all">All {userTypePlural}</option>
                <option value="active">Active Only</option>
                <option value="blocked">Blocked Only</option>
              </select>

              <div className="relative flex-1 sm:max-w-xs">
                <input
                  type="text"
                  placeholder={`Search ${userType}s...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="block sm:hidden">
          {Array.isArray(users) && users.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {users.map((user) => (
                <div key={user._id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center text-white text-sm font-medium mr-3">
                        {user.full_name?.charAt(0)?.toUpperCase() || userType.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-xs text-gray-500">ID: {user[`${userType}_id`]}</div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.is_blocked
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                        }`}>
                        {user.is_blocked ? 'Blocked' : 'Active'}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.is_verified
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {user.is_verified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mb-3">
                    <div>{user.email}</div>
                    {user.phone && <div>{user.phone}</div>}
                  </div>
                  <div className="flex gap-2">
                    {showViewButton && (
                      <button
                        onClick={() => navigate(`${viewRoute}/${user._id}/details`)}
                        className="flex-1 px-3 py-2 bg-teal-100 text-teal-700 rounded text-sm font-medium hover:bg-teal-200 transition-colors text-center"
                      >
                        View Details
                      </button>
                    )}
                    <button
                      onClick={() => handleBlockUnblock(user._id, user.is_blocked)}
                      disabled={actionLoading[user._id]}
                      className={`${showViewButton ? 'flex-1' : 'w-full'} px-3 py-2 rounded text-sm font-medium transition-colors ${user.is_blocked
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                        } ${actionLoading[user._id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {actionLoading[user._id] ? 'Processing...' : user.is_blocked ? 'Unblock' : 'Block'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No {userType}s found</h3>
              <p className="text-sm">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : `${userTypePlural} will appear here once they register`
                }
              </p>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{userTypeCapitalized}</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verification</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(users) && users.length > 0 ? (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white text-sm font-medium mr-3">
                          {user.full_name?.charAt(0)?.toUpperCase() || userType.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                          <div className="text-xs text-gray-500">ID: {user[`${userType}_id`]}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                      {user.phone && <div className="text-xs text-gray-500">{user.phone}</div>}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.is_blocked
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                        }`}>
                        {user.is_blocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.is_verified
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {user.is_verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {showViewButton && (
                          <button
                            onClick={() => navigate(`${viewRoute}/${user._id}/details`)}
                            className="px-3 py-1 bg-teal-100 text-teal-700 rounded text-xs font-medium hover:bg-teal-200 transition-colors"
                          >
                            View
                          </button>
                        )}
                        <button
                          onClick={() => handleBlockUnblock(user._id, user.is_blocked)}
                          disabled={actionLoading[user._id]}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${user.is_blocked
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                            } ${actionLoading[user._id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {actionLoading[user._id] ? 'Processing...' : user.is_blocked ? 'Unblock' : 'Block'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 sm:px-6 py-8 text-center">
                    <div className="text-gray-500">
                      <div className="text-4xl mb-2">👥</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No {userType}s found</h3>
                      <p className="text-sm">
                        {searchTerm || statusFilter !== "all"
                          ? "Try adjusting your search or filter criteria"
                          : `${userTypePlural} will appear here once they register`
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && (pagination[`total${userTypePlural}`] > 0 || pagination.totalPages > 0) && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                Showing {((pagination.currentPage - 1) * 10) + 1} to{' '}
                {Math.min(pagination.currentPage * 10, pagination[`total${userTypePlural}`])} of{' '}
                {pagination[`total${userTypePlural}`]} {userType}s
              </div>
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium ${!pagination.hasPrev
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    Previous
                  </button>

                  <div className="flex space-x-1">
                    {pagination.totalPages > 1 && Array.from({
                      length: Math.min(window.innerWidth < 640 ? 3 : 5, pagination.totalPages)
                    }, (_, i) => {
                      let pageNum;
                      const maxPages = window.innerWidth < 640 ? 3 : 5;
                      if (pagination.totalPages <= maxPages) {
                        pageNum = i + 1;
                      } else if (pagination.currentPage <= Math.floor(maxPages / 2) + 1) {
                        pageNum = i + 1;
                      } else if (pagination.currentPage >= pagination.totalPages - Math.floor(maxPages / 2)) {
                        pageNum = pagination.totalPages - maxPages + 1 + i;
                      } else {
                        pageNum = pagination.currentPage - Math.floor(maxPages / 2) + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium ${pagination.currentPage === pageNum
                            ? 'bg-sky-500 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium ${!pagination.hasNext
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
    </>
  );
};

UserManagementTable.propTypes = {
  userType: PropTypes.oneOf(['student', 'tutor']).isRequired,

  fetchAction: PropTypes.func.isRequired,

  updateStatusAction: PropTypes.func,

  stateKey: PropTypes.oneOf(['users', 'tutors']).isRequired,

  apiEndpoint: PropTypes.string.isRequired,

  showViewButton: PropTypes.bool,

  viewRoute: PropTypes.string
};

UserManagementTable.defaultProps = {
  showViewButton: false,
  updateStatusAction: null,
  viewRoute: ''
};

export default UserManagementTable;
