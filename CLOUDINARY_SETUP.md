# Cloudinary Setup Guide

## 1. Create Cloudinary Account
1. Go to [Cloudinary](https://cloudinary.com/) and sign up for a free account
2. After signup, you'll be redirected to your dashboard

## 2. Get Your Credentials
From your Cloudinary dashboard, copy these values:
- **Cloud Name**: Found in the dashboard URL or account details
- **API Key**: Found in the "Account Details" section
- **API Secret**: Found in the "Account Details" section (not needed for frontend)

## 3. Create Upload Preset
1. Go to **Settings** → **Upload** in your Cloudinary dashboard
2. Scroll down to **Upload presets**
3. Click **Add upload preset**
4. Configure the preset:
   - **Preset name**: `profile_photos` (or any name you prefer)
   - **Signing Mode**: `Unsigned` (important for frontend uploads)
   - **Folder**: `profile_images` (optional, for organization)
   - **Transformation**: 
     - Width: 400px
     - Height: 400px
     - Crop: Fill
     - Quality: Auto
     - Format: Auto
5. Click **Save**

## 4. Configure Environment Variables
1. Copy `Frontend/.env.example` to `Frontend/.env`
2. Replace the placeholder values:

```env
VITE_CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=profile_photos
VITE_CLOUDINARY_API_KEY=your_actual_api_key
```

## 5. Test the Setup
1. Start your application
2. Go to user or tutor profile
3. Click the camera icon to upload a profile photo
4. The image should upload to Cloudinary and display immediately

## Features Included
✅ **Image Upload**: Direct upload to Cloudinary from frontend
✅ **Image Optimization**: Automatic compression and format conversion
✅ **Validation**: File type and size validation
✅ **Preview**: Immediate preview while uploading
✅ **Persistence**: Images saved to database and localStorage
✅ **Loading States**: Upload progress indicators
✅ **Error Handling**: User-friendly error messages

## Troubleshooting
- **Upload fails**: Check your upload preset is set to "Unsigned"
- **CORS errors**: Make sure your domain is allowed in Cloudinary settings
- **Large files**: Images are automatically optimized to 400x400px
- **Slow uploads**: Cloudinary automatically optimizes images for web

## Security Notes
- Upload preset is unsigned (safe for frontend)
- No API secret exposed to frontend
- File validation prevents malicious uploads
- Images are automatically optimized and sanitized by Cloudinary