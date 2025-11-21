// server.js - Complete server configuration with JWT authentication
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
mongoose.set('bufferCommands', false);
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const path = require('path');
const fs = require('fs');
const User = require('./models/user');
const Profile = require('./models/profile');
const adminRoutes = require('./routes/adminRoutes');
const upgradeRequestRoutes = require('./routes/upgradeRequestRoutes');
const authRoutes = require('./Routes/authroutes');
const otpRoutes = require('./Routes/otproutes');
const contactRoutes = require('./routes/contactroutes');
const profileRoutes = require('./routes/profileRoutes');
const careerRoutes = require('./routes/careerRoutes');
const { generateToken } = require('./utils/generateToken');

// Initialize Passport configuration
require('./config/Passport');

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads', 'cvs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ===== CRITICAL: Enable trust proxy FIRST =====
// This must come before any rate limiting middleware
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration - Critical for authentication
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (for images like logo.png)
app.use(express.static(path.join(__dirname, 'public')));

// Silently handle apple-touch-icon requests to prevent 404 errors
app.get('/apple-touch-icon.png', (req, res) => {
  res.status(204).end();
});

app.get('/apple-touch-icon-precomposed.png', (req, res) => {
  res.status(204).end();
});

// Handle any apple-touch-icon with sizes (using route parameters)
app.get('/apple-touch-icon-:size.png', (req, res) => {
  res.status(204).end();
});


// Initialize Passport (session-less for JWT)
app.use(passport.initialize());

// Rate limiting configurations
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

const careerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // INCREASED from 3 to 50 for admin access
  message: {
    success: false,
    error: 'Too many career requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});


// Apply rate limiting
app.use(limiter);
app.use('/api/contact', contactLimiter);
app.use('/api/profile', profileLimiter);
app.use('/api/career', careerLimiter);

// Request logging middleware - Skip icon/favicon requests
app.use((req, res, next) => {
  // Skip logging for icon/favicon requests
  const skipPaths = [
    '/apple-touch-icon',
    '/favicon.ico',
    '/apple-touch-icon-precomposed'
  ];
  
  const shouldSkipLog = skipPaths.some(path => req.path.includes(path));
  
  if (!shouldSkipLog) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`, {
      authenticated: !!req.user,
      userId: req.user?._id,
      role: req.user?.role
    });
  }
  
  next();
});

// MongoDB connection
// ----- replace existing mongoose.connect(...) block with this -----
const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/startupbridge';
(async () => {
  try {
    console.log('[MongoDB] connecting to:', (mongoURI || '').replace(/\/\/.*:/, '//****:'));
    await mongoose.connect(mongoURI, {
      // modern options (do NOT include deprecated flags)
      serverSelectionTimeoutMS: 20000,  // how long to try before failing server selection
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 20,
      minPoolSize: 0,
      heartbeatFrequencyMS: 10000,
      family: 4 // force IPv4 — helpful if DNS/IPv6 issues cause instability (optional)
    });

    console.log('✅ MongoDB Connected Successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);

    // perform admin check after connect
    try {
      const adminCount = await User.countDocuments({ role: 'admin' }).exec();
      if (adminCount === 0) {
        console.log('⚠️  WARNING: No administrator accounts found!');
      } else {
        const admins = await User.find({ role: 'admin' }).select('email name').exec();
        console.log(`✅ Found ${adminCount} administrator(s):`);
        admins.forEach(admin => console.log(`   - ${admin.name} (${admin.email})`));
      }
    } catch (adminErr) {
      console.error('[MongoDB] admin check error:', adminErr);
    }
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', (error && error.message) ? error.message : error);
    console.error('💡 Tip: Check MONGODB_URI, Atlas IP whitelist, network/DNS, and credentials.');
    process.exit(1);
  }
})();

// add verbose connection listeners
mongoose.connection.on('connected', () => console.log('[MongoDB] connected'));
mongoose.connection.on('reconnected', () => console.log('[MongoDB] reconnected'));
mongoose.connection.on('disconnected', () => console.warn('[MongoDB] disconnected'));
mongoose.connection.on('close', () => console.warn('[MongoDB] connection closed'));
mongoose.connection.on('error', (err) => console.error('[MongoDB] connection error:', err && err.message ? err.message : err));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };
  
  // Check Firebase configuration
  let firebaseConfigured = false;
  try {
    const serviceAccountPath = path.join(__dirname, 'config', 'serviceAccountKey.json');
    firebaseConfigured = fs.existsSync(serviceAccountPath);
  } catch (err) {
    firebaseConfigured = false;
  }
  
  res.json({ 
    success: true,
    status: 'Server operational',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: statusMap[dbStatus] || 'Unknown',
      name: mongoose.connection.name
    },
    otpProvider: firebaseConfigured ? 'Firebase Authentication' : 'Not Configured',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// ============== AUTHENTICATION ROUTES ==============

// Auth routes (register, login, verify)
app.use('/api/auth', authRoutes);

// OTP routes (phone authentication)
app.use('/api/otp', otpRoutes);

// Google OAuth Routes with JWT
app.get('/auth/google',
  (req, res, next) => {
    console.log('=== Google OAuth Initiated ===');
    console.log('User Agent:', req.headers['user-agent']);
    console.log('Origin:', req.headers.origin);
    next();
  },
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false,
    accessType: 'offline',
    prompt: 'select_account'
  })
);

app.get('/auth/google/callback',
  (req, res, next) => {
    console.log('=== Google OAuth Callback Received ===');
    console.log('Query params:', req.query);
    console.log('Error param:', req.query.error);
    console.log('Code present:', !!req.query.code);
    
    // Handle user cancellation or errors
    if (req.query.error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      console.log('OAuth error, redirecting to:', `${frontendUrl}?error=${req.query.error}`);
      return res.redirect(`${frontendUrl}?error=${encodeURIComponent(req.query.error)}`);
    }
    
    next();
  },
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}?error=auth_failed`,
    session: false 
  }),
  (req, res) => {
    try {
      console.log('=== OAuth Success ===');
      console.log('User:', req.user.email || req.user.googleId);
      
      // Generate JWT token with user role
      const token = generateToken(req.user._id, req.user.role);
      
      const userData = {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        displayName: req.user.displayName,
        photo: req.user.photo,
        role: req.user.role,
        accountType: req.user.accountType
      };
      
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      // Detect if request is from mobile
      const userAgent = req.headers['user-agent'] || '';
      const isMobile = /android|iphone|ipad|mobile/i.test(userAgent);
      
      console.log('User Agent:', userAgent);
      console.log('Is Mobile:', isMobile);
      console.log('Redirecting to:', `${frontendUrl}/auth/callback`);
      console.log(`[GOOGLE AUTH] Callback success: ${req.user.email} (${req.user.role})`);
      
      // Build redirect URL with token and user data
      const redirectUrl = `${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}${isMobile ? '&mobile=true' : ''}`;
      
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}?error=auth_processing_failed`);
    }
  }
);

// ============== OTHER ROUTES ==============

// Contact form routes
app.use('/api/contact', contactRoutes);

// Profile routes
app.use('/api/profile', profileRoutes);

// Career routes
app.use('/api/career', careerRoutes);

// ============== ADMIN ROUTES ==============
app.use('/api/admin', adminRoutes);

// ============== UPGRADE REQUEST ROUTES ==============
app.use('/api/upgrade-requests', upgradeRequestRoutes);

// ============== SUPPORT ROUTES ==============

// Contact form submission (handled by contactRoutes)
// POST /api/contact

// ============== UTILITY ROUTES ==============

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Startup Bridge API',
    version: '2.0.0',
    authentication: 'JWT-based',
    endpoints: {
      authentication: [
        'POST /api/auth/register - Register new user',
        'POST /api/auth/login - Email/password login',
        'GET /api/auth/verify - Verify JWT token',
        'GET /auth/google - Initiate Google OAuth',
        'GET /auth/google/callback - Google OAuth callback',
        'POST /api/otp/initiate - Initiate OTP session',
        'POST /api/otp/verify - Verify OTP and authenticate',
        'POST /api/otp/check - Check if phone number exists',
        'GET /api/otp/health - OTP service health check'
      ],
      profiles: [
        'POST /api/profile - Create/update profile',
        'GET /api/profile/:userId - Get profile by user ID',
        'DELETE /api/profile/:userId - Delete profile'
      ],
      careers: [
        'POST /api/career/apply - Submit career application'
      ],
      admin: [
        'GET /api/admin/check-admin - Check admin status',
        'GET /api/admin/users - Get all users',
        'GET /api/admin/profiles - Get all profiles',
        'DELETE /api/admin/users/:id - Delete user',
        'GET /api/admin/stats - Get system statistics'
      ],
      upgradeRequests: [
        'POST /api/upgrade-requests/submit - Submit upgrade request',
        'GET /api/upgrade-requests/my-requests - Get user requests',
        'GET /api/upgrade-requests/admin/all - Get all requests (admin)',
        'POST /api/upgrade-requests/admin/:id/approve - Approve request',
        'POST /api/upgrade-requests/admin/:id/reject - Reject request'
      ],
      support: [
        'POST /api/contact - Submit contact form'
      ],
      utility: [
        'GET /api/health - Server health check',
        'GET /api - API documentation'
      ]
    }
  });
});

// ============== ERROR HANDLING ==============

// 404 handler
app.use((req, res, next) => {
  console.log(`❌ 404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    error: 'Route not found',
    requestedUrl: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', err);
  
  // Multer file upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: 'File size must be less than 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      error: 'File upload error',
      message: err.message
    });
  }
  
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
    message: err.message || 'Internal server error',
    error: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack
    })
  });
});

