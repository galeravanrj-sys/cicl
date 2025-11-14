const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const crypto = require('crypto');
const auth = require('./middleware/auth');
const axios = require('axios');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');

// Google OAuth2 Client setup
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3002';
// No-email reset delivery flag
const NO_EMAIL_RESET = String(process.env.NO_EMAIL_RESET || '').toLowerCase() === 'true';

// SMTP configuration via environment variables
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_SECURE = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';

let mailTransporter = null;
let emailEnabled = false;
try {
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    mailTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    emailEnabled = true;
  }
} catch (e) {
  console.warn('Failed to configure SMTP transporter:', e.message);
}

const inferProto = (req) => {
  const xf = (req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  return xf || req.protocol || 'https';
};
const getRedirectUri = (req) => {
  return GOOGLE_REDIRECT_URI || `${inferProto(req)}://${req.get('host')}/api/auth/google/callback`;
};
const createOAuthClient = (redirectUri) => new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUri);

// Helper to fetch Google profile via OIDC id_token or userinfo endpoint
async function getGoogleProfile(oauth2Client, tokens) {
  // Prefer verifying ID token if present
  if (tokens && tokens.id_token) {
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return {
      email: payload.email,
      given_name: payload.given_name,
      family_name: payload.family_name,
      name: payload.name,
      picture: payload.picture,
    };
  }
  // Fallback: call userinfo endpoint with access token
  const profileRes = await axios.get('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` }
  });
  return profileRes.data;
}

const router = express.Router();

// Add this new route for diagnostic purposes
router.get('/verify-token', auth, (req, res) => {
  // If this route is reached, the token is valid
  res.json({ 
    success: true, 
    message: 'Token is valid', 
    userId: req.user.id 
  });
});

// Set or change password (authenticated)
router.post('/set-password', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    // Fetch user including password
    const userResult = await db.query('SELECT id, password FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];

    // If currentPassword provided, verify it; otherwise proceed (useful for Google accounts setting a local password)
    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
    }

    // Hash and update new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Set password error:', error);
    return res.status(500).json({ message: 'Server error while setting password' });
  }
});

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, middleName, lastName, role, phoneNumber, address } = req.body;
    
    // Check if user already exists
    const userCheck = await db.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ 
        message: 'User already exists with that email or username'  
      });
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Insert the new user with only the columns that exist in the database
    // Remove the columns that don't exist in your actual database table
    const defaultRole = 'encoder';
    const newUser = await db.query(
      'INSERT INTO users (username, email, password, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, email, role',
      [username || email, email, hashedPassword, firstName, lastName, defaultRole]
    );
    
    // Generate JWT token with unique jti to ensure distinct sessions
    const token = jwt.sign(
      { user: { id: newUser.rows[0].id }, jti: crypto.randomBytes(16).toString('hex') },
      require('./config').jwtSecret,
      { expiresIn: '1h' }
    );
    
    // Record active session for the newly registered user
    try {
      await db.query(
        'INSERT INTO active_sessions (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'1 hour\')',
        [newUser.rows[0].id, token]
      );
    } catch (e) {
      console.warn('Failed to record active session on registration:', e.message);
    }
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.rows[0].id,
        username: newUser.rows[0].username,
        email: newUser.rows[0].email,
        role: newUser.rows[0].role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find the user
    const userResult = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = userResult.rows[0];
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Force login: terminate existing sessions for this user
    try {
      await db.query('DELETE FROM active_sessions WHERE user_id = $1', [user.id]);
    } catch (e) {
      console.warn('Failed to clear existing sessions, continuing:', e.message);
    }
    
    // Generate JWT token with unique jti to ensure distinct sessions
    const token = jwt.sign(
      { user: { id: user.id }, jti: crypto.randomBytes(16).toString('hex') },
      require('./config').jwtSecret,
      { expiresIn: '1h' }
    );
    
    // Record active session with aligned expiry
    try {
      await db.query(
        'INSERT INTO active_sessions (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'1 hour\')',
        [user.id, token]
      );
    } catch (e) {
      console.warn('Failed to record active session on login:', e.message);
    }
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Logout user (authenticated) and clear active session
router.post('/logout', auth, async (req, res) => {
  try {
    const token = req.header('x-auth-token') || (req.header('Authorization') || '').replace('Bearer ', '').trim();
    if (!token) {
      return res.status(400).json({ message: 'Missing token in request' });
    }
    const userId = req.user.id;
    await db.query('DELETE FROM active_sessions WHERE user_id = $1 AND token = $2', [userId, token]);
    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Server error during logout' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userResult = await db.query(
      'SELECT id, username, email, first_name, last_name, role FROM users WHERE id = $1',
      [userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(userResult.rows[0]);
  } catch (error) {
    console.error('Auth /me error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
});

// Forgot Password Route
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user exists
    const user = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    // Always respond success to avoid user enumeration, but only proceed if exists
    const userExists = user.rows.length > 0;
    if (!userExists) {
      // Respond 200 for non-existent emails
      return res.status(200).json({ message: 'Password reset email sent' });
    }
    
    // Generate a password reset token
    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour
    
    // Store the token in the database
    await db.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
      [token, expires, email]
    );
    
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;

    // No-email flow: return the reset URL directly when flag set or email disabled
    if (NO_EMAIL_RESET || !emailEnabled || !mailTransporter) {
      console.log('No-email reset flow. Reset URL:', resetUrl);
      return res.status(200).json({ message: 'Password reset link generated', resetUrl });
    }

    // Email flow
    const mailOptions = {
      from: SMTP_USER || 'no-reply@cicl.local',
      to: email,
      subject: 'Reset your CICL account password',
      text: `You requested a password reset. Use the link below to set a new password.\n\n${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, you can ignore this email.`,
      html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 1 hour.</p>`
    };
    try {
      await mailTransporter.sendMail(mailOptions);
    } catch (e) {
      console.warn('Failed to send reset email:', e.message);
      // Fall back to returning link if send fails
      return res.status(200).json({ message: 'Password reset link generated', resetUrl });
    }

    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Validate reset token (unauthenticated)
router.get('/reset-password/validate', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: 'Missing token' });

    const result = await db.query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    return res.json({ valid: true });
  } catch (error) {
    console.error('Validate reset token error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Reset password (unauthenticated)
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const userResult = await db.query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    const userId = userResult.rows[0].id;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await db.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hashedPassword, userId]
    );

    return res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

// Google OAuth routes
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  // Initiate Google OAuth flow
  router.get('/google', (req, res) => {
    try {
      const redirectUri = getRedirectUri(req);
      const oauth2Client = createOAuthClient(redirectUri);
      // Carry remember flag through OAuth state
      const remember = req.query.remember === '0' ? '0' : '1';
      const state = encodeURIComponent(JSON.stringify({ remember }));
      const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: [
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile',
          'openid'
        ],
        redirect_uri: redirectUri,
        state
      });
      return res.redirect(url);
    } catch (error) {
      console.error('Error generating Google auth URL:', error);
      return res.status(500).json({ message: 'Failed to initiate Google login' });
    }
  });

  // Google OAuth callback handler
  router.get('/google/callback', async (req, res) => {
    try {
      const redirectUri = getRedirectUri(req);
      const oauth2Client = createOAuthClient(redirectUri);
      const { code } = req.query;
      if (!code) {
        return res.status(400).json({ message: 'Authorization code missing' });
      }

      // Explicitly pass redirect_uri to avoid mismatch issues
      const { tokens } = await oauth2Client.getToken({ code, redirect_uri: redirectUri });
      oauth2Client.setCredentials(tokens);

      // Fetch user profile (OIDC preferred)
      const profile = await getGoogleProfile(oauth2Client, tokens);

      const email = profile.email;
      const firstName = profile.given_name || '';
      const lastName = profile.family_name || '';
      const fullName = profile.name || `${firstName} ${lastName}`.trim();
      const picture = profile.picture || '';
      const username = (email && email.includes('@')) ? email.split('@')[0] : (profile.name || 'google_user');

      if (!email) {
        console.error('Google profile missing email:', profile);
        return res.status(400).json({ message: 'Google account email not available' });
      }

      // Upsert user in DB
      const existing = await db.query('SELECT id, username, email FROM users WHERE email = $1', [email]);
      let userRow;
      if (existing.rows.length === 0) {
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const hashed = await bcrypt.hash(randomPassword, 10);
        const created = await db.query(
          'INSERT INTO users (username, email, password, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email',
          [username, email, hashed, firstName, lastName]
        );
        userRow = created.rows[0];
      } else {
        userRow = existing.rows[0];
      }

      // Issue JWT for app with unique jti to enforce single-session
      const token = jwt.sign(
        { user: { id: userRow.id }, jti: crypto.randomBytes(16).toString('hex') },
        require('./config').jwtSecret,
        { expiresIn: '1h' }
      );

      // Force login for Google OAuth: terminate existing sessions
      try {
        await db.query('DELETE FROM active_sessions WHERE user_id = $1', [userRow.id]);
      } catch (e) {
        console.warn('Failed to clear existing sessions for Google login:', e.message);
      }

      // Record active session with aligned expiry
      try {
        await db.query(
          'INSERT INTO active_sessions (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'1 hour\')',
          [userRow.id, token]
        );
      } catch (e) {
        console.warn('Failed to record active session for Google login:', e.message);
      }

      // Pull remember from OAuth state
      let rememberParam = '1';
      try {
        if (req.query.state) {
          const parsed = JSON.parse(decodeURIComponent(req.query.state));
          if (parsed && parsed.remember === '0') rememberParam = '0';
        }
      } catch (e) {
        // default to remember=1 on parse issues
      }

      // Redirect into SPA dashboard with token
      const redirectPath = '/dashboard';
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const query = new URLSearchParams({
        token,
        remember: rememberParam,
        name: fullName || '',
        email: email || '',
        picture: picture || ''
      });
      return res.redirect(`${baseUrl}${redirectPath}?${query.toString()}`);
    } catch (error) {
      const msg = error && error.message ? error.message : String(error);
      const details = error && error.response && error.response.data ? error.response.data : undefined;
      console.error('Google callback error:', msg, details ? `| details: ${JSON.stringify(details)}` : '');
      return res.status(500).json({ message: 'Google authentication failed' });
    }
  });
} else {
  console.warn('Google OAuth not configured: missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET');
}