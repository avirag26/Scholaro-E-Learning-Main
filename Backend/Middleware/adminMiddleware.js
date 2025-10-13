import jwt from "jsonwebtoken";
import Admin from "../Model/AdminModel.js";

const protectAdmin = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
  
      token = req.headers.authorization.split(' ')[1];

 
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      
      req.admin = await Admin.findById(decoded.id).select('-password');

      if (!req.admin) {
        return res.status(401).json({ message: 'Not authorized, admin not found' });
      }

      if (req.admin.is_blocked) {
        return res.status(403).json({ message: 'Account has been blocked. Please contact support.' });
      }

      
      req.user = req.admin;

      next();
    } catch (error) {
      console.error('Admin auth error:', error.name, error.message);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token expired, please login again',
          expired: true
        });
      }
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export { protectAdmin };