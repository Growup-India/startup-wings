// utils/generateToken.js - Updated with role in JWT payload
const jwt = require('jsonwebtoken');

const generateToken = (userId, userRole = 'user') => {
  const payload = {
    id: userId,
    role: userRole, // Include role in JWT payload
    iat: Math.floor(Date.now() / 1000)
  };

  const options = {
    expiresIn: '7d' // Token expires in 7 days
  };

  const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';

  return jwt.sign(payload, secret, options);
};

const verifyToken = (token) => {
  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

const getRoleFromToken = (token) => {
  try {
    const decoded = jwt.decode(token);
    return decoded?.role || 'user';
  } catch (error) {
    return 'user';
  }
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  getRoleFromToken
};