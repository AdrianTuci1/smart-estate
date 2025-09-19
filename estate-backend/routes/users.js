const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Company = require('../models/Company');
const { authenticateToken, canModifyUserRole, hasPermission, ROLE_HIERARCHY } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// @route   GET /api/users
// @desc    Get users from current company
// @access  Private (Admin, Moderator)
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  // Check if user can manage users
  if (!hasPermission(req.user.role, 'manage_users')) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions to view users'
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
// @desc    Create a new user (admin, moderator)
// @access  Private (Admin, Moderator)
router.post('/', authenticateToken, validate(schemas.createUser), asyncHandler(async (req, res) => {
  // Check if user can manage users
  if (!hasPermission(req.user.role, 'manage_users')) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions to create users'
    });
  }

  const { username, password, role } = req.body;

  // Validate role assignment
  const validRoles = ['Moderator', 'PowerUser', 'User'];
  if (role && !validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid role. Must be one of: Moderator, PowerUser, User'
    });
  }

  // Check if current user can assign this role
  const targetRole = role || 'User';
  if (!canModifyUserRole(req.user.role, targetRole)) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions to assign this role'
    });
  }

  // Create new user for the same company
  const userData = {
    username,
    password,
    companyAlias: req.user.companyAlias,
    companyId: req.user.companyId,
    role: targetRole
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
// @access  Private (Admin, Moderator or self)
router.put('/:id', authenticateToken, validate(schemas.updateUser), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Check if user is admin/moderator or updating their own data
  const canManageUsers = hasPermission(req.user.role, 'manage_users');
  const isUpdatingSelf = req.user.id === id;

  if (!canManageUsers && !isUpdatingSelf) {
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
  if (canManageUsers && userResult.data.companyAlias !== req.user.companyAlias) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  // Handle role updates
  if (updateData.role && canManageUsers) {
    // Validate role
    const validRoles = ['Moderator', 'PowerUser', 'User'];
    if (!validRoles.includes(updateData.role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be one of: Moderator, PowerUser, User'
      });
    }

    // Check if current user can assign this role to target user
    if (!canModifyUserRole(req.user.role, updateData.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to assign this role'
      });
    }

    // Prevent moderators from promoting users to moderator level
    if (req.user.role === 'Moderator' && updateData.role === 'Moderator') {
      return res.status(403).json({
        success: false,
        error: 'Cannot promote users to Moderator level'
      });
    }
  } else if (updateData.role && !canManageUsers) {
    // Remove role from update data if user can't manage roles
    delete updateData.role;
  }

  // Handle password updates
  if (updateData.password && !hasPermission(req.user.role, 'change_passwords') && !isUpdatingSelf) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions to change passwords'
    });
  }

  // Non-admin/moderator users can only update certain fields
  if (!canManageUsers) {
    const allowedFields = ['username']; // Users can only update their own username
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
// @access  Private (Admin, Moderator)
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  // Check if user can manage users
  if (!hasPermission(req.user.role, 'manage_users')) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions to delete users'
    });
  }

  const { id } = req.params;

  // Prevent user from deleting themselves
  if (req.user.id === id) {
    return res.status(400).json({
      success: false,
      error: 'Cannot delete your own account'
    });
  }

  // Get user first to check company and role
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

  // Check if current user can delete the target user based on role hierarchy
  if (!canModifyUserRole(req.user.role, userResult.data.role)) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions to delete this user'
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
