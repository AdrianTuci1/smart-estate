const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const Property = require('../models/Property');
const { authenticateToken, requireCompanyAccess } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { s3Utils, textractUtils, S3_CONFIG } = require('../config/aws');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tip de fișier nepermis. Doar PDF, DOCX, DOC și TXT sunt acceptate.'), false);
    }
  }
});

// Apply authentication and company access middleware to all routes
router.use(authenticateToken);
router.use(requireCompanyAccess);

// @route   GET /api/properties
// @desc    Get all properties for the company
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const offset = (page - 1) * limit;

  let result;
  if (status) {
    result = await Property.getByStatus(req.user.companyId, status);
  } else {
    result = await Property.getByCompany(req.user.companyId, parseInt(limit));
  }

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
      limit: parseInt(limit),
      hasMore: result.hasMore || false
    }
  });
}));

// @route   GET /api/properties/:id
// @desc    Get single property by ID
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await Property.getById(id);
  
  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: result.error
    });
  }

  if (!result.data) {
    return res.status(404).json({
      success: false,
      error: 'Property not found'
    });
  }

  // Check if property belongs to user's company
  if (result.data.companyId !== req.user.companyId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  // Get leads interested in this property
  const leadsResult = await Lead.getByPropertyInterest(req.user.companyId, id);
  const leads = leadsResult.success ? leadsResult.data : [];

  res.json({
    success: true,
    data: {
      ...result.data,
      leads
    }
  });
}));

// @route   POST /api/properties
// @desc    Create new property
// @access  Private
router.post('/', validate(schemas.property), asyncHandler(async (req, res) => {
  const propertyData = {
    ...req.body,
    companyId: req.user.companyId
  };

  // Convert position to coordinates for database storage
  if (propertyData.position && !propertyData.coordinates) {
    propertyData.coordinates = propertyData.position;
  }

  const result = await Property.create(propertyData);
  
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

// @route   PUT /api/properties/:id
// @desc    Update property
// @access  Private
router.put('/:id', validate(schemas.property), asyncHandler(async (req, res) => {
  const { id } = req.params;

  // First, get the property to check ownership
  const getResult = await Property.getById(id);
  
  if (!getResult.success || !getResult.data) {
    return res.status(404).json({
      success: false,
      error: 'Property not found'
    });
  }

  if (getResult.data.companyId !== req.user.companyId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  // Convert position to coordinates for database storage
  const updateData = { ...req.body };
  if (updateData.position && !updateData.coordinates) {
    updateData.coordinates = updateData.position;
  }

  const property = new Property(getResult.data);
  const result = await property.update(updateData);
  
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

// @route   DELETE /api/properties/:id
// @desc    Delete property
// @access  Private
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // First, get the property to check ownership
  const getResult = await Property.getById(id);
  
  if (!getResult.success || !getResult.data) {
    return res.status(404).json({
      success: false,
      error: 'Property not found'
    });
  }

  if (getResult.data.companyId !== req.user.companyId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  // Delete associated images from S3
  if (getResult.data.images && getResult.data.images.length > 0) {
    for (const imageUrl of getResult.data.images) {
      // Extract key from S3 URL
      const key = imageUrl.split('/').pop();
      await s3Utils.deleteFile(`properties/${id}/${key}`);
    }
  }

  const result = await Property.delete(id);
  
  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: result.error
    });
  }

  res.json({
    success: true,
    message: 'Property deleted successfully'
  });
}));

// @route   GET /api/properties/map/bounds
// @desc    Get properties within map bounds
// @access  Private
router.get('/map/bounds', asyncHandler(async (req, res) => {
  const { north, south, east, west } = req.query;

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

  const result = await Property.getByCoordinates(req.user.companyId, bounds);
  
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

// @route   POST /api/properties/:id/images
// @desc    Upload image for property
// @access  Private
router.post('/:id/images', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({
      success: false,
      error: 'Image URL is required'
    });
  }

  // First, get the property to check ownership
  const getResult = await Property.getById(id);
  
  if (!getResult.success || !getResult.data) {
    return res.status(404).json({
      success: false,
      error: 'Property not found'
    });
  }

  if (getResult.data.companyId !== req.user.companyId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  const property = new Property(getResult.data);
  const result = await property.addImage(imageUrl);
  
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

// @route   DELETE /api/properties/:id/images/:imageUrl
// @desc    Remove image from property
// @access  Private
router.delete('/:id/images/:imageUrl', asyncHandler(async (req, res) => {
  const { id, imageUrl } = req.params;
  const decodedImageUrl = decodeURIComponent(imageUrl);

  // First, get the property to check ownership
  const getResult = await Property.getById(id);
  
  if (!getResult.success || !getResult.data) {
    return res.status(404).json({
      success: false,
      error: 'Property not found'
    });
  }

  if (getResult.data.companyId !== req.user.companyId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  const property = new Property(getResult.data);
  const result = await property.removeImage(decodedImageUrl);
  
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error
    });
  }

  // Delete image from S3
  const key = decodedImageUrl.split('/').pop();
  await s3Utils.deleteFile(`properties/${id}/${key}`);

  res.json({
    success: true,
    data: result.data
  });
}));


// @route   POST /api/properties/:id/files/upload
// @desc    Upload file for property to S3
// @access  Private
router.post('/:id/files/upload', upload.single('file'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded'
    });
  }

  // First, get the property to check ownership
  const getResult = await Property.getById(id);
  
  if (!getResult.success || !getResult.data) {
    return res.status(404).json({
      success: false,
      error: 'Property not found'
    });
  }

  if (getResult.data.companyId !== req.user.companyId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  try {
    // Generate S3 key for the file
    const fileExtension = path.extname(req.file.originalname);
    const s3Key = `properties/${id}/${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
    
    // Upload file to S3
    const uploadResult = await s3Utils.uploadFile(
      req.file.buffer,
      s3Key,
      req.file.mimetype
    );

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        error: uploadResult.error
      });
    }

    // Create file data
    const fileData = {
      id: require('uuid').v4(),
      name: req.file.originalname,
      type: fileExtension.substring(1).toUpperCase(),
      size: (req.file.size / 1024 / 1024).toFixed(1) + ' MB',
      url: uploadResult.url,
      s3Key: s3Key,
      createdAt: new Date().toISOString()
    };

    const property = new Property(getResult.data);
    const result = await property.addFile(fileData);
    
    if (!result.success) {
      // If database update fails, delete the file from S3
      await s3Utils.deleteFile(s3Key);
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: 'File upload failed'
    });
  }
}));

// @route   DELETE /api/properties/:id/files/:fileId
// @desc    Delete file reference from property and S3
// @access  Private
router.delete('/:id/files/:fileId', asyncHandler(async (req, res) => {
  const { id, fileId } = req.params;

  // First, get the property to check ownership
  const getResult = await Property.getById(id);
  
  if (!getResult.success || !getResult.data) {
    return res.status(404).json({
      success: false,
      error: 'Property not found'
    });
  }

  if (getResult.data.companyId !== req.user.companyId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  // Find the file to get S3 key before deleting
  const fileToDelete = getResult.data.files.find(file => file.id === fileId);
  
  const property = new Property(getResult.data);
  const result = await property.deleteFile(fileId);
  
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error
    });
  }

  // Delete file from S3 if it exists
  if (fileToDelete && fileToDelete.s3Key) {
    try {
      await s3Utils.deleteFile(fileToDelete.s3Key);
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      // Don't fail the request if S3 deletion fails
    }
  }

  res.json({
    success: true,
    data: result.data
  });
}));

module.exports = router;
