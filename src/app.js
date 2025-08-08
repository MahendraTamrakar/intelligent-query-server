// server.js (combined app + server)
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';

import hackrxRoutes from "./routes/hackrxRoutes.js";
import documentRoutes from './routes/documentRoutes.js';
import queryRoutes from './routes/queryRoutes.js';
import { settings } from './config/settings.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// File uploads
const upload = multer();

// Routes
app.use('/documents', documentRoutes);
app.use('/query', queryRoutes);
app.use('/hackrx', hackrxRoutes);

// MongoDB connection
mongoose.connect(settings.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Start server
const PORT = settings.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
