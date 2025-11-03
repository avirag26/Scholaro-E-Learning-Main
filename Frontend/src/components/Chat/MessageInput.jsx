import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Send, Image, Smile, X } from 'lucide-react';
import socketService from '../../services/socketService';
import { uploadToCloudinary, validateImageFile } from '../../utils/cloudinary';
import { toast } from 'react-toastify';

const MessageInput = ({ chatId }) => {
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const { connected } = useSelector(state => state.chat);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        }
    }, [message]);

    // Handle typing indicators
    useEffect(() => {
        if (message.trim() && !isTyping) {
            setIsTyping(true);
            socketService.startTyping(chatId);
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to stop typing indicator
        typingTimeoutRef.current = setTimeout(() => {
            if (isTyping) {
                setIsTyping(false);
                socketService.stopTyping(chatId);
            }
        }, 1000);

        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [message, chatId, isTyping]);

    // Cleanup typing indicator on unmount
    useEffect(() => {
        return () => {
            if (isTyping) {
                socketService.stopTyping(chatId);
            }
        };
    }, [chatId, isTyping]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if ((!message.trim() && !selectedImage) || !connected) {
            return;
        }

        const messageContent = message.trim();
        
        // Stop typing indicator
        if (isTyping) {
            setIsTyping(false);
            socketService.stopTyping(chatId);
        }

        try {
            if (selectedImage) {
                setUploading(true);
                
                // Upload image to Cloudinary first
                const uploadResult = await uploadToCloudinary(selectedImage);
                
                if (!uploadResult.success) {
                    throw new Error(uploadResult.error);
                }
                
                // Send message with Cloudinary URL via socket
                socketService.sendImageMessage(chatId, {
                    imageUrl: uploadResult.url,
                    caption: messageContent || 'Image',
                    fileName: selectedImage.name
                });
                
                handleRemoveImage();
                toast.success('Image sent successfully');
            } else {
                socketService.sendMessage(chatId, messageContent);
            }
            setMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error(error.message || 'Failed to send message. Please try again.');
            // Restore message on error
            setMessage(messageContent);
        } finally {
            setUploading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate image file using Cloudinary utility
            const validation = validateImageFile(file);
            if (!validation.valid) {
                toast.error(validation.error);
                return;
            }

            setSelectedImage(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleImageUpload = () => {
        fileInputRef.current?.click();
    };

   
    return (
        <div className="border-t border-gray-200 bg-white p-4">
            {/* Image Preview */}
            {imagePreview && (
                <div className="mb-3 relative inline-block">
                    <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="max-w-32 max-h-32 rounded-lg border border-gray-300"
                    />
                    <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-end space-x-3">
                {/* Hidden File Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                />

                {/* Image Upload Button */}
                <button
                    type="button"
                    onClick={handleImageUpload}
                    className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Upload image"
                >
                    <Image className="h-5 w-5" />
                </button>

                {/* Message Input Container */}
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={connected ? "Type your message..." : "Connecting..."}
                        disabled={!connected}
                        className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                        rows="1"
                        style={{ minHeight: '40px', maxHeight: '120px' }}
                    />

                    
                </div>

                {/* Send Button */}
                <button
                    type="submit"
                    disabled={(!message.trim() && !selectedImage) || !connected || uploading}
                    className="flex-shrink-0 p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    title="Send message"
                >
                    {uploading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                        <Send className="h-5 w-5" />
                    )}
                </button>
            </form>

            {/* Connection Status */}
            {!connected && (
                <div className="mt-2 text-center">
                    <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                        Disconnected - Trying to reconnect...
                    </span>
                </div>
            )}

            {/* Character Count (optional) */}
            {message.length > 1800 && (
                <div className="mt-2 text-right">
                    <span className={`text-xs ${message.length > 2000 ? 'text-red-600' : 'text-gray-500'}`}>
                        {message.length}/2000
                    </span>
                </div>
            )}
        </div>
    );
};

export default MessageInput;