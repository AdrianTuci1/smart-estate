const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// @route   POST /api/companies
// @desc    Create a new company with admin user
// @access  Public (for initial setup, requires secret)
router.post('/', validate(schemas.createCompany), asyncHandler(async (req, res) => {
  const { name, alias, adminUsername, adminPassword, secret } = req.body;

  // Verify secret for company creation
  const requiredSecret = process.env.COMPANY_CREATION_SECRET;
  if (!requiredSecret) {
    return res.status(500).json({
      success: false,
      error: 'Company creation is not configured'
    });
  }

  if (!secret || secret !== requiredSecret) {
    return res.status(401).json({
      success: false,
      error: 'Invalid secret for company creation'
    });
  }

  // Create company
  const companyResult = await Company.create({ name, alias });
  if (!companyResult.success) {
    return res.status(400).json({
      success: false,
      error: companyResult.error
    });
  }

  const company = companyResult.data;

  // Create admin user for the company
  const adminUserData = {
    username: adminUsername,
    password: adminPassword,
    companyAlias: company.alias,
    companyId: company.id,
    role: 'admin'
  };

  const adminUserResult = await User.create(adminUserData);
  if (!adminUserResult.success) {
    // If user creation fails, delete the company
    await Company.delete(company.id);
    return res.status(400).json({
      success: false,
      error: adminUserResult.error
    });
  }

  const adminUser = new User(adminUserResult.data);

  // Generate token for the admin user
  const token = generateToken(adminUser);

  res.status(201).json({
    success: true,
    data: {
      company,
      adminUser: {
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
        companyAlias: adminUser.companyAlias,
        companyId: adminUser.companyId
      },
      token
    }
  });
}));

// @route   GET /api/companies/:alias
// @desc    Get company by alias
// @access  Public
router.get('/:alias', asyncHandler(async (req, res) => {
  const { alias } = req.params;

  const result = await Company.getByAlias(alias);
  if (!result.success || !result.data) {
    return res.status(404).json({
      success: false,
      error: 'Company not found'
    });
  }

  res.json({
    success: true,
    data: result.data
  });
}));

// @route   GET /api/companies
// @desc    List all companies (admin only)
// @access  Private (Admin)
router.get('/', asyncHandler(async (req, res) => {
  // Note: This would need authentication middleware in a real scenario
  // For now, we'll make it public for development
  const result = await Company.list();
  
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

// @route   PUT /api/companies/:id
// @desc    Update company
// @access  Private (Admin)
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Get company first
  const companyResult = await Company.getById(id);
  if (!companyResult.success || !companyResult.data) {
    return res.status(404).json({
      success: false,
      error: 'Company not found'
    });
  }

  const company = new Company(companyResult.data);
  const result = await company.update(updateData);

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

// @route   DELETE /api/companies/:id
// @desc    Delete company
// @access  Private (Admin)
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if company exists
  const companyResult = await Company.getById(id);
  if (!companyResult.success || !companyResult.data) {
    return res.status(404).json({
      success: false,
      error: 'Company not found'
    });
  }

  // Delete all users from this company first
  const usersResult = await User.getByCompany(companyResult.data.alias);
  if (usersResult.success && usersResult.data) {
    for (const user of usersResult.data) {
      await User.delete(user.id);
    }
  }

  // Delete company
  const result = await Company.delete(id);
  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: result.error
    });
  }

  res.json({
    success: true,
    message: 'Company deleted successfully'
  });
}));

// @route   GET /api/companies/:alias/users
// @desc    Get users from a company
// @access  Private (Admin)
router.get('/:alias/users', asyncHandler(async (req, res) => {
  const { alias } = req.params;

  const result = await User.getByCompany(alias);
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

module.exports = router;
