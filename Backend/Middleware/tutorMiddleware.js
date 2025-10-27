import jwt from 'jsonwebtoken';
import Tutor from '../Model/TutorModel.js';
const protectTutor = async (req, res, next) => {
  if (!req.headers.authorization?.startsWith('Bearer')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.tutor = await Tutor.findById(decoded.id).select('-password');
    if (!req.tutor) {
      return res.status(401).json({ message: 'Not authorized, tutor not found' });
    }
    if (req.tutor.is_blocked) {
      return res.status(403).json({ message: 'Account has been blocked. Please contact support.' });
    }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired, please login again',
        expired: true
      });
    }
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};
export { protectTutor };
