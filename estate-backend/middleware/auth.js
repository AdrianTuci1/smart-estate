const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist
    const userResult = await User.getById(decoded.userId);
    
    if (!userResult.success || !userResult.data) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token - user not found' 
      });
    }

    // Add user info to request object
    req.user = {
      id: decoded.userId,
      username: decoded.username,
      companyAlias: decoded.companyAlias,
      companyId: userResult.data.companyId,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token expired' 
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token' 
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: 'Token verification failed' 
      });
    }
  }
};

// Middleware to check if user has admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      error: 'Admin access required' 
    });
  }
  next();
};

// Middleware to ensure user can only access their company's data
const requireCompanyAccess = (req, res, next) => {
  // This middleware ensures that users can only access data from their own company
  // The companyId will be automatically added to queries in the route handlers
  if (!req.user.companyId) {
    return res.status(403).json({ 
      success: false, 
      error: 'Company access not available' 
    });
  }
  next();
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      companyAlias: user.companyAlias,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userResult = await User.getById(decoded.userId);
    
    if (userResult.success && userResult.data) {
      req.user = {
        id: decoded.userId,
        username: decoded.username,
        companyAlias: decoded.companyAlias,
        companyId: userResult.data.companyId,
        role: decoded.role
      };
    } else {
      req.user = null;
    }
  } catch (error) {
    req.user = null;
  }

  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireCompanyAccess,
  generateToken,
  optionalAuth
};
