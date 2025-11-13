import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dzkqp5fxh',
    api_key: process.env.CLOUDINARY_API_KEY || '776795823326575',
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});


export const isCloudinaryConfigured = () => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dzkqp5fxh';
    const apiKey = process.env.CLOUDINARY_API_KEY || '776795823326575';
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!apiSecret) {
        console.warn('CLOUDINARY_API_SECRET is missing. Signed URLs will not work.');
        return false;
    }

    return !!(cloudName && apiKey && apiSecret);
};


export const uploadToCloudinary = async (buffer, options = {}) => {
 
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


export const uploadPDFToCloudinary = async (buffer, options = {}) => {
 
    if (!isCloudinaryConfigured()) {
        throw new Error('Cloudinary is not properly configured. Missing API credentials.');
    }

    return new Promise((resolve, reject) => {
        const uploadOptions = {
            resource_type: 'raw', 
            folder: 'certificates',
            format: 'pdf',
            use_filename: true,
            unique_filename: false,
            ...options
        };

        cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) {
                    console.error('Cloudinary PDF upload error:', error);
                    reject(error);
                } else {
                    console.log('PDF uploaded successfully:', result.secure_url);
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

export const generateSignedVideoUrl = (publicId, options = {}, userId = null) => {
    try {
        if (!isCloudinaryConfigured()) {
            throw new Error('Cloudinary is not properly configured');
        }

        const defaultOptions = {
            resource_type: 'video',
            type: 'upload',
            sign_url: true, 
            expires_at: Math.floor(Date.now() / 1000) + (30 * 60), 
            secure: true,
            ...options
        };

        
        const signedUrl = cloudinary.url(publicId, defaultOptions);

        return signedUrl;
    } catch (error) {
        throw error;
    }
};

export const generateUltraSecureVideoUrl = (publicId, userId, sessionId, options = {}) => {
    try {
        if (!isCloudinaryConfigured()) {
            throw new Error('Cloudinary is not properly configured');
        }

        const secureOptions = {
            resource_type: 'video',
            type: 'upload',
            sign_url: true,
            secure: true,
            
            transformation: [
                { quality: 'auto' },
                { fetch_format: 'auto' }
            ],
            ...options
        };

        const signedUrl = cloudinary.url(publicId, secureOptions);

        return signedUrl;
    } catch (error) {
        throw error;
    }
};


export const extractPublicIdFromUrl = (cloudinaryUrl) => {
    try {
        if (!cloudinaryUrl) return null;

      
        const urlPattern = /(?:https?:\/\/)?(?:res\.cloudinary\.com\/[^\/]+\/)?(?:video|image)\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/;
        const match = cloudinaryUrl.match(urlPattern);

        if (match && match[1]) {
            
            return match[1].replace(/\.[^.]+$/, '');
        }

        return null;
    } catch (error) {
        console.error('Error extracting public ID:', error);
        return null;
    }
};

export default cloudinary;