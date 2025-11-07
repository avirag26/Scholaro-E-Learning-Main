import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../Model/usermodel.js';
import { Course } from '../Model/CourseModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const updateUserProgress = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find all courses with exams enabled
        const coursesWithExams = await Course.find({
            'examSettings.isEnabled': true
        });

        console.log(`\n=== COURSES WITH EXAMS ===`);
        coursesWithExams.forEach((course, index) => {
            console.log(`${index + 1}. ${course.title} (${course._id})`);
        });

        // Update user progress for all courses with exams
        const currentUserId = '690d76c0c1175d2752d50f77';
        const currentCourseId = '68fa0a9101a16fa3888ae7e3';

        const user = await User.findById(currentUserId);

        if (!user) {
            console.log('User not found');
            return;
        }

        console.log(`\n=== UPDATING PROGRESS FOR USER: ${user.full_name} ===`);
        console.log(`Current course ID: ${currentCourseId}`);

        // First, update the current course specifically
        const currentCourse = await Course.findById(currentCourseId);
        if (currentCourse) {
            const enrollmentIndex = user.courses.findIndex(c => c.course.toString() === currentCourseId);

            if (enrollmentIndex === -1) {
                // User not enrolled, add enrollment with 100% progress
                user.courses.push({
                    course: currentCourseId,
                    enrollmentDate: new Date(),
                    progress: 100,
                    completionStatus: true
                });
                console.log(`✅ Added enrollment for CURRENT COURSE: ${currentCourse.title} with 100% progress`);
            } else {
                // User already enrolled, update progress
                user.courses[enrollmentIndex].progress = 100;
                user.courses[enrollmentIndex].completionStatus = true;
                console.log(`✅ Updated CURRENT COURSE: ${currentCourse.title} to 100% progress`);
            }
        }

        // Then update all other courses with exams
        for (const course of coursesWithExams) {
            if (course._id.toString() === currentCourseId) continue; // Skip current course, already handled

            const enrollmentIndex = user.courses.findIndex(c => c.course.toString() === course._id.toString());

            if (enrollmentIndex === -1) {
                // User not enrolled, add enrollment with 100% progress
                user.courses.push({
                    course: course._id,
                    enrollmentDate: new Date(),
                    progress: 100,
                    completionStatus: true
                });
                console.log(`✅ Added enrollment for ${course.title} with 100% progress`);
            } else {
                // User already enrolled, update progress
                user.courses[enrollmentIndex].progress = 100;
                user.courses[enrollmentIndex].completionStatus = true;
                console.log(`✅ Updated ${course.title} to 100% progress`);
            }
        }

        await user.save();
        console.log('\n✅ All course progress updated successfully!');

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

updateUserProgress();