const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morganMiddleware = require('./middleware/logging.middleware');
const errorHandler = require('./middleware/errorHandling.middleware');
const { apiLimiter } = require('./middleware/rateLimiting.middleware');
const requestIdMiddleware = require('./middleware/requestId.middleware');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(requestIdMiddleware);
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(morganMiddleware);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'SDS Test System API is running', timestamp: new Date().toISOString() });
});

// API base
app.get('/api/v1', (req, res) => {
  res.json({ message: 'Welcome to SDS Test System API', version: '1.0.0' });
});

// Security headers after basic middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' }
}));

// API rate limiter
app.use('/api/v1', apiLimiter);

// Routes
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const assessmentRoutes = require('./routes/assessment.routes');
const resultRoutes = require('./routes/result.routes');
const institutionRoutes = require('./routes/institution.routes');
const counselorRoutes = require('./routes/counselor.routes');
const qualificationRoutes = require('./routes/qualification.routes');
const occupationRoutes = require('./routes/occupation.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const courseRoutes = require('./routes/course.routes');
const reportRoutes = require('./routes/report.routes');
const glossaryRoutes = require('./routes/glossary.routes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/assessments', assessmentRoutes);
app.use('/api/v1/results', resultRoutes);
app.use('/api/v1/institutions', institutionRoutes);
app.use('/api/v1/counselor', counselorRoutes);
app.use('/api/v1/qualifications', qualificationRoutes);
app.use('/api/v1/occupations', occupationRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/glossary', glossaryRoutes);

// Error handling
app.use(errorHandler);

module.exports = app;
