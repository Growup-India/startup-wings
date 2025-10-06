const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();
require('./config/Passport');

const authRoutes = require('./routes/authroutes');
const contactRoutes = require('./routes/contactroutes');
const otpRoutes = require('./routes/otproutes');
const profileRoutes = require('./routes/profileroutes');
const { generateToken } = require('./utils/generateToken');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Session configuration (must be before passport initialization)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-here',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 contact submissions per hour
  message: {
    success: false,
    error: 'Too many contact form submissions, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const profileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 profile requests per window
  message: {
    success: false,
    error: 'Too many profile requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting
app.use(limiter);
app.use('/api/contact', contactLimiter);
app.use('/api/profile', profileLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/startupbridge')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    console.log(`📊 Database: ${mongoose.connection.name}`);
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// MongoDB connection event listeners
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const fast2smsConfigured = !!process.env.FAST2SMS_API_KEY;
  
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    database: dbStatus,
    smsProvider: fast2smsConfigured ? 'Fast2SMS' : 'Mock (Development)',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Google OAuth Routes
app.get("/auth/google", passport.authenticate("google", {
  scope: ["profile", "email"],
  session: false
}));

app.get("/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:3000"}?error=auth_failed`,
    session: false
  }),
  (req, res) => {
    try {
      // Generate JWT token
      const token = generateToken(req.user._id);
      
      // Prepare user data
      const userData = {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        displayName: req.user.displayName,
        photo: req.user.photo,
        role: req.user.role
      };
      
      // Redirect to frontend with token and user data
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}?error=auth_failed`);
    }
  }
);

// Get current authenticated user (for session-based auth if needed)
app.get("/api/current_user", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      error: 'Not authenticated' 
    });
  }
  res.json(req.user);
});

// Logout route
app.get("/auth/logout", (req, res) => {
  req.logout(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ 
        success: false,
        error: 'Logout failed' 
      });
    }
    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/profile', profileRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: errors.join(', ')
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      error: 'Duplicate Error',
      message: `${field} already exists`
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired'
    });
  }
  
  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format'
    });
  }
  
  // Default error response
  res.status(err.status || 500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  mongoose.connection.close(false, () => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  mongoose.connection.close(false, () => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`💾 Database: ${process.env.MONGODB_URI ? 'Remote MongoDB' : 'Local MongoDB'}`);
  
  // Check Fast2SMS configuration
  const fast2smsConfigured = !!process.env.FAST2SMS_API_KEY;
  if (fast2smsConfigured) {
    console.log('📱 SMS Provider: Fast2SMS (Enabled)');
  } else {
    console.log('📱 SMS Provider: Mock OTP (Development Mode)');
    console.log('   ⚠️  Set FAST2SMS_API_KEY in .env to enable real SMS');
  }
  
  // Display available routes
  console.log('');
  console.log('📋 Available API Routes:');
  console.log('   Authentication:');
  console.log('   - POST   /api/auth/register       (Email/Password Register)');
  console.log('   - POST   /api/auth/login          (Email/Password Login)');
  console.log('   - GET    /auth/google             (Google OAuth)');
  console.log('   - GET    /auth/google/callback    (Google OAuth Callback)');
  console.log('   - GET    /auth/logout             (Logout)');
  console.log('');
  console.log('   OTP Authentication:');
  console.log('   - POST   /api/otp/send            (Send OTP to Mobile)');
  console.log('   - POST   /api/otp/verify          (Verify OTP & Login)');
  console.log('   - POST   /api/otp/resend          (Resend OTP)');
  console.log('   - GET    /api/otp/health          (OTP Service Health Check)');
  console.log('');
  console.log('   Profile Management:');
  console.log('   - POST   /api/profile             (Create/Update Profile)');
  console.log('   - GET    /api/profile/:userId     (Get User Profile)');
  console.log('   - DELETE /api/profile/:userId     (Delete Profile)');
  console.log('');
  console.log('   Other:');
  console.log('   - POST   /api/contact             (Contact Form)');
  console.log('   - GET    /api/health              (Server Health Check)');
  console.log('   - GET    /api/current_user        (Get Current User)');
  console.log('');
  console.log('🔒 Rate Limits Applied:');
  console.log('   - General: 100 requests / 15 min');
  console.log('   - OTP Send: 5 requests / 15 min');
  console.log('   - OTP Verify: 10 requests / 15 min');
  console.log('   - Contact Form: 5 requests / hour');
  console.log('   - Profile: 20 requests / 15 min');
  console.log('═══════════════════════════════════════════════════');
});