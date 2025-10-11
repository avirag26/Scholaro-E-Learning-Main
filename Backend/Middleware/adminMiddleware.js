import jwt from "jsonwebtoken";
import Admin from "../Model/AdminModel.js";

const protectAdmin = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt_admin) {
      token = req.cookies.jwt_admin;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Admin access required. Please login",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin not found. Please login again",
      });
    }

    if (admin.is_blocked) {
      return res.status(403).json({
        success: false,
        message: "Admin account suspended",
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid admin token. Please login again",
    });
  }
};

export { protectAdmin };
