import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Search, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import AdminLayout from "./common/AdminLayout";
import Swal from "sweetalert2";
import {
  fetchCategories,
  createCategory,
  updateCategoryAPI,
  toggleCategoryListingAPI,
  clearError
} from "../../Redux/categorySlice";
const Categories = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { categoryDatas: categories, pagination, loading, error } = useSelector(state => state.category);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });
  useEffect(() => {
    dispatch(fetchCategories({
      page: currentPage,
      limit: itemsPerPage,
      search: debouncedSearchTerm
    }));
  }, [dispatch, currentPage, itemsPerPage, debouncedSearchTerm]);

  // Reset to first page when search changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    
    // Client-side duplicate check
    const isDuplicate = categories.some(category => 
      category.title?.toLowerCase() === formData.name.toLowerCase()
    );
    
    if (isDuplicate) {
      toast.error("Category with this name already exists");
      return;
    }
    
    try {
      const result = await dispatch(createCategory(formData));
      if (createCategory.fulfilled.match(result)) {
        setFormData({ name: "", description: "" });
        setShowAddModal(false);
        toast.success("Category added successfully!");
        dispatch(fetchCategories({
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearchTerm
        }));
      } else if (createCategory.rejected.match(result)) {
        // Handle the error from the rejected action
        toast.error(result.payload || "Failed to add category");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };
  const handleEditCategory = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    
    // Client-side duplicate check (excluding current category)
    const isDuplicate = categories.some(category => 
      category.title?.toLowerCase() === formData.name.toLowerCase() && 
      category.id !== selectedCategory.id
    );
    
    if (isDuplicate) {
      toast.error("Category with this name already exists");
      return;
    }
    
    try {
      const result = await dispatch(updateCategoryAPI({
        id: selectedCategory.id,
        categoryData: formData
      }));
      if (updateCategoryAPI.fulfilled.match(result)) {
        setFormData({ name: "", description: "" });
        setShowEditModal(false);
        setSelectedCategory(null);
        toast.success("Category updated successfully!");
        dispatch(fetchCategories({
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearchTerm
        }));
      } else if (updateCategoryAPI.rejected.match(result)) {
        // Handle the error from the rejected action
        toast.error(result.payload || "Failed to update category");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };
  const handleToggleListing = async (category) => {
    const action = category.isVisible ? "unlist" : "list";
    const actionPast = category.isVisible ? "unlisted" : "listed";
    const result = await Swal.fire({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Category?`,
      text: `Are you sure you want to ${action} "${category.name}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: category.isVisible ? "#ef4444" : "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: `Yes, ${action} it!`,
      cancelButtonText: "Cancel"
    });
    if (!result.isConfirmed) return;
    try {
      const result = await dispatch(toggleCategoryListingAPI(category.id));
      if (toggleCategoryListingAPI.fulfilled.match(result)) {
        toast.success(`Category ${actionPast} successfully!`);
        dispatch(fetchCategories({
          page: currentPage,
          limit: itemsPerPage
        }));
      }
    } catch (error) {
    }
  };
  const openEditModal = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || ""
    });
    setShowEditModal(true);
  };
  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedCategory(null);
    setFormData({ name: "", description: "" });
  };
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  // Use server-filtered categories directly (no client-side filtering needed)
  const filteredCategories = categories;
  if (loading && categories.length === 0) {
    return (
      <AdminLayout title="Categories" subtitle="Manage course categories">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        </div>
      </AdminLayout>
    );
  }
  return (
    <AdminLayout title="Category Management" subtitle="Manage course categories">
      {}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">List of Categories</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 w-64"
              />
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              ADD CATEGORY
            </button>
          </div>
        </div>
      </div>
      {}
      <div className="space-y-4">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category) => (
            <div key={category.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-sky-600">
                      {category.name}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${category.isVisible
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {category.isVisible ? 'Listed' : 'Unlisted'}
                    </span>
                  </div>
                  {category.description && (
                    <p className="text-gray-600 text-sm">{category.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(category)}
                    className="px-4 py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors font-medium text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleListing(category)}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg transition-colors font-medium text-sm disabled:opacity-50 ${category.isVisible
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                  >
                    {loading ? "Updating..." : (category.isVisible ? "Unlist" : "List")}
                  </button>
                  <button 
                    onClick={() => navigate(`/admin/categories/${category.id}/courses`)}
                    className="px-4 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors font-medium text-sm"
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-400 mb-4">
              <div className="text-6xl mb-4">📂</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
              <p className="text-sm">
                {searchTerm
                  ? "Try adjusting your search criteria"
                  : "Get started by adding your first category"
                }
              </p>
            </div>
            {!searchTerm && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
              >
                Add First Category
              </button>
            )}
          </div>
        )}
      </div>
      {}
      {!searchTerm && pagination && pagination.totalPages > 1 && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {}
            <div className="text-sm text-gray-700">
              Total: {pagination.totalItems} categories
            </div>
            {}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              {}
              <div className="flex items-center gap-1">
                {[...Array(pagination.totalPages)].map((_, index) => {
                  const page = index + 1;
                  const isCurrentPage = page === currentPage;
                  const showPage = 
                    page === 1 || 
                    page === pagination.totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1);
                  if (!showPage) {
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-2 text-gray-500">...</span>;
                    }
                    return null;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 border rounded-lg transition-colors ${
                        isCurrentPage
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          {}
          <div className="mt-4 text-sm text-gray-600 text-center">
            Showing {((currentPage - 1) * 5) + 1} to {Math.min(currentPage * 5, pagination.totalItems)} of {pagination.totalItems} entries
          </div>
        </div>
      )}
      {}
      {showAddModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-gray-300 shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Category</h3>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Enter category name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Enter category description"
                  rows="3"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-sky-600 text-white py-2 rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Adding..." : "Add Category"}
                </button>
                <button
                  type="button"
                  onClick={closeModals}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {}
      {showEditModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-gray-300 shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Category</h3>
            <form onSubmit={handleEditCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Enter category name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Enter category description"
                  rows="3"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-sky-600 text-white py-2 rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Update Category"}
                </button>
                <button
                  type="button"
                  onClick={closeModals}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
export default Categories;
