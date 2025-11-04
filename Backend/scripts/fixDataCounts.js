import mongoose from 'mongoose';
import User from '../Model/usermodel.js';
import { Course } from '../Model/CourseModel.js';
import Tutor from '../Model/TutorModel.js';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const fixDataCounts = async () => {
  try {
    console.log('Starting data count fix...');

    // Fix course enrolled_count
    console.log('Fixing course enrolled counts...');
    const courses = await Course.find();
    let courseCount = 0;
    
    for (const course of courses) {
      const actualCount = await User.countDocuments({
        'courses.course': course._id
      });
      
      await Course.findByIdAndUpdate(course._id, {
        enrolled_count: actualCount
      });
      
      courseCount++;
      if (courseCount % 10 === 0) {
        console.log(`Processed ${courseCount}/${courses.length} courses`);
      }
    }
    
    console.log(`Fixed enrolled_count for ${courses.length} courses`);

    // Fix tutor student_count and total_enrollments
    console.log('Fixing tutor stats...');
    const tutors = await Tutor.find().populate('courses');
    let tutorCount = 0;
    
    for (const tutor of tutors) {
      const courseIds = tutor.courses.map(c => c._id);
      
      // Count unique students
      const uniqueStudents = await User.aggregate([
        { $match: { 'courses.course': { $in: courseIds } } },
        { $group: { _id: '$_id' } },
        { $count: 'total' }
      ]);
      
      // Count total enrollments
      const totalEnrollments = await User.countDocuments({
        'courses.course': { $in: courseIds }
      });
      
      await Tutor.findByIdAndUpdate(tutor._id, {
        student_count: uniqueStudents[0]?.total || 0,
        total_enrollments: totalEnrollments
      });
      
      tutorCount++;
      console.log(`Processed tutor ${tutorCount}/${tutors.length}: ${tutor.full_name} - Students: ${uniqueStudents[0]?.total || 0}, Enrollments: ${totalEnrollments}`);
    }
    
    console.log(`Fixed stats for ${tutors.length} tutors`);
    console.log('Data count fix completed successfully!');
    
  } catch (error) {
    console.error('Error fixing counts:', error);
  }
};

const main = async () => {
  await connectDB();
  await fixDataCounts();
  process.exit(0);
};

main();