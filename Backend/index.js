import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import connectDB from './Config/db.js';
dotenv.config();

import UserRoutes from './Routes/userRoute.js';
import TutorRoutes from './Routes/tutorRoute.js';

const port  = process.env.PORT || 5000;
connectDB();

const app= express();

app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser middleware
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('API is running....');
});


//Use routes
app.use('/api/users',UserRoutes)
app.use('/api/tutors',TutorRoutes)
app.listen(port, () => console.log(`✅ Server running on http://localhost:${port}`));