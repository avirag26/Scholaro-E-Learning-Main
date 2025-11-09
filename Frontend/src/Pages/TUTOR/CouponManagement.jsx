import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Calendar, Users, Percent, DollarSign } from 'lucide-react';
import TutorLayout from './COMMON/TutorLayout';
import { tutorAPI } from '../../api/axiosConfig';

const CouponManagement = () => {
  const [coupons, setCoupons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    maxDiscountAmount: '',
    minPurchaseAmount: '',
    startDate: '',
    expiryDate: '',
    usageLimit: '',
    usagePerUser: 1,
    applicableCourses: [],
    excludedCourses: []
  });

  useEffect(() => {
    fetchCoupons();
    fetchCourses();
    fetchAnalytics();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await tutorAPI.get('/api/tutors/coupons');
      setCoupons(response.data.coupons || []);
    } catch (error) {
      toast.error('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await tutorAPI.get('/api/tutors/courses');
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error('Failed to fetch courses');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await tutorAPI.get('/api/tutors/coupons/analytics');
      setAnalytics(response.data.analytics);
    } catch (error) {
      console.error('Failed to fetch analytics');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleCourseSelection = (courseId, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(courseId)
        ? prev[field].filter(id => id !== courseId)
        : [...prev[field], courseId]
    }));
  };

  const resetForm = () => {
    setFormData({
      code: '',
      title: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      maxDiscountAmount: '',
      minPurchaseAmount: '',
      startDate: '',
      expiryDate: '',
      usageLimit: '',
      usagePerUser: 1,
      applicableCourses: [],
      excludedCourses: []
    });
    setEditingCoupon(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...formData,
        code: formData.code.toUpperCase().trim(),
        usageLimit: formData.usageLimit === '' ? null : formData.usageLimit,
        maxDiscountAmount: formData.discountType === 'percentage' && formData.maxDiscountAmount 
          ? formData.maxDiscountAmount : null
      };

      if (editingCoupon) {
        await tutorAPI.put(`/api/tutors/coupons/${editingCoupon._id}`, payload);
        toast.success('Coupon updated successfully');
      } else {
        await tutorAPI.post('/api/tutors/coupons', payload);
        toast.success('Coupon created successfully');
      }

      fetchCoupons();
      fetchAnalytics();
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleEdit = (coupon) => {
    setFormData({
      code: coupon.code,
      title: coupon.title,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscountAmount: coupon.maxDiscountAmount || '',
      minPurchaseAmount: coupon.minPurchaseAmount || '',
      startDate: new Date(coupon.startDate).toISOString().split('T')[0],
      expiryDate: new Date(coupon.expiryDate).toISOString().split('T')[0],
      usageLimit: coupon.usageLimit || '',
      usagePerUser: coupon.usagePerUser,
      applicableCourses: coupon.applicableCourses?.map(c => c._id) || [],
      excludedCourses: coupon.excludedCourses?.map(c => c._id) || []
    });
    setEditingCoupon(coupon);
    setShowCreateModal(true);
  };

  const handleDelete = async (couponId) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;

    try {
      await tutorAPI.delete(`/api/tutors/coupons/${couponId}`);
      toast.success('Coupon deleted successfully');
      fetchCoupons();
      fetchAnalytics();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete coupon');
    }
  };

  const handleToggleStatus = async (couponId) => {
    try {
      await tutorAPI.patch(`/api/tutors/coupons/${couponId}/toggle-status`);
      toast.success('Coupon status updated');
      fetchCoupons();
    } catch (error) {
      toast.error('Failed to update coupon status');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN');
  };

  const getCouponStatus = (coupon) => {
    if (!coupon.isActive) return { text: 'Inactive', color: 'bg-gray-100 text-gray-800' };
    if (new Date() > new Date(coupon.expiryDate)) return { text: 'Expired', color: 'bg-red-100 text-red-800' };
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { text: 'Used Up', color: 'bg-orange-100 text-orange-800' };
    return { text: 'Active', color: 'bg-green-100 text-green-800' };
  };

  if (loading) {
    return (
      <TutorLayout title="Coupon Management">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </TutorLayout>
    );
  }

  return (
    <TutorLayout title="Coupon Management" subtitle="Create and manage discount coupons for your courses">
      <div className="space-y-6">
        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Coupons</p>
                  <p className="text-2xl font-bold text-gray-800">{analytics.totalCoupons}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Active Coupons</p>
                  <p className="text-2xl font-bold text-gray-800">{analytics.activeCoupons}</p>
                </div>
                <Calendar className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Usage</p>
                  <p className="text-2xl font-bold text-gray-800">{analytics.totalUsage}</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Discount Given</p>
                  <p className="text-2xl font-bold text-gray-800">₹{analytics.totalDiscountGiven}</p>
                </div>
                <Percent className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">My Coupons</h2>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Coupon
          </button>
        </div>

        {/* Coupons List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {coupons.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No coupons yet</h3>
              <p className="text-gray-600 mb-4">Create your first coupon to offer discounts to students</p>
              <button
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Create Coupon
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Validity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {coupons.map((coupon) => {
                    const status = getCouponStatus(coupon);
                    return (
                      <tr key={coupon._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{coupon.code}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{coupon.title}</div>
                          {coupon.description && (
                            <div className="text-xs text-gray-500">{coupon.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {coupon.discountType === 'percentage' 
                              ? `${coupon.discountValue}%` 
                              : `₹${coupon.discountValue}`}
                          </div>
                          {coupon.minPurchaseAmount > 0 && (
                            <div className="text-xs text-gray-500">Min: ₹{coupon.minPurchaseAmount}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {coupon.usedCount} / {coupon.usageLimit || '∞'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(coupon.startDate)}</div>
                          <div className="text-xs text-gray-500">to {formatDate(coupon.expiryDate)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                            {status.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(coupon)}
                              className="text-blue-600 hover:text-blue-900"
                              disabled={coupon.usedCount > 0}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(coupon._id)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              {coupon.isActive ? (
                                <ToggleRight className="w-4 h-4 text-green-600" />
                              ) : (
                                <ToggleLeft className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(coupon._id)}
                              className="text-red-600 hover:text-red-900"
                              disabled={coupon.usedCount > 0}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl border border-gray-300 ring-1 ring-gray-200 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SAVE20"
                    required
                    maxLength={20}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="20% Off on All Courses"
                    required
                    maxLength={100}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Special discount for new students"
                  rows={2}
                  maxLength={500}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Type *
                  </label>
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={formData.discountType === 'percentage' ? '20' : '500'}
                    required
                    min="1"
                    max={formData.discountType === 'percentage' ? 100 : undefined}
                  />
                </div>
                {formData.discountType === 'percentage' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Discount (₹)
                    </label>
                    <input
                      type="number"
                      name="maxDiscountAmount"
                      value={formData.maxDiscountAmount}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1000"
                      min="1"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Purchase Amount (₹)
                  </label>
                  <input
                    type="number"
                    name="minPurchaseAmount"
                    value={formData.minPurchaseAmount}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usage Per User
                  </label>
                  <input
                    type="number"
                    name="usagePerUser"
                    value={formData.usagePerUser}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Usage Limit
                  </label>
                  <input
                    type="number"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Unlimited"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingCoupon ? 'Update' : 'Create'} Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </TutorLayout>
  );
};

export default CouponManagement;