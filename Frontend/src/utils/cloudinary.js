import { CLOUDINARY_CONFIG, IMAGE_UPLOAD_CONFIG } from '../config/cloudinary';

// Cloudinary upload utility
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