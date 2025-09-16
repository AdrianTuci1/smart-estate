const express = require('express');
const multer = require('multer');
const router = express.Router();
const Apartment = require('../models/Apartment');
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
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tip de fișier nepermis. Doar PDF, DOCX, DOC, TXT și imagini sunt acceptate.'), false);
    }
  }
});

// Apply authentication and company access middleware to all routes
router.use(authenticateToken);
router.use(requireCompanyAccess);

// @route   GET /api/apartments
// @desc    Get all apartments for the company
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, propertyId } = req.query;
  
  let result;
  if (propertyId) {
    result = await Apartment.getByProperty(propertyId, parseInt(limit));
  } else {
    result = await Apartment.getByCompany(req.user.companyId, parseInt(limit));
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

// @route   GET /api/apartments/:id
// @desc    Get single apartment by ID
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await Apartment.getById(id);
  
  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: result.error
    });
  }

  if (!result.data) {
    return res.status(404).json({
      success: false,
      error: 'Apartment not found'
    });
  }

  // Check if apartment belongs to user's company
  if (result.data.companyId !== req.user.companyId) {
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

// @route   POST /api/apartments
// @desc    Create new apartment
// @access  Private
router.post('/', validate(schemas.apartment), asyncHandler(async (req, res) => {
  const apartmentData = {
    ...req.body,
    companyId: req.user.companyId
  };

  // Verify that the property exists and belongs to the company
  const propertyResult = await Property.getById(apartmentData.propertyId);
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

  const result = await Apartment.create(apartmentData);
  
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

// @route   PUT /api/apartments/:id
// @desc    Update apartment
// @access  Private
router.put('/:id', validate(schemas.apartment), asyncHandler(async (req, res) => {
  const { id } = req.params;

  // First, get the apartment to check ownership
  const getResult = await Apartment.getById(id);
  
  if (!getResult.success || !getResult.data) {
    return res.status(404).json({
      success: false,
      error: 'Apartment not found'
    });
  }

  if (getResult.data.companyId !== req.user.companyId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  // If propertyId is being changed, verify the new property exists
  if (req.body.propertyId && req.body.propertyId !== getResult.data.propertyId) {
    const propertyResult = await Property.getById(req.body.propertyId);
    if (!propertyResult.success || !propertyResult.data) {
      return res.status(404).json({
        success: false,
        error: 'New property not found'
      });
    }

    if (propertyResult.data.companyId !== req.user.companyId) {
      return res.status(403).json({
        success: false,
        error: 'New property access denied'
      });
    }
  }

  const apartment = new Apartment(getResult.data);
  const result = await apartment.update(req.body);
  
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

// @route   DELETE /api/apartments/:id
// @desc    Delete apartment
// @access  Private
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // First, get the apartment to check ownership
  const getResult = await Apartment.getById(id);
  
  if (!getResult.success || !getResult.data) {
    return res.status(404).json({
      success: false,
      error: 'Apartment not found'
    });
  }

  if (getResult.data.companyId !== req.user.companyId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  // Delete associated images and documents from S3
  if (getResult.data.images && getResult.data.images.length > 0) {
    for (const imageUrl of getResult.data.images) {
      const key = imageUrl.split('/').pop();
      await s3Utils.deleteFile(`apartments/${id}/images/${key}`);
    }
  }

  if (getResult.data.documents && getResult.data.documents.length > 0) {
    for (const doc of getResult.data.documents) {
      const key = doc.url.split('/').pop();
      await s3Utils.deleteFile(`apartments/${id}/documents/${key}`);
    }
  }

  const result = await Apartment.delete(id);
  
  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: result.error
    });
  }

  res.json({
    success: true,
    message: 'Apartment deleted successfully'
  });
}));

// @route   POST /api/apartments/:id/images
// @desc    Upload image for apartment
// @access  Private
router.post('/:id/images', upload.single('image'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No image uploaded'
    });
  }

  // First, get the apartment to check ownership
  const getResult = await Apartment.getById(id);
  
  if (!getResult.success || !getResult.data) {
    return res.status(404).json({
      success: false,
      error: 'Apartment not found'
    });
  }

  if (getResult.data.companyId !== req.user.companyId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  try {
    // Upload file to S3
    const fileExtension = req.file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const s3Key = `apartments/${id}/images/${fileName}`;
    
    const uploadResult = await s3Utils.uploadFile(req.file.buffer, s3Key, req.file.mimetype);
    
    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to upload image to storage'
      });
    }

    // Add image to apartment
    const apartment = new Apartment(getResult.data);
    const result = await apartment.addImage(uploadResult.data.url);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save image metadata'
      });
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process image upload'
    });
  }
}));

// @route   POST /api/apartments/:id/documents
// @desc    Upload document for apartment and extract data
// @access  Private
router.post('/:id/documents', upload.single('file'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded'
    });
  }

  // First, get the apartment to check ownership
  const getResult = await Apartment.getById(id);
  
  if (!getResult.success || !getResult.data) {
    return res.status(404).json({
      success: false,
      error: 'Apartment not found'
    });
  }

  if (getResult.data.companyId !== req.user.companyId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  try {
    // Upload file to S3
    const fileExtension = req.file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const s3Key = `apartments/${id}/documents/${fileName}`;
    
    const uploadResult = await s3Utils.uploadFile(req.file.buffer, s3Key, req.file.mimetype);
    
    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to upload file to storage'
      });
    }

    // Extract data using AWS Textract
    let extractedData = {
      area: null,
      rooms: null,
      price: null,
      apartmentNumber: null,
      notes: 'Document încărcat cu succes.'
    };

    try {
      const textractResult = await textractUtils.extractTextFromDocument(
        S3_CONFIG.BUCKET_NAME, 
        s3Key
      );
      
      if (textractResult.success) {
        extractedData = textractResult.data.apartmentData;
        console.log('Textract extraction successful:', extractedData);
      } else {
        console.log('Textract extraction failed:', textractResult.error);
        extractedData.notes = 'Document încărcat cu succes, dar extragerea automată a datelor a eșuat.';
      }
    } catch (textractError) {
      console.error('Textract processing error:', textractError);
      extractedData.notes = 'Document încărcat cu succes, dar extragerea automată a datelor a eșuat.';
    }

    // Create document object
    const document = {
      url: uploadResult.data.url,
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
      extractedData: extractedData
    };

    // Add document to apartment
    const apartment = new Apartment(getResult.data);
    const updateResult = await apartment.addDocument(document);
    
    if (!updateResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save document metadata'
      });
    }

    res.json({
      success: true,
      data: {
        document: document,
        fileUrl: uploadResult.data.url,
        extractedData: extractedData
      }
    });

  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process document upload'
    });
  }
}));

module.exports = router;
