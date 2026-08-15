import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import apiRoutes from './routes';

import rateLimit from 'express-rate-limit';
import { upload, uploadImage } from './controllers/upload.controller';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Tailor backend is running',
    health: '/api/health',
    timestamp: new Date().toISOString()
  });
});

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests' }
});

// Connect DB middleware for Vercel serverless
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    await connectDB();
  }
  next();
});

// Apply rate limiter to auth, sync, and admin API
app.use('/api/auth', limiter);
app.use('/api/sync', limiter);
app.use('/api/admin', limiter);

// Image Upload API (Cloudinary)
app.post('/api/upload', upload.single('image'), uploadImage);

// API Routes
app.use('/api', apiRoutes);

// Connect DB & Start Server (Local Development)
if (process.env.NODE_ENV !== 'production') {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`[Backend] Server running on port ${PORT}`);
    });
  });
}

export default app;
module.exports = app;
