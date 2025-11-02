import Category from "../../Model/CategoryModel.js";
import { updateCoursesByCategory } from "../../Model/CourseModel.js";
import mongoose from "mongoose";

const addcategory = async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).json({ message: "Title and Description are required" });
  }

  try {
    // Check if category with same title already exists (case-insensitive)
    const existingCategory = await Category.findOne({
      title: { $regex: new RegExp(`^${title}$`, 'i') }
    });

    if (existingCategory) {
      return res.status(409).json({
        message: "Category with this title already exists",
        success: false
      });
    }

    const category = new Category({ title, description });
    await category.save();
    res.status(201).json({
      message: "Category Added Successfully",
      category,
      success: true
    });
  } catch (error) {
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Category with this title already exists",
        success: false
      });
    }
    res.status(500).json({ message: "Failed to create category" });
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
    return res.status(500).json({ message: "Failed to fetch Categories" })
  }
};

const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid category ID" });
  }

  try {
    // Check if another category with same title already exists (excluding current category)
    const existingCategory = await Category.findOne({
      title: { $regex: new RegExp(`^${title}$`, 'i') },
      _id: { $ne: id }
    });

    if (existingCategory) {
      return res.status(409).json({
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
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json({
      message: "Category updated successfully",
      category,
      success: true
    });
  } catch (error) {
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Category with this title already exists",
        success: false
      });
    }
    res.status(500).json({ message: "Failed to update category" });
  }
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }
    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    category.isVisible = !category.isVisible;
    await category.save();
    const action = category.isVisible ? "listed" : "unlisted";
    res.status(200).json({
      message: `Category ${action} successfully`,
      category
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update category visibility" });
  }
};

const toggleCategoryVisibility = async (req, res) => {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid category ID format",
      });
    }
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
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
    res.status(500).json({
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