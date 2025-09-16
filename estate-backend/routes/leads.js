const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Property = require('../models/Property');
const { authenticateToken, requireCompanyAccess } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// Apply authentication and company access middleware to all routes
router.use(authenticateToken);
router.use(requireCompanyAccess);

// @route   GET /api/leads
// @desc    Get all leads for the company
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const offset = (page - 1) * limit;

  const result = await Lead.getByCompany(req.user.companyId, parseInt(limit));
  
  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: result.error
    });
  }

  // Filter by status if provided
  let filteredLeads = result.data;
  if (status) {
    filteredLeads = result.data.filter(lead => lead.status === status);
  }

  res.json({
    success: true,
    data: filteredLeads,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore: result.hasMore || false
    }
  });
}));

// @route   GET /api/leads/:id
// @desc    Get single lead by ID
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await Lead.getById(id);
  
  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: result.error
    });
  }

  if (!result.data) {
    return res.status(404).json({
      success: false,
      error: 'Lead not found'
    });
  }

  // Check if lead belongs to user's company
  if (result.data.companyId !== req.user.companyId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  // Get properties of interest details
  let propertiesOfInterest = [];
  if (result.data.propertiesOfInterest && result.data.propertiesOfInterest.length > 0) {
    const propertyPromises = result.data.propertiesOfInterest.map(propertyId => 
      Property.getById(propertyId)
    );
    const propertyResults = await Promise.all(propertyPromises);
    propertiesOfInterest = propertyResults
      .filter(result => result.success && result.data)
      .map(result => result.data);
  }

  res.json({
    success: true,
    data: {
      ...result.data,
      propertiesOfInterest
    }
  });
}));

// @route   POST /api/leads
// @desc    Create new lead
// @access  Private
router.post('/', validate(schemas.lead), asyncHandler(async (req, res) => {
  const leadData = {
    ...req.body,
    companyId: req.user.companyId
  };

  const result = await Lead.create(leadData);
  
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

// @route   PUT /api/leads/:id
// @desc    Update lead
// @access  Private
router.put('/:id', validate(schemas.lead), asyncHandler(async (req, res) => {
  const { id } = req.params;

  // First, get the lead to check ownership
  const getResult = await Lead.getById(id);
  
  if (!getResult.success || !getResult.data) {
    return res.status(404).json({
      success: false,
      error: 'Lead not found'
    });
  }

  if (getResult.data.companyId !== req.user.companyId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  const lead = new Lead(getResult.data);
  const result = await lead.update(req.body);
  
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

// @route   DELETE /api/leads/:id
// @desc    Delete lead
// @access  Private
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // First, get the lead to check ownership
  const getResult = await Lead.getById(id);
  
  if (!getResult.success || !getResult.data) {
    return res.status(404).json({
      success: false,
      error: 'Lead not found'
    });
  }

  if (getResult.data.companyId !== req.user.companyId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  const result = await Lead.delete(id);
  
  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: result.error
    });
  }

  res.json({
    success: true,
    message: 'Lead deleted successfully'
  });
}));

// @route   POST /api/leads/:id/properties/:propertyId
// @desc    Add property to lead's interest list
// @access  Private
router.post('/:id/properties/:propertyId', asyncHandler(async (req, res) => {
  const { id, propertyId } = req.params;

  // First, get the lead to check ownership
  const leadResult = await Lead.getById(id);
  
  if (!leadResult.success || !leadResult.data) {
    return res.status(404).json({
      success: false,
      error: 'Lead not found'
    });
  }

  if (leadResult.data.companyId !== req.user.companyId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  // Check if property exists and belongs to the same company
  const propertyResult = await Property.getById(propertyId);
  
  if (!propertyResult.success || !propertyResult.data) {
    return res.status(404).json({
      success: false,
      error: 'Property not found'
    });
  }

  if (propertyResult.data.companyId !== req.user.companyId) {
    return res.status(403).json({
      success: false,
      error: 'Property access denied'
    });
  }

  const lead = new Lead(leadResult.data);
  const result = await lead.addPropertyInterest(propertyId);
  
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

// @route   DELETE /api/leads/:id/properties/:propertyId
// @desc    Remove property from lead's interest list
// @access  Private
router.delete('/:id/properties/:propertyId', asyncHandler(async (req, res) => {
  const { id, propertyId } = req.params;

  // First, get the lead to check ownership
  const leadResult = await Lead.getById(id);
  
  if (!leadResult.success || !leadResult.data) {
    return res.status(404).json({
      success: false,
      error: 'Lead not found'
    });
  }

  if (leadResult.data.companyId !== req.user.companyId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  const lead = new Lead(leadResult.data);
  const result = await lead.removePropertyInterest(propertyId);
  
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

// @route   PUT /api/leads/:id/status
// @desc    Update lead status
// @access  Private
router.put('/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['active', 'contacted', 'converted', 'lost'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Valid status is required (active, contacted, converted, lost)'
    });
  }

  // First, get the lead to check ownership
  const getResult = await Lead.getById(id);
  
  if (!getResult.success || !getResult.data) {
    return res.status(404).json({
      success: false,
      error: 'Lead not found'
    });
  }

  if (getResult.data.companyId !== req.user.companyId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  const lead = new Lead(getResult.data);
  const result = await lead.update({ status });
  
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

module.exports = router;
