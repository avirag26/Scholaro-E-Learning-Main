import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors'; 
import connectDB from './Config/db.js';
dotenv.config();
import UserRoutes from './Routes/userRoute.js';
import TutorRoutes from './Routes/tutorRoute.js';
import AdminRoutes from './Routes/adminRoute.js'; 
const port  = process.env.PORT || 5000;
connectDB();
const app= express();
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.get('/', (req, res) => {
  res.send('API is running....');
});
app.use('/api/users',UserRoutes)
app.use('/api/tutors', TutorRoutes)
app.use('/api/admin', AdminRoutes);
app.listen(port, () => console.log(`? Server running on http://localhost:${port}`));
