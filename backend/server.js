const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler } = require('./utils/errorHandler');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Import auth controller and middleware
const authController = require('./controllers/authController');

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', true);
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/firs', require('./routes/firRoutes'));
app.use('/api/disposal', require('./routes/disposalRoutes'));
app.use('/api/performance-report', require('./routes/performanceRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FIRFlow API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to FIRFlow API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      health: '/api/health'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
});
