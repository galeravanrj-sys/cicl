const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');
const db = require('../db');
require('dotenv').config();

module.exports = async function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');
  
  // Also check Authorization header as a fallback
  const authHeader = req.header('Authorization');
  let finalToken = token;
  
  if (!finalToken && authHeader && authHeader.startsWith('Bearer ')) {
    finalToken = authHeader.substring(7);
    console.log('Using token from Authorization header');
  }

  // Check if no token
  if (!finalToken) {
    console.log('No auth token provided in request');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    console.log('Verifying token...');
    const secret = jwtSecret; // Use unified JWT secret from config
    const decoded = jwt.verify(finalToken, secret);
    
    // Log successful verification
    console.log('Token verified successfully for user:', decoded.user ? decoded.user.id : 'unknown');
    
    // Enforce active session: token must be present in active_sessions and not expired
    try {
      const userId = decoded.user ? decoded.user.id : decoded.id;
      const sessionCheck = await db.query(
        'SELECT 1 FROM active_sessions WHERE user_id = $1 AND token = $2 AND expires_at > NOW()',
        [userId, finalToken]
      );
      if (sessionCheck.rows.length === 0) {
        return res.status(401).json({ message: 'Session is not active or has been terminated' });
      }
    } catch (e) {
      console.warn('Active session validation failed:', e.message);
      // Fail safe: deny access if we cannot confirm session
      return res.status(401).json({ message: 'Unable to validate session' });
    }

    // Add user from payload
    req.user = decoded.user || decoded;  // Handle both token formats
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(401).json({ message: 'Token is not valid' });
  }
};