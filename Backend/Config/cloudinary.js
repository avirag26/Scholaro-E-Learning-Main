import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dzkqp5fxh',
    api_key: process.env.CLOUDINARY_API_KEY || '776795823326575',
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// Check if Cloudinary is properly configured
export const isCloudinaryConfigured = () => {
    return !!(process.env.CLOUDINARY_CLOUD_NAME && 
              process.env.CLOUDINARY_API_KEY && 
              process.env.CLOUDINARY_API_SECRET);
};

// Upload buffer to Cloudinary
export const uploadToCloudinary = async (buffer, options = {}) => {
    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
        throw new Error('Cloudinary is not properly configured. Missing API credentials.');
    }

    return new Promise((resolve, reject) => {
        const uploadOptions = {
            resource_type: 'auto',
            folder: 'certificates',
            format: 'pdf',
            ...options
        };

        cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        ).end(buffer);
    });
};

// Upload file to Cloudinary
export const uploadFileToCloudinary = async (filePath, options = {}) => {
    try {
        const uploadOptions = {
            resource_type: 'auto',
            folder: 'certificates',
            ...options
        };

        const result = await cloudinary.uploader.upload(filePath, uploadOptions);
        return result;
    } catch (error) {
        throw error;
    }
};

// Delete file from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        throw error;
    }
};

export default cloudinary;