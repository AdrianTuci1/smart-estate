const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Company = require('../models/Company');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', validate(schemas.login), asyncHandler(async (req, res) => {
  const { username, password, companyAlias } = req.body;

  // Get company by alias
  const companyResult = await Company.getByAlias(companyAlias);
  if (!companyResult.success || !companyResult.data) {
    return res.status(401).json({
      success: false,
      error: 'Invalid company alias'
    });
  }

  // Get user by username and company
  const userResult = await User.getByUsernameAndCompany(username, companyAlias);
  if (!userResult.success || !userResult.data) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  const user = new User(userResult.data);

  // Verify password
  const isPasswordValid = await user.verifyPassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  // Generate JWT token
  const token = generateToken(user);

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        companyAlias: user.companyAlias,
        companyId: user.companyId,
        role: user.role
      },
      company: {
        id: companyResult.data.id,
        name: companyResult.data.name,
        alias: companyResult.data.alias
      }
    }
  });
}));

// @route   POST /api/auth/register
// @desc    Register a new user (admin only)
// @access  Private (Admin)
router.post('/register', authenticateToken, validate(schemas.register), asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }

  const { username, password, companyAlias, role } = req.body;

  // Verify company exists and user has access to it
  if (req.user.companyAlias !== companyAlias) {
    return res.status(403).json({
      success: false,
      error: 'Cannot create user for different company'
    });
  }

  // Create new user
  const userData = {
    username,
    password,
    companyAlias,
    companyId: req.user.companyId,
    role: role || 'agent'
  };

  const result = await User.create(userData);
  
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error
    });
  }

  res.status(201).json({
    success: true,
    data: result.data
  });
}));

// @route   GET /api/auth/me
// @desc    Get current user info
// @access  Private
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const userResult = await User.getById(req.user.id);
  
  if (!userResult.success || !userResult.data) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  const companyResult = await Company.getById(userResult.data.companyId);
  
  res.json({
    success: true,
    data: {
      user: userResult.data,
      company: companyResult.success ? companyResult.data : null
    }
  });
}));

// @route   GET /api/auth/profile
// @desc    Get current user profile (alias for /me)
// @access  Private
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const userResult = await User.getById(req.user.id);
  
  if (!userResult.success || !userResult.data) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  const companyResult = await Company.getById(userResult.data.companyId);
  
  res.json({
    success: true,
    data: {
      user: userResult.data,
      company: companyResult.success ? companyResult.data : null
    }
  });
}));

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authenticateToken, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Current password and new password are required'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'New password must be at least 6 characters long'
    });
  }

  // Get user with password hash
  const userResult = await User.getByUsernameAndCompany(req.user.username, req.user.companyAlias);
  if (!userResult.success || !userResult.data) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  const user = new User(userResult.data);

  // Verify current password
  const isCurrentPasswordValid = await user.verifyPassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return res.status(401).json({
      success: false,
      error: 'Current password is incorrect'
    });
  }

  // Update password
  const result = await user.updatePassword(newPassword);
  
  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: 'Failed to update password'
    });
  }

  res.json({
    success: true,
    message: 'Password updated successfully'
  });
}));

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', authenticateToken, asyncHandler(async (req, res) => {
  // Generate new token with current user data
  const token = generateToken(req.user);

  res.json({
    success: true,
    data: {
      token
    }
  });
}));

module.exports = router;
