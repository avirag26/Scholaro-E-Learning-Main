import User from '../../Model/usermodel.js';
import Lesson from '../../Model/LessonModel.js';
import { Course } from '../../Model/CourseModel.js';
import { generateSignedVideoUrl, extractPublicIdFromUrl } from '../../config/cloudinary.js';

// Get secure video URL for enrolled users
export const getSecureVideoUrl = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const userId = req.user._id;

        // Get lesson details
        const lesson = await Lesson.findById(lessonId).populate('course');
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        // Check if lesson has a video
        if (!lesson.videoUrl) {
            return res.status(404).json({
                success: false,
                message: 'No video available for this lesson'
            });
        }

        // Verify user enrollment
        const user = await User.findById(userId);
        const enrollment = user.courses.find(c => c.course.toString() === lesson.course._id.toString());

        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: 'You are not enrolled in this course'
            });
        }

        // Check if course is active and not banned
        const course = await Course.findById(lesson.course._id);
        if (!course || !course.isActive || course.isBanned) {
            return res.status(403).json({
                success: false,
                message: 'Course is not available'
            });
        }

        // Extract public ID from Cloudinary URL
        const publicId = extractPublicIdFromUrl(lesson.videoUrl);
        if (!publicId) {
            // If we can't extract public ID, return original URL (fallback)
            return res.status(200).json({
                success: true,
                videoUrl: lesson.videoUrl,
                expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
                isSecure: false
            });
        }

        try {
            // Generate signed URL with 2-hour expiration
            const signedUrl = generateSignedVideoUrl(publicId, {
                expires_at: Math.floor(Date.now() / 1000) + (2 * 60 * 60), // 2 hours
                transformation: [
                    { quality: 'auto' },
                    { fetch_format: 'auto' }
                ]
            });

            // Update lesson view count
            lesson.views = (lesson.views || 0) + 1;
            await lesson.save();

            res.status(200).json({
                success: true,
                videoUrl: signedUrl,
                expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
                isSecure: true,
                lesson: {
                    id: lesson._id,
                    title: lesson.title,
                    duration: lesson.duration,
                    views: lesson.views
                }
            });

        } catch (signError) {
            console.error('Error generating signed URL:', signError);

            // Fallback to original URL if signing fails
            res.status(200).json({
                success: true,
                videoUrl: lesson.videoUrl,
                expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
                isSecure: false,
                warning: 'Using fallback URL - signing failed'
            });
        }

    } catch (error) {
        console.error('Error getting secure video URL:', error);
        res.status(500).json({
            success: false,
            message: 'Error accessing video',
            error: error.message
        });
    }
};

// Get lesson details with secure video URL
export const getLessonWithSecureVideo = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const userId = req.user._id;

        // Get lesson details
        const lesson = await Lesson.findById(lessonId)
            .populate('course', 'title description tutor isActive isBanned')
            .populate('tutor', 'full_name');

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        // Verify user enrollment
        const user = await User.findById(userId);
        const enrollment = user.courses.find(c => c.course.toString() === lesson.course._id.toString());

        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: 'You are not enrolled in this course'
            });
        }

        // Check if course is active
        if (!lesson.course.isActive || lesson.course.isBanned) {
            return res.status(403).json({
                success: false,
                message: 'Course is not available'
            });
        }

        // Prepare lesson data
        const lessonData = {
            id: lesson._id,
            title: lesson.title,
            description: lesson.description,
            duration: lesson.duration,
            thumbnailUrl: lesson.thumbnailUrl,
            pdfUrl: lesson.pdfUrl,
            order: lesson.order,
            views: lesson.views,
            createdAt: lesson.createdAt,
            course: {
                id: lesson.course._id,
                title: lesson.course.title,
                description: lesson.course.description
            },
            tutor: {
                id: lesson.tutor._id,
                name: lesson.tutor.full_name
            },
            isCompleted: enrollment.completedLessons.includes(lessonId)
        };

        // Add secure video URL if video exists
        if (lesson.videoUrl) {
            const publicId = extractPublicIdFromUrl(lesson.videoUrl);

            if (publicId) {
                try {
                    const signedUrl = generateSignedVideoUrl(publicId);
                    lessonData.videoUrl = signedUrl;
                    lessonData.videoExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
                    lessonData.isSecureVideo = true;
                } catch (signError) {
                    console.error('Error generating signed URL:', signError);
                    lessonData.videoUrl = lesson.videoUrl;
                    lessonData.isSecureVideo = false;
                }
            } else {
                lessonData.videoUrl = lesson.videoUrl;
                lessonData.isSecureVideo = false;
            }

            // Update view count
            lesson.views = (lesson.views || 0) + 1;
            await lesson.save();
        }

        res.status(200).json({
            success: true,
            lesson: lessonData
        });

    } catch (error) {
        console.error('Error getting lesson with secure video:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching lesson details',
            error: error.message
        });
    }
};

// Refresh expired video URL
export const refreshVideoUrl = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const userId = req.user._id;

        // Get lesson details
        const lesson = await Lesson.findById(lessonId);
        if (!lesson || !lesson.videoUrl) {
            return res.status(404).json({
                success: false,
                message: 'Lesson or video not found'
            });
        }

        // Verify user enrollment
        const user = await User.findById(userId);
        const enrollment = user.courses.find(c => c.course.toString() === lesson.course.toString());

        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: 'You are not enrolled in this course'
            });
        }

        // Generate new signed URL
        const publicId = extractPublicIdFromUrl(lesson.videoUrl);
        if (!publicId) {
            return res.status(200).json({
                success: true,
                videoUrl: lesson.videoUrl,
                isSecure: false
            });
        }

        try {
            const signedUrl = generateSignedVideoUrl(publicId);

            res.status(200).json({
                success: true,
                videoUrl: signedUrl,
                expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
                isSecure: true
            });
        } catch (signError) {
            res.status(200).json({
                success: true,
                videoUrl: lesson.videoUrl,
                isSecure: false
            });
        }

    } catch (error) {
        console.error('Error refreshing video URL:', error);
        res.status(500).json({
            success: false,
            message: 'Error refreshing video URL',
            error: error.message
        });
    }
};