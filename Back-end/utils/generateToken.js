const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  const payload = {
    id: userId,
    iat: Math.floor(Date.now() / 1000)
  };

  const options = {
    expiresIn: '1h' // Token expires in 1 hour
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