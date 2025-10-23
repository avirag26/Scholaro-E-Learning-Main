import { CLOUDINARY_CONFIG, IMAGE_UPLOAD_CONFIG } from '../config/cloudinary';

// Cloudinary upload utility for images
export const uploadToCloudinary = async (file) => {
    try {
        // Validate Cloudinary configuration
        if (!CLOUDINARY_CONFIG.cloudName || !CLOUDINARY_CONFIG.uploadPreset) {
            throw new Error('Cloudinary configuration is missing. Please check your environment variables.');
        }

        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

        const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;

        // Upload to Cloudinary
        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            // More specific error messages
            if (response.status === 400) {
                throw new Error(data.error?.message || 'Invalid upload request. Please check your file and try again.');
            } else if (response.status === 401) {
                throw new Error('Unauthorized upload. Please check your Cloudinary configuration.');
            } else {
                throw new Error(data.error?.message || `Upload failed with status ${response.status}`);
            }
        }

        // Validate response data
        if (!data.secure_url) {
            throw new Error('Upload completed but no URL was returned from Cloudinary.');
        }

        return {
            success: true,
            url: data.secure_url,
            publicId: data.public_id
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return {
            success: false,
            error: error.message || 'Failed to upload image. Please try again.'
        };
    }
};

// Cloudinary upload utility for videos
export const uploadVideoToCloudinary = async (file) => {
    try {
        // Validate Cloudinary configuration
        if (!CLOUDINARY_CONFIG.cloudName || !CLOUDINARY_CONFIG.uploadPreset) {
            throw new Error('Cloudinary configuration is missing. Please check your environment variables.');
        }

        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
        formData.append('resource_type', 'video');

        const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/video/upload`;

        // Upload to Cloudinary
        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || `Video upload failed with status ${response.status}`);
        }

        if (!data.secure_url) {
            throw new Error('Upload completed but no URL was returned from Cloudinary.');
        }

        return {
            success: true,
            url: data.secure_url,
            publicId: data.public_id,
            duration: data.duration
        };
    } catch (error) {
        console.error('Cloudinary video upload error:', error);
        return {
            success: false,
            error: error.message || 'Failed to upload video. Please try again.'
        };
    }
};

// Cloudinary upload utility for PDFs and documents
export const uploadDocumentToCloudinary = async (file) => {
    try {
        // Validate Cloudinary configuration
        if (!CLOUDINARY_CONFIG.cloudName || !CLOUDINARY_CONFIG.uploadPreset) {
            throw new Error('Cloudinary configuration is missing. Please check your environment variables.');
        }

        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
        formData.append('resource_type', 'raw');

        const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/raw/upload`;

        // Upload to Cloudinary
        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || `Document upload failed with status ${response.status}`);
        }

        if (!data.secure_url) {
            throw new Error('Upload completed but no URL was returned from Cloudinary.');
        }

        return {
            success: true,
            url: data.secure_url,
            publicId: data.public_id
        };
    } catch (error) {
        console.error('Cloudinary document upload error:', error);
        return {
            success: false,
            error: error.message || 'Failed to upload document. Please try again.'
        };
    }
};

// Helper function to validate image file
export const validateImageFile = (file) => {
    if (!IMAGE_UPLOAD_CONFIG.allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Please select a valid image file (JPEG, PNG, or WebP)'
        };
    }

    if (file.size > IMAGE_UPLOAD_CONFIG.maxSize) {
        return {
            valid: false,
            error: 'Image size should be less than 5MB'
        };
    }

    return { valid: true };
};

// Helper function to validate video file
export const validateVideoFile = (file) => {
    const allowedVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'];
    const maxVideoSize = 100 * 1024 * 1024; // 100MB

    if (!allowedVideoTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Please select a valid video file (MP4, AVI, MOV, WMV, WebM)'
        };
    }

    if (file.size > maxVideoSize) {
        return {
            valid: false,
            error: 'Video size should be less than 100MB'
        };
    }

    return { valid: true };
};

// Helper function to validate PDF file
export const validatePdfFile = (file) => {
    const maxPdfSize = 10 * 1024 * 1024; // 10MB

    if (file.type !== 'application/pdf') {
        return {
            valid: false,
            error: 'Please select a valid PDF file'
        };
    }

    if (file.size > maxPdfSize) {
        return {
            valid: false,
            error: 'PDF size should be less than 10MB'
        };
    }

    return { valid: true };
};