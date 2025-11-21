import express from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import connectDB from './Config/db.js';
import { initializeSocket } from './Config/socket.js';
import paymentDistributionService from './services/paymentDistributionService.js';
import logger from './utils/logger.js';
import requestLogger from './Middleware/requestLogger.js';
dotenv.config();
import UserRoutes from './Routes/userRoute.js';
import TutorRoutes from './Routes/tutorRoute.js';
import AdminRoutes from './Routes/adminRoute.js';
import { errorHandler, notFound } from './Middleware/errorHandler.js';

const port = process.env.PORT || 5000;


connectDB();


const app = express();


const server = createServer(app);

const io = initializeSocket(server);

app.set('io', io);

// Connect Socket.IO to notification system
import { setSocketIO } from './utils/notificationHelper.js';
setSocketIO(io);


app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use(requestLogger);




app.get('/', (req, res) => {
  res.send('API is running with Socket.IO support....');
});

app.use('/api/users', UserRoutes);
app.use('/api/tutors', TutorRoutes);
app.use('/api/admin', AdminRoutes);


app.use(notFound);
app.use(errorHandler);

// Start server
server.listen(port, () => {
  logger.info(` Server is running on port ${port}`);
  logger.info(` Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(` Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  paymentDistributionService.startCronJob();
});
