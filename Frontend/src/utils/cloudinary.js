import { CLOUDINARY_CONFIG, IMAGE_UPLOAD_CONFIG } from '../config/cloudinary';
export const uploadToCloudinary = async (file) => {
    try {
        if (!CLOUDINARY_CONFIG.cloudName || !CLOUDINARY_CONFIG.uploadPreset) {
            throw new Error('Cloudinary configuration is missing. Please check your environment variables.');
        }
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
        const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
        });
        const data = await response.json();
        if (!response.ok) {
            if (response.status === 400) {
                throw new Error(data.error?.message || 'Invalid upload request. Please check your file and try again.');
            } else if (response.status === 401) {
                throw new Error('Unauthorized upload. Please check your Cloudinary configuration.');
            } else {
                throw new Error(data.error?.message || `Upload failed with status ${response.status}`);
            }
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
        return {
            success: false,
            error: error.message || 'Failed to upload image. Please try again.'
        };
    }
};
export const uploadVideoToCloudinary = async (file) => {
    try {
        if (!CLOUDINARY_CONFIG.cloudName || !CLOUDINARY_CONFIG.uploadPreset) {
            throw new Error('Cloudinary configuration is missing. Please check your environment variables.');
        }
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
        formData.append('resource_type', 'video');
        const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/video/upload`;
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
        return {
            success: false,
            error: error.message || 'Failed to upload video. Please try again.'
        };
    }
};
export const uploadDocumentToCloudinary = async (file) => {
    try {
        if (!CLOUDINARY_CONFIG.cloudName || !CLOUDINARY_CONFIG.uploadPreset) {
            throw new Error('Cloudinary configuration is missing. Please check your environment variables.');
        }
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
        formData.append('resource_type', 'raw');
        const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/raw/upload`;
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
        return {
            success: false,
            error: error.message || 'Failed to upload document. Please try again.'
        };
    }
};
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
export const validateVideoFile = (file) => {
    const allowedVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'];
    const maxVideoSize = 100 * 1024 * 1024;
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
export const validatePdfFile = (file) => {
    const maxPdfSize = 10 * 1024 * 1024;
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
