import mongoose from 'mongoose';
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

const migrateSubjects = async () => {
  try {
    console.log('Starting subjects migration...');

    // Find all tutors with string subjects
    const tutors = await Tutor.find({
      subjects: { $type: "string" }
    });

    console.log(`Found ${tutors.length} tutors with string subjects`);

    let migrated = 0;

    for (const tutor of tutors) {
      try {
        let subjectsArray = [];
        
        if (tutor.subjects && typeof tutor.subjects === 'string') {
          // Split comma-separated string and clean up
          subjectsArray = tutor.subjects
            .split(',')
            .map(subject => subject.trim())
            .filter(subject => subject.length > 0);
        }

        // Update the tutor with array of subjects
        await Tutor.findByIdAndUpdate(tutor._id, {
          subjects: subjectsArray
        });

        console.log(`Migrated tutor ${tutor.full_name}: "${tutor.subjects}" → [${subjectsArray.join(', ')}]`);
        migrated++;

      } catch (error) {
        console.error(`Error migrating tutor ${tutor._id}:`, error);
      }
    }

    console.log(`Migration completed! Migrated ${migrated} tutors.`);
    
  } catch (error) {
    console.error('Migration error:', error);
  }
};

// Run migration
const runMigration = async () => {
  await connectDB();
  await migrateSubjects();
  process.exit(0);
};

runMigration();