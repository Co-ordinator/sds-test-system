const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morganMiddleware = require('./middleware/morgan');
const errorMiddleware = require('./middleware/errorMiddleware');
const logger = require('./utils/logger');
require('dotenv').config();

const app = express();

// Log server startup
logger.info('Starting SDS Test System API server');

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(morganMiddleware); // HTTP request logging
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database setup
const setupDatabase = require('./config/setupDatabase');
setupDatabase();

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'SDS Test System API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes will be added here
app.get('/api/v1', (req, res) => {
  res.json({
    message: 'Welcome to SDS Test System API',
    version: '1.0.0'
  });
});

// Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const resultRoutes = require('./routes/resultRoutes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/results', resultRoutes);

// Error handling (must be last middleware)
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});
