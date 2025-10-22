// Cloudinary configuration
// You need to replace these with your actual Cloudinary credentials

export const CLOUDINARY_CONFIG = {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dzkqp5fxh',
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'profile_photos',
    apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || '776795823326575',
};

// Validation settings
export const IMAGE_UPLOAD_CONFIG = {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    quality: 'auto:good',
    format: 'auto',
};