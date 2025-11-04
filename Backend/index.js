import express from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors'; 
import connectDB from './Config/db.js';
import { initializeSocket } from './Config/socket.js';
import paymentDistributionService from './services/paymentDistributionService.js';
dotenv.config();
import UserRoutes from './Routes/userRoute.js';
import TutorRoutes from './Routes/tutorRoute.js';
import AdminRoutes from './Routes/adminRoute.js'; 

const port = process.env.PORT || 5000;

// Connect to database
connectDB();

// Create Express app
const app = express();

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Make io available to routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', 
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files for uploads
app.use('/uploads', express.static('uploads'));

// Routes
app.get('/', (req, res) => {
  res.send('API is running with Socket.IO support....');
});

app.use('/api/users', UserRoutes);
app.use('/api/tutors', TutorRoutes);
app.use('/api/admin', AdminRoutes);

// Start server
server.listen(port, () => {
  console.log(` Server running on http://localhost:${port}`);
  console.log(` Socket.IO server initialized`);
  
  // Start payment distribution cron job
  paymentDistributionService.startCronJob();
  console.log(` Payment distribution cron job started`);
});
