const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Company = require('../models/Company');
const { authenticateToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// @route   GET /api/users
// @desc    Get users from current company
// @access  Private (Admin)
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }

  const result = await User.getByCompany(req.user.companyAlias);
  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: result.error
    });
  }

  res.json({
    success: true,
    data: result.data
  });
}));

// @route   POST /api/users
// @desc    Create a new user (admin only)
// @access  Private (Admin)
router.post('/', authenticateToken, validate(schemas.register), asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }

  const { username, password, role } = req.body;

  // Create new user for the same company
  const userData = {
    username,
    password,
    companyAlias: req.user.companyAlias,
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

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin or self)
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if user is admin or requesting their own data
  if (req.user.role !== 'admin' && req.user.id !== id) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  const result = await User.getById(id);
  if (!result.success || !result.data) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Check if user belongs to the same company
  if (req.user.role === 'admin' && result.data.companyAlias !== req.user.companyAlias) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  res.json({
    success: true,
    data: result.data
  });
}));

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin or self)
router.put('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Check if user is admin or updating their own data
  if (req.user.role !== 'admin' && req.user.id !== id) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  // Get user first
  const userResult = await User.getById(id);
  if (!userResult.success || !userResult.data) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Check if user belongs to the same company
  if (req.user.role === 'admin' && userResult.data.companyAlias !== req.user.companyAlias) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  // Non-admin users can only update certain fields
  if (req.user.role !== 'admin') {
    const allowedFields = ['username']; // Add more fields as needed
    const filteredData = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });
    updateData = filteredData;
  }

  const user = new User(userResult.data);
  const result = await user.update(updateData);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error
    });
  }

  res.json({
    success: true,
    data: result.data
  });
}));

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (Admin)
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }

  const { id } = req.params;

  // Prevent admin from deleting themselves
  if (req.user.id === id) {
    return res.status(400).json({
      success: false,
      error: 'Cannot delete your own account'
    });
  }

  // Get user first to check company
  const userResult = await User.getById(id);
  if (!userResult.success || !userResult.data) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Check if user belongs to the same company
  if (userResult.data.companyAlias !== req.user.companyAlias) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  const result = await User.delete(id);
  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: result.error
    });
  }

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));

module.exports = router;
