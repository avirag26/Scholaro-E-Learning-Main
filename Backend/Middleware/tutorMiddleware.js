import jwt from 'jsonwebtoken';
import User from '../Model/usermodel.js'; // Using User model for now

const protectTutor = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt_tutor) {
      token = req.cookies.jwt_tutor;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Tutor access required. Please login'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const tutor = await User.findById(decoded.id).select('-password');
    
    if (!tutor) {
      return res.status(401).json({
        success: false,
        message: 'Tutor not found. Please login again'
      });
    }

    if (tutor.is_blocked) {
      return res.status(403).json({
        success: false,
        message: 'Your tutor account has been blocked'
      });
    }

    if (!tutor.is_verified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your tutor account first'
      });
    }

    req.tutor = tutor;
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid tutor token. Please login again'
    });
  }
};

export { protectTutor };