const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const Property = require('../../models/Property');
const { authenticateToken, requireCompanyAccess } = require('../../middleware/auth');
const { asyncHandler } = require('../../middleware/errorHandler');
const { s3Utils } = require('../../config/aws');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.ms-excel.sheet.macroEnabled.12',
      'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
      'text/csv',
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/docx',
      'application/doc',
      'application/txt',
      'application/pdf',
      'application/xls',
      'application/xlsx',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tip de fișier nepermis.'), false);
    }
  }
});

// Apply middleware to all routes
router.use(authenticateToken);
router.use(requireCompanyAccess);

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
    const s3Key = `properties/${id}/files/${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
    
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
    }
  }

  res.json({
    success: true,
    data: result.data
  });
}));

// @route   GET /api/properties/:id/files/:fileId/download
// @desc    Get presigned URL for file download
// @access  Private
router.get('/:id/files/:fileId/download', asyncHandler(async (req, res) => {
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

  // Find the file
  const file = getResult.data.files.find(f => f.id === fileId);
  if (!file) {
    return res.status(404).json({
      success: false,
      error: 'File not found'
    });
  }

  try {
    // Generate presigned URL for download
    const downloadUrl = s3Utils.generatePresignedDownloadUrl(file.s3Key, 3600); // 1 hour expiry

    res.json({
      success: true,
      data: {
        downloadUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      }
    });
  } catch (error) {
    console.error('Download URL generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate download URL'
    });
  }
}));

// @route   GET /api/properties/:id/files/:fileId/view
// @desc    Get direct URL for file viewing (opens in browser)
// @access  Private
router.get('/:id/files/:fileId/view', asyncHandler(async (req, res) => {
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

  // Find the file
  const file = getResult.data.files.find(f => f.id === fileId);
  if (!file) {
    return res.status(404).json({
      success: false,
      error: 'File not found'
    });
  }

  try {
    // For viewing, we can use the direct S3 URL or generate a presigned URL
    const viewUrl = file.url || s3Utils.generatePresignedDownloadUrl(file.s3Key, 3600);

    res.json({
      success: true,
      data: {
        viewUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      }
    });
  } catch (error) {
    console.error('View URL generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate view URL'
    });
  }
}));

module.exports = router;
