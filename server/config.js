require('dotenv').config();
const jwt = require('jsonwebtoken');

// JWT debugging function
const debugToken = (token) => {
  try {
    const decoded = jwt.decode(token);
    console.log('Token contents (without verification):', decoded);
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error.message);
    return null;
  }
};

module.exports = {
  // JWT Secret - use environment variable or fallback to a default for development
  jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret_for_development',
  
  // Server configuration
  server: {
    port: process.env.PORT || 5000
  },
  
  // Utility functions
  debugToken
};