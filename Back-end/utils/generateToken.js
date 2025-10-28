const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  const payload = {
    id: userId,
    iat: Math.floor(Date.now() / 1000)
  };

  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d', // Token expires in 7 days by default
  };

  const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';

  return jwt.sign(payload, secret, options);
};

const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';
  return jwt.verify(token, secret);
};

const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken
};