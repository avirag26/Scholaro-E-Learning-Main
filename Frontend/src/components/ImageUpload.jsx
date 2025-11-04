import { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { uploadToCloudinary, validateImageFile } from '../utils/cloudinary';
const ImageUpload = ({
    onImageUpload,
    currentImage,
    title = "Upload Image",
    className = "",
    uploadFolder = "images",
    placeholder = "Click to upload image",
    isCircular = false
}) => {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(currentImage);
    const fileInputRef = useRef(null);
    useEffect(() => {
        setPreview(currentImage);
    }, [currentImage]);
    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const validation = validateImageFile(file);
        if (!validation.valid) {
            toast.error(validation.error);
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            setPreview(event.target.result);
        };
        reader.readAsDataURL(file);
        setUploading(true);
        try {
            const uploadResult = await uploadToCloudinary(file, uploadFolder);
            if (uploadResult.success) {
                setPreview(uploadResult.url);
                onImageUpload(uploadResult.url);
                toast.success("Image uploaded successfully!");
            } else {
                toast.error(uploadResult.error || "Failed to upload image");
                setPreview(currentImage);
            }
        } catch (error) {
            toast.error("Failed to upload image");
            setPreview(currentImage);
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };
    const handleRemoveImage = () => {
        setPreview(null);
        onImageUpload('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    return (
        <div className={className}>
            {preview ? (
                <div className="relative">
                    <img
                        src={preview}
                        alt="Preview"
                        className={`w-full object-cover border-2 border-gray-200 shadow-sm ${
                            isCircular 
                                ? 'aspect-square rounded-full' 
                                : 'h-48 rounded-lg'
                        } ${uploading ? 'opacity-70' : ''}`}
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                        onLoad={() => {
                        }}
                    />
                    {}
                    {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 rounded-lg">
                            <div className="flex flex-col items-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mb-2"></div>
                                <p className="text-sm text-teal-600 font-medium">Uploading...</p>
                            </div>
                        </div>
                    )}
                    {}
                    <div className="absolute top-2 right-2 flex gap-1">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-1.5 bg-white text-gray-700 rounded-full hover:bg-gray-100 shadow-md border"
                            disabled={uploading}
                            title="Change image"
                        >
                            <Upload className="w-3 h-3" />
                        </button>
                        <button
                            onClick={handleRemoveImage}
                            className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md"
                            disabled={uploading}
                            title="Remove image"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed border-gray-300 text-center cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-all duration-200 ${
                        isCircular 
                            ? 'aspect-square rounded-full flex flex-col items-center justify-center p-4' 
                            : 'h-48 rounded-lg flex flex-col items-center justify-center p-8'
                    }`}
                >
                    {uploading ? (
                        <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mb-2"></div>
                            <p className="text-sm text-teal-600">Uploading...</p>
                        </div>
                    ) : (
                        <>
                            <ImageIcon className={`text-gray-400 mx-auto mb-3 ${isCircular ? 'w-8 h-8' : 'w-12 h-12'}`} />
                            <p className={`text-gray-600 font-medium ${isCircular ? 'text-sm mb-1' : 'mb-2'}`}>{title}</p>
                            <p className={`text-gray-500 ${isCircular ? 'text-xs' : 'text-sm'}`}>{placeholder}</p>
                        </>
                    )}
                </div>
            )}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
            />
        </div>
    );
};
export default ImageUpload;
