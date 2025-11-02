import Admin from "../../Model/AdminModel.js";

const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('-password -refreshToken');
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json({
      admin: {
        _id: admin._id,
        name: admin.full_name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        profileImage: admin.profileImage
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateAdminProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const adminId = req.admin._id;

    // Validate name if provided
    if (name) {
      if (name.length < 2 || name.length > 50) {
        return res.status(400).json({ message: "Name must be between 2 and 50 characters" });
      }
      if (!/^[a-zA-Z\s]+$/.test(name)) {
        return res.status(400).json({ message: "Name can only contain letters and spaces" });
      }
      if (/\d/.test(name)) {
        return res.status(400).json({ message: "Name cannot contain numbers" });
      }
      if (name.includes('_')) {
        return res.status(400).json({ message: "Name cannot contain underscores" });
      }
    }

    // Validate phone if provided
    if (phone) {
      if (!/^[6-9]\d{9}$/.test(phone)) {
        return res.status(400).json({ message: "Please enter a valid 10-digit Indian phone number starting with 6-9" });
      }
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    if (name) admin.full_name = name.trim();
    if (phone) admin.phone = phone;
    await admin.save();
    res.status(200).json({
      message: "Profile updated successfully",
      admin: {
        _id: admin._id,
        name: admin.full_name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        profileImage: admin.profileImage
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const uploadAdminProfilePhoto = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const adminId = req.admin._id;
    if (!imageUrl) {
      return res.status(400).json({ message: "Image URL is required" });
    }
    try {
      new URL(imageUrl);
    } catch (error) {
      return res.status(400).json({ message: "Invalid image URL format" });
    }
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    admin.profileImage = imageUrl;
    await admin.save();
    res.status(200).json({
      message: "Profile photo updated successfully",
      profileImage: admin.profileImage
    });
  } catch (error) {
    res.status(500).json({ message: "Server error while uploading profile photo" });
  }
};

export {
  getAdminProfile,
  updateAdminProfile,
  uploadAdminProfilePhoto
};