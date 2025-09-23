const express = require('express');
const router = express.Router();
const Property = require('../../models/Property');
const { authenticateToken, requireCompanyAccess } = require('../../middleware/auth');
const { asyncHandler } = require('../../middleware/errorHandler');

// Apply middleware to all routes
router.use(authenticateToken);
router.use(requireCompanyAccess);

// @route   GET /api/properties/map/bounds
// @desc    Get properties within map bounds with pagination
// @access  Private
router.get('/map/bounds', asyncHandler(async (req, res) => {
  const { 
    north, 
    south, 
    east, 
    west,
    page = 1,
    limit = 50
  } = req.query;

  if (!north || !south || !east || !west) {
    return res.status(400).json({
      success: false,
      error: 'Map bounds are required (north, south, east, west)'
    });
  }

  const bounds = {
    north: parseFloat(north),
    south: parseFloat(south),
    east: parseFloat(east),
    west: parseFloat(west)
  };

  const pageSize = Math.min(parseInt(limit), 200); // Max 200 items per page for map
  const lastKey = req.query.lastKey ? JSON.parse(decodeURIComponent(req.query.lastKey)) : null;

  // Get properties by coordinates with pagination
  const result = await Property.getByCoordinatesWithPagination(
    req.user.companyId, 
    bounds, 
    pageSize, 
    lastKey
  );
  
  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: result.error
    });
  }

  res.json({
    success: true,
    data: result.data,
    pagination: {
      page: parseInt(page),
      limit: pageSize,
      hasMore: result.hasMore || false,
      lastKey: result.lastKey ? encodeURIComponent(JSON.stringify(result.lastKey)) : null
    }
  });
}));

// @route   GET /api/properties/map/search
// @desc    Search properties within map bounds
// @access  Private
router.get('/map/search', asyncHandler(async (req, res) => {
  const { 
    north, 
    south, 
    east, 
    west,
    search,
    status,
    page = 1,
    limit = 50
  } = req.query;

  if (!north || !south || !east || !west) {
    return res.status(400).json({
      success: false,
      error: 'Map bounds are required (north, south, east, west)'
    });
  }

  const bounds = {
    north: parseFloat(north),
    south: parseFloat(south),
    east: parseFloat(east),
    west: parseFloat(west)
  };

  const pageSize = Math.min(parseInt(limit), 100);
  const lastKey = req.query.lastKey ? JSON.parse(decodeURIComponent(req.query.lastKey)) : null;

  // Get properties by coordinates with filters
  const result = await Property.getByCoordinatesWithFilters(
    req.user.companyId, 
    bounds, 
    { search, status },
    pageSize, 
    lastKey
  );
  
  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: result.error
    });
  }

  res.json({
    success: true,
    data: result.data,
    pagination: {
      page: parseInt(page),
      limit: pageSize,
      hasMore: result.hasMore || false,
      lastKey: result.lastKey ? encodeURIComponent(JSON.stringify(result.lastKey)) : null
    }
  });
}));

module.exports = router;
