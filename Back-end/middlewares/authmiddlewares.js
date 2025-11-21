// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/user');

/**
 * Helper - respond with a DB-unavailable error when mongoose is not connected.
 */
const dbUnavailable = (res) => {
  return res.status(503).json({
    success: false,
    error: 'Service Unavailable - database not connected'
  });
};

/**
 * Mask token for logs
 */
const maskToken = (t = '') => {
  if (!t) return '';
  if (t.length <= 12) return '****';
  return `${t.slice(0, 6)}...${t.slice(-4)}`;
};

/**
 * JWT token verification middleware
 * - returns 401 for missing/invalid/expired tokens
 * - returns 503 if DB isn't connected
 * - returns 500 for unexpected DB errors
 */
const verifyToken = async (req, res, next) => {
  try {
    // Quick DB availability check — avoids triggering Mongoose buffering
    if (mongoose.connection.readyState !== 1) {
      console.warn('[verifyToken] Rejecting request because DB is not connected (state=%s)', mongoose.connection.readyState);
      return dbUnavailable(res);
    }

    // Accept token from:
    // - Authorization header (preferred)
    // - req.headers.authorization (redundant, but safe)
    // - cookie token (if later used)
    let token = req.header('Authorization') || req.headers['authorization'] || (req.cookies && req.cookies.token);

    if (!token) {
      console.warn('[verifyToken] No Authorization header sent');
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    // Log masked token (for debugging; avoid printing whole token)
    if (typeof token === 'string') {
      console.log('[verifyToken] Received Authorization header:', maskToken(token));
    } else {
      console.log('[verifyToken] Received Authorization header (non-string)');
    }

    // Remove "Bearer " prefix if present
    if (typeof token === 'string' && token.startsWith('Bearer ')) {
      token = token.substring(7).trim();
    }

    if (!token || typeof token !== 'string') {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Invalid token format.'
      });
    }

    // Verify token (synchronous throws on invalid/expired tokens)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    } catch (jwtErr) {
      console.error('[verifyToken] JWT verification failed:', jwtErr.message);
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, error: 'Token expired' });
      }
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    // DB call wrapped in try/catch and uses exec() to return real Promise
    let user;
    try {
      user = await User.findById(decoded.id).exec();
    } catch (dbErr) {
      console.error('[verifyToken] DB error while finding user:', dbErr);
      // Treat as service unavailable because DB failed during operation
      return dbUnavailable(res);
    }

    if (!user || !user.isActive) {
      console.warn('[verifyToken] Token valid but user not found or inactive (id=%s)', decoded.id);
      return res.status(401).json({
        success: false,
        error: 'Invalid token or user not found'
      });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('[verifyToken] Unexpected error:', error);
    // fallback
    res.status(500).json({
      success: false,
      error: 'Token verification failed'
    });
  }
};

/**
 * Admin role check middleware
 */
const isAdmin = (req, res, next) => {
  // If verifyToken wasn't used earlier, req.user might be undefined
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. Authentication required.'
    });
  }

  if (req.user && req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'Access denied. Admin role required.'
  });
};

/**
 * Registration validation middleware (unchanged)
 */
const validateRegister = (req, res, next) => {
  const { name, email, password, confirmPassword } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters');
  }
  if (name && name.trim().length > 50) {
    errors.push('Name cannot exceed 50 characters');
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('Valid email is required');
  }

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  if (password && password.length > 100) {
    errors.push('Password cannot exceed 100 characters');
  }

  if (password !== confirmPassword) {
    errors.push('Passwords do not match');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      messages: errors
    });
  }

  next();
};

/**
 * Login validation middleware (unchanged)
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email) {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      errors.push('Valid email is required');
    }
  }

  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      messages: errors
    });
  }

  next();
};

module.exports = {
  verifyToken,
  isAdmin,
  validateRegister,
  validateLogin
};
