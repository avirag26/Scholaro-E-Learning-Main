import jwt from 'jsonwebtoken';
import User from '../Model/usermodel.js';

const protectUser = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Please login to access this page'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please login again'
      });
    }

    if (user.is_blocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Contact support'
      });
    }

    if (!user.is_verified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email first'
      });
    }

    req.user = user;
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please login again'
    });
  }
};

export { protectUser };