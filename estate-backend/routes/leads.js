const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Lead = require('../models/Lead');
const Property = require('../models/Property');
const { authenticateToken, requireCompanyAccess } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { s3Utils, S3_CONFIG } = require('../config/aws');

// Configure multer for temporary file storage (before S3 upload)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and documents are allowed'));
    }
  }
});

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

// @route   POST /api/leads/:id/history
// @desc    Add history entry to lead
// @access  Private
router.post('/:id/history', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { type, date, notes } = req.body;

  if (!type || !date || !notes) {
    return res.status(400).json({
      success: false,
      error: 'Type, date, and notes are required'
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
  const result = await lead.addHistoryEntry({ type, date, notes });
  
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

// @route   PUT /api/leads/:id/history/:entryId
// @desc    Update history entry
// @access  Private
router.put('/:id/history/:entryId', asyncHandler(async (req, res) => {
  const { id, entryId } = req.params;
  const updateData = req.body;

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
  const result = await lead.updateHistoryEntry(entryId, updateData);
  
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

// @route   DELETE /api/leads/:id/history/:entryId
// @desc    Delete history entry
// @access  Private
router.delete('/:id/history/:entryId', asyncHandler(async (req, res) => {
  const { id, entryId } = req.params;

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
  const result = await lead.deleteHistoryEntry(entryId);
  
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

// @route   POST /api/leads/:id/files
// @desc    Add file reference to lead
// @access  Private
router.post('/:id/files', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const fileData = req.body;

  if (!fileData.name || !fileData.type || !fileData.url) {
    return res.status(400).json({
      success: false,
      error: 'Name, type, and url are required'
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
  const result = await lead.addFile(fileData);
  
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

// @route   DELETE /api/leads/:id/files/:fileId
// @desc    Delete file reference from lead and S3
// @access  Private
router.delete('/:id/files/:fileId', asyncHandler(async (req, res) => {
  const { id, fileId } = req.params;

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

  // Find the file to get S3 key before deleting
  const fileToDelete = getResult.data.files.find(file => file.id === fileId);
  
  const lead = new Lead(getResult.data);
  const result = await lead.deleteFile(fileId);
  
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

// @route   POST /api/leads/:id/files/upload
// @desc    Upload file for lead to S3
// @access  Private
router.post('/:id/files/upload', upload.single('file'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded'
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

  try {
    // Generate S3 key for the file
    const fileExtension = path.extname(req.file.originalname);
    const s3Key = `leads/${id}/${uuidv4()}${fileExtension}`;
    
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
      id: uuidv4(),
      name: req.file.originalname,
      type: fileExtension.substring(1).toUpperCase(),
      size: (req.file.size / 1024 / 1024).toFixed(1) + ' MB',
      url: uploadResult.url,
      s3Key: s3Key
    };

    const lead = new Lead(getResult.data);
    const result = await lead.addFile(fileData);
    
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

// @route   POST /api/leads/:id/files/presigned-url
// @desc    Get presigned URL for direct file upload to S3
// @access  Private
router.post('/:id/files/presigned-url', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fileName, contentType } = req.body;

  if (!fileName || !contentType) {
    return res.status(400).json({
      success: false,
      error: 'fileName and contentType are required'
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

  try {
    // Generate S3 key for the file
    const fileExtension = path.extname(fileName);
    const s3Key = `leads/${id}/${uuidv4()}${fileExtension}`;
    
    // Generate presigned URL
    const presignedUrl = s3Utils.generatePresignedUploadUrl(s3Key, contentType);
    
    res.json({
      success: true,
      data: {
        presignedUrl,
        s3Key,
        fileName,
        contentType
      }
    });
  } catch (error) {
    console.error('Presigned URL generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate presigned URL'
    });
  }
}));

module.exports = router;
