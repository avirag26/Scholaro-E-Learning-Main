import mongoose from 'mongoose';
import Lesson from '../Model/LessonModel.js';
import dotenv from 'dotenv';

dotenv.config();

const addFinalLessonField = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Update all lessons that don't have the isFinalLesson field
    const result = await Lesson.updateMany(
      { isFinalLesson: { $exists: false } },
      { $set: { isFinalLesson: false } }
    );

    console.log(`Updated ${result.modifiedCount} lessons with isFinalLesson field`);

    // Also ensure isPublished field exists and is set to true for existing lessons
    const publishResult = await Lesson.updateMany(
      { isPublished: { $exists: false } },
      { $set: { isPublished: true } }
    );

    console.log(`Updated ${publishResult.modifiedCount} lessons with isPublished field`);

    // Update courses to add examSettings if missing
    const { Course } = await import('../Model/CourseModel.js');
    const courseResult = await Course.updateMany(
      { examSettings: { $exists: false } },
      { 
        $set: { 
          examSettings: {
            isEnabled: false,
            finalLessonId: null,
            autoEnableAfterAllLessons: false
          }
        } 
      }
    );

    console.log(`Updated ${courseResult.modifiedCount} courses with examSettings field`);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the migration
addFinalLessonField();