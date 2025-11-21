import Category from "../../Model/CategoryModel.js";
import { updateCoursesByCategory } from "../../Model/CourseModel.js";
import mongoose from "mongoose";
import { STATUS_CODES } from "../../constants/constants.js";

const addcategory = async (req, res) => {
  const { title, description } = req.body;
  
  // Validation
  if (!title || !description) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Title and Description are required" });
  }

  if (title.trim().length < 2 || title.trim().length > 50) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Title must be between 2 and 50 characters" });
  }

  if (description.trim().length < 10 || description.trim().length > 200) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Description must be between 10 and 200 characters" });
  }

  // Check for special characters
  if (!/^[a-zA-Z0-9\s\-\&]+$/.test(title)) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Title can only contain letters, numbers, spaces, hyphens and ampersands" });
  }

  try {
    // Check if category with same title already exists (case-insensitive)
    const existingCategory = await Category.findOne({
      title: { $regex: new RegExp(`^${title}$`, 'i') }
    });

    if (existingCategory) {
      return res.status(STATUS_CODES.CONFLICT).json({
        message: "Category with this title already exists",
        success: false
      });
    }

    const category = new Category({ title, description });
    await category.save();
    res.status(STATUS_CODES.CREATED).json({
      message: "Category Added Successfully",
      category,
      success: true
    });
  } catch (error) {
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(STATUS_CODES.CONFLICT).json({
        message: "Category with this title already exists",
        success: false
      });
    }
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Failed to create category" });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const skipPagination = req.query.all === "true";
    if (skipPagination) {
      const categories = await Category.find().sort({ createdAt: -1 });
      const formattedCategories = categories.map((category) => ({
        id: category._id,
        title: category.title,
        description: category.description,
        isVisible: category.isVisible,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      }));
      return res.json({
        categories: formattedCategories,
        pagination: null,
      })
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    let query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const totalCategories = await Category.countDocuments(query);
    const totalPages = Math.ceil(totalCategories / limit);
    const categories = await Category.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const formattedCategories = categories.map((category) => ({
      id: category._id,
      title: category.title,
      description: category.description,
      isVisible: category.isVisible,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));
    res.json({
      categories: formattedCategories,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCategories,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch Categories" })
  }
};

const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Invalid category ID" });
  }

  // Validation
  if (!title || !description) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Title and Description are required" });
  }

  if (title.trim().length < 2 || title.trim().length > 50) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Title must be between 2 and 50 characters" });
  }

  if (description.trim().length < 10 || description.trim().length > 200) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Description must be between 10 and 200 characters" });
  }

  // Check for special characters
  if (!/^[a-zA-Z0-9\s\-\&]+$/.test(title)) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Title can only contain letters, numbers, spaces, hyphens and ampersands" });
  }

  try {
    // Check if another category with same title already exists (excluding current category)
    const existingCategory = await Category.findOne({
      title: { $regex: new RegExp(`^${title}$`, 'i') },
      _id: { $ne: id }
    });

    if (existingCategory) {
      return res.status(STATUS_CODES.CONFLICT).json({
        message: "Category with this title already exists",
        success: false
      });
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { title, description },
      { new: true }
    );
    if (!category) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "Category not found" });
    }
    res.status(STATUS_CODES.OK).json({
      message: "Category updated successfully",
      category,
      success: true
    });
  } catch (error) {
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(STATUS_CODES.CONFLICT).json({
        message: "Category with this title already exists",
        success: false
      });
    }
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Failed to update category" });
  }
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Invalid category ID" });
    }
    const category = await Category.findById(id);
    if (!category) return res.status(STATUS_CODES.NOT_FOUND).json({ message: "Category not found" });
    category.isVisible = !category.isVisible;
    await category.save();
    const action = category.isVisible ? "listed" : "unlisted";
    res.status(STATUS_CODES.OK).json({
      message: `Category ${action} successfully`,
      category
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Failed to update category visibility" });
  }
};

const toggleCategoryVisibility = async (req, res) => {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        message: "Invalid category ID format",
      });
    }
    const category = await Category.findById(id);
    if (!category) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        message: "Category not found",
      });
    }
    category.isVisible = !category.isVisible;
    await category.save();
    await updateCoursesByCategory(id, category.isVisible);
    res.json({
      message: `Category visibility updated to ${category.isVisible ? "visible" : "hidden"
        }`,
      category,
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: "Failed to update category visibility",
      error: error.message,
    });
  }
};

export {
  addcategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  toggleCategoryVisibility
};

