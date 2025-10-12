import jwt from 'jsonwebtoken';
import User from '../Model/usermodel.js'; // Using User model for now

const protectTutor = async (req, res, next) => {
  let token;

  // Read the JWT from the 'Authorization' header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get tutor from the token (select everything except the password)
      req.tutor = await Tutor.findById(decoded.id).select('-password');

      if (!req.tutor) {
        return res.status(401).json({ message: 'Not authorized, tutor not found' });
      }

      next();
    } catch (error) {
      console.error('Tutor auth error:', error.name, error.message);
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

export { protectTutor };