// ============== SERVER INITIALIZATION ==============

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('\n' + '═'.repeat(50));
  console.log('🚀 SERVER STARTED SUCCESSFULLY');
  console.log('═'.repeat(50));
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`👨‍💼 Admin Panel: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin`);
  console.log(`🔐 Authentication: JWT-based (No sessions)`);
  console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api`);
  console.log(`📁 Database: ${process.env.MONGODB_URI ? 'Remote MongoDB' : 'Local MongoDB'}`);
  console.log('');
  
  // Check Firebase configuration
  let firebaseConfigured = false;
  try {
    const serviceAccountPath = path.join(__dirname, 'config', 'serviceAccountKey.json');
    firebaseConfigured = fs.existsSync(serviceAccountPath);
  } catch (err) {
    firebaseConfigured = false;
  }
  
  if (firebaseConfigured) {
    console.log('🔥 OTP Provider: Firebase Authentication (Configured)');
  } else {
    console.log('🔥 OTP Provider: Firebase Authentication (Not Configured)');
    console.log('   ⚠️  Download serviceAccountKey.json from Firebase Console');
    console.log('   📁 Place it in: back-end/config/serviceAccountKey.json');
  }
  
  console.log('');
  console.log('📋 Available API Routes:');
  console.log('   Authentication:');
  console.log('   - POST   /api/auth/register       (Email/Password Register)');
  console.log('   - POST   /api/auth/login          (Email/Password Login)');
  console.log('   - GET    /api/auth/verify         (Verify JWT Token)');
  console.log('   - GET    /auth/google             (Google OAuth)');
  console.log('   - GET    /auth/google/callback    (Google OAuth Callback)');
  console.log('');
  console.log('   OTP Authentication (Firebase):');
  console.log('   - POST   /api/otp/initiate        (Initiate OTP Session)');
  console.log('   - POST   /api/otp/verify          (Verify Firebase Token & Login)');
  console.log('   - POST   /api/otp/check           (Check Phone Number)');
  console.log('   - GET    /api/otp/health          (OTP Service Health Check)');
  console.log('');
  console.log('   Profile Management:');
  console.log('   - POST   /api/profile             (Create/Update Profile)');
  console.log('   - GET    /api/profile/:userId     (Get User Profile)');
  console.log('   - DELETE /api/profile/:userId     (Delete Profile)');
  console.log('');
  console.log('   Career Applications:');
  console.log('   - POST   /api/career/apply        (Submit Career Application)');
  console.log('');
  console.log('   Admin Panel:');
  console.log('   - GET    /api/admin/users         (Get All Users)');
  console.log('   - GET    /api/admin/profiles      (Get All Profiles)');
  console.log('   - GET    /api/admin/stats         (System Statistics)');
  console.log('');
  console.log('   Other:');
  console.log('   - POST   /api/contact             (Contact Form)');
  console.log('   - GET    /api/health              (Server Health Check)');
  console.log('   - GET    /api                     (API Documentation)');
  console.log('');
  console.log('🔒 Rate Limits Applied:');
  console.log('   - General: 100 requests / 15 min');
  console.log('   - Auth Register/Login: 5 requests / 15 min');
  console.log('   - OTP Initiate: 10 requests / 15 min');
  console.log('   - OTP Verify: 15 requests / 15 min');
  console.log('   - Contact Form: 5 requests / hour');
  console.log('   - Profile: 20 requests / 15 min');
  console.log('   - Career Applications: 3 requests / hour');
  console.log('');
  console.log('📱 Firebase Integration:');
  console.log('   - Client-side OTP sending (via Firebase SDK)');
  console.log('   - Backend token verification (Firebase Admin SDK)');
  console.log('   - reCAPTCHA protection included');
  console.log('   - No SMS API costs');
  console.log('');
  console.log('📁 File Uploads:');
  console.log('   - CV uploads directory: uploads/cvs/');
  console.log('   - Max file size: 5MB');
  console.log('   - Allowed formats: PDF, DOC, DOCX');
  console.log('═'.repeat(50) + '\n');
});

// ============== PROCESS HANDLERS ==============

// ============== PROCESS HANDLERS ==============
let shuttingDown = false;

async function closeServer() {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log('⚠️  Starting graceful shutdown...');

  // safety: force exit after timeout if things hang
  const forceExitTimeout = setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout.');
    process.exit(1);
  }, 10000); // 10s

  try {
    // 1) stop accepting new connections
    if (server && server.close) {
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            console.error('Error closing HTTP server:', err);
            return reject(err);
          }
          console.log('✅ HTTP server closed.');
          resolve();
        });
      });
    } else {
      console.warn('⚠️  No HTTP server to close.');
    }
  } catch (err) {
    console.error('❌ Failed to close HTTP server:', err);
    // continue to attempt DB close
  }

  try {
    // 2) Close mongoose connections (use disconnect which returns a Promise)
    //    Avoid passing callbacks to .close()
    await mongoose.disconnect();
    console.log('✅ MongoDB connection closed.');
  } catch (err) {
    console.error('❌ Error while closing MongoDB connection:', err);
  } finally {
    clearTimeout(forceExitTimeout);
    console.log('Shutdown complete. Exiting.');
    process.exit(0);
  }
}

// Signals
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received.');
  closeServer().catch((err) => {
    console.error('Error during SIGTERM shutdown:', err);
    process.exit(1);
  });
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT received (Ctrl+C).');
  closeServer().catch((err) => {
    console.error('Error during SIGINT shutdown:', err);
    process.exit(1);
  });
});

// Unhandled rejections & exceptions — attempt graceful shutdown then exit non-zero
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection at:', promise, 'reason:', reason);
  // try to shutdown gracefully; then exit with failure code
  closeServer().catch((err) => {
    console.error('Error during unhandledRejection shutdown:', err);
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception thrown:', err);
  // attempt graceful shutdown, then exit non-zero
  closeServer().catch((shutdownErr) => {
    console.error('Error during uncaughtException shutdown:', shutdownErr);
    // ensure process exits
  }).finally(() => process.exit(1));
});


module.exports = app;