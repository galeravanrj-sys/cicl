const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting server setup...');

// 1. Check and create config.js if it doesn't exist
const configPath = path.join(__dirname, 'config.js');
if (!fs.existsSync(configPath)) {
  console.log('📝 Creating config.js file...');
  const configContent = `
require('dotenv').config();

module.exports = {
  // JWT Secret - use environment variable or fallback to a default for development
  jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret_for_development',
  
  // Server configuration
  server: {
    port: process.env.PORT || 5000
  }
};`;

  fs.writeFileSync(configPath, configContent);
  console.log('✅ config.js created successfully');
}

// Create or update auth middleware
const authMiddlewarePath = path.join(__dirname, 'middleware', 'auth.js');
// Make sure middleware directory exists
if (!fs.existsSync(path.join(__dirname, 'middleware'))) {
  fs.mkdirSync(path.join(__dirname, 'middleware'), { recursive: true });
  console.log('✅ Created middleware directory');
}

// Create improved auth middleware that handles both token formats
console.log('📝 Creating enhanced auth middleware...');
const authMiddlewareContent = `const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
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
    const secret = process.env.JWT_SECRET || 'your_jwt_secret';
    const decoded = jwt.verify(finalToken, secret);
    
    // Log successful verification
    console.log('Token verified successfully for user:', decoded.user ? decoded.user.id : 'unknown');
    
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
};`;

fs.writeFileSync(authMiddlewarePath, authMiddlewareContent);
console.log('✅ Enhanced auth middleware created');

// Update auth routes with diagnostic endpoint
const authRoutesPath = path.join(__dirname, 'authRoutes.js');
if (fs.existsSync(authRoutesPath)) {
  let authRoutesContent = fs.readFileSync(authRoutesPath, 'utf8');
  
  // Add auth middleware import if not present
  if (!authRoutesContent.includes('const auth = require(\'./middleware/auth\')')) {
    authRoutesContent = authRoutesContent.replace(
      'const router = express.Router();',
      'const auth = require(\'./middleware/auth\');\n\nconst router = express.Router();'
    );
  }
  
  // Add verification endpoint if not present
  if (!authRoutesContent.includes('router.get(\'/verify-token\'')) {
    authRoutesContent = authRoutesContent.replace(
      'const router = express.Router();',
      `const router = express.Router();

// Add diagnostic route to verify token
router.get('/verify-token', auth, (req, res) => {
  // If this route is reached, the token is valid
  res.json({ 
    success: true, 
    message: 'Token is valid', 
    userId: req.user.id 
  });
});`
    );
  }
  
  fs.writeFileSync(authRoutesPath, authRoutesContent);
  console.log('✅ Added token verification endpoint to authRoutes.js');
}

// Enhance server.js CORS settings if it exists
const serverPath = path.join(__dirname, 'server.js');
if (fs.existsSync(serverPath)) {
  let serverContent = fs.readFileSync(serverPath, 'utf8');
  
  // Update CORS configuration
  if (serverContent.includes('app.use(cors())')) {
    serverContent = serverContent.replace(
      'app.use(cors());',
      `app.use(cors({
  origin: '*', // Allow all origins for development - restrict in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));`
    );
    
    fs.writeFileSync(serverPath, serverContent);
    console.log('✅ Enhanced CORS configuration in server.js');
  }
}

// 2. Check for required packages
console.log('🔍 Checking for required packages...');
const requiredPackages = ['express', 'cors', 'jsonwebtoken', 'dotenv'];
let missingPackages = [];

for (const pkg of requiredPackages) {
  try {
    require.resolve(pkg);
  } catch (e) {
    missingPackages.push(pkg);
  }
}

// 3. Install missing packages if any
if (missingPackages.length > 0) {
  console.log(`📦 Installing missing packages: ${missingPackages.join(', ')}...`);
  try {
    execSync(`npm install ${missingPackages.join(' ')} --save`, { stdio: 'inherit' });
    console.log('✅ Packages installed successfully');
  } catch (error) {
    console.error('❌ Failed to install packages. Please run the following command manually:');
    console.error(`npm install ${missingPackages.join(' ')} --save`);
    process.exit(1);
  }
}



// 5. Start the server
console.log('🚀 Starting server...');
try {
  console.log('\n==== SERVER OUTPUT ====\n');
  require('./server');
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}