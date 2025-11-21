import logger from '../utils/logger.js';
import { STATUS_CODES } from '../constants/constants.js';

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    // Log error with details
    logger.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        user: req.user?.id || 'anonymous'
    });

    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: 'Validation Error',
            errors
        });
    }


    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: `${field} already exists`
        });
    }


    if (err.name === 'CastError') {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: 'Invalid ID format'
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(STATUS_CODES.UNAUTHORIZED).json({
            success: false,
            message: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(STATUS_CODES.UNAUTHORIZED).json({
            success: false,
            message: 'Token expired'
        });
    }

    // Multer file upload errors
    if (err.name === 'MulterError') {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: `File upload error: ${err.message}`
        });
    }

    // Default error
    const statusCode = err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

// 404 Not Found handler
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(STATUS_CODES.NOT_FOUND);
    next(error);
};

export { errorHandler, notFound };

