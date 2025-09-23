const express = require('express');
const multer = require('multer');
const router = express.Router();
const Property = require('../../models/Property');
const { authenticateToken, requireCompanyAccess, hasPermission } = require('../../middleware/auth');
const { validate, schemas } = require('../../middleware/validation');
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
      'image/webp'
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

// @route   GET /api/properties
// @desc    Get all properties for the company with pagination
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    status,
    lastKey,
    search 
  } = req.query;
  
  const pageSize = Math.min(parseInt(limit), 100); // Max 100 items per page
  
  let result;
  
  if (search) {
    // Search functionality - load all results and paginate client-side for now
    result = await Property.search(req.user.companyId, search);
    if (result.success) {
      const startIndex = (parseInt(page) - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = result.data.slice(startIndex, endIndex);
      
      return res.json({
        success: true,
        data: paginatedData,
        pagination: {
          page: parseInt(page),
          limit: pageSize,
          total: result.data.length,
          hasMore: endIndex < result.data.length
        }
      });
    }
  } else if (status) {
    // Filter by status - load all results and paginate client-side for now
    result = await Property.getByStatus(req.user.companyId, status);
    if (result.success) {
      const startIndex = (parseInt(page) - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = result.data.slice(startIndex, endIndex);
      
      return res.json({
        success: true,
        data: paginatedData,
        pagination: {
          page: parseInt(page),
          limit: pageSize,
          total: result.data.length,
          hasMore: endIndex < result.data.length
        }
      });
    }
  } else {
    // Paginated results with DynamoDB pagination
    result = await Property.getByCompany(req.user.companyId, pageSize, lastKey ? JSON.parse(decodeURIComponent(lastKey)) : null);
  }

  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: result.error
    });
  }

  // Generate presigned URLs for main images
  const processedProperties = await Promise.all(result.data.map(async (property) => {
    if (property.mainImage) {
      try {
        const urlParts = property.mainImage.split('/');
        const s3Key = urlParts.slice(3).join('/');
        const presignedUrl = s3Utils.generatePresignedDownloadUrl(s3Key, 86400);
        
        return {
          ...property,
          mainImage: presignedUrl
        };
      } catch (error) {
        console.error('Error generating presigned URL for mainImage:', error);
        return property;
      }
    }
    return property;
  }));

  res.json({
    success: true,
    data: processedProperties,
    pagination: {
      page: parseInt(page),
      limit: pageSize,
      hasMore: result.hasMore || false,
      lastKey: result.lastKey ? encodeURIComponent(JSON.stringify(result.lastKey)) : null
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

  // Generate presigned URL for main image if exists
  let processedProperty = result.data;
  if (processedProperty.mainImage) {
    try {
      const urlParts = processedProperty.mainImage.split('/');
      const s3Key = urlParts.slice(3).join('/');
      const presignedUrl = s3Utils.generatePresignedDownloadUrl(s3Key, 86400);
      
      processedProperty = {
        ...processedProperty,
        mainImage: presignedUrl
      };
    } catch (error) {
      console.error('Error generating presigned URL for single property mainImage:', error);
    }
  }

  res.json({
    success: true,
    data: processedProperty
  });
}));

// @route   POST /api/properties
// @desc    Create new property
// @access  Private (Admin, Moderator, PowerUser)
router.post('/', validate(schemas.property), asyncHandler(async (req, res) => {
  // Check if user can manage properties
  if (!hasPermission(req.user.role, 'manage_properties')) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions to create properties'
    });
  }
  
  const propertyData = {
    ...req.body,
    companyId: req.user.companyId
  };

  // Convert position to coordinates for database storage
  if (propertyData.position && !propertyData.coordinates) {
    propertyData.coordinates = propertyData.position;
  }

  // Process base64 image if provided
  if (propertyData.image && propertyData.image.startsWith('data:image/')) {
    try {
      const base64Data = propertyData.image.split(',')[1];
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      const mimeType = propertyData.image.split(',')[0].split(':')[1].split(';')[0];
      const fileExtension = mimeType.split('/')[1];
      
      const s3Key = `properties/temp-${Date.now()}/main-image.${fileExtension}`;
      
      const uploadResult = await s3Utils.uploadFile(
        imageBuffer,
        s3Key,
        mimeType
      );

      if (uploadResult.success) {
        propertyData.mainImage = uploadResult.url;
      }
    } catch (error) {
      console.error('Error processing property image:', error);
    }
    
    delete propertyData.image;
  }

  const result = await Property.create(propertyData);
  
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error
    });
  }

  // Update S3 key with actual property ID for main image
  if (result.data.mainImage && result.data.mainImage.includes('temp-')) {
    try {
      const oldUrl = result.data.mainImage;
      const urlParts = oldUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const newS3Key = `properties/${result.data.id}/main-image/${fileName}`;
      
      const copyResult = await s3Utils.copyFile(
        urlParts.slice(3).join('/'),
        newS3Key
      );
      
      if (copyResult.success) {
        await s3Utils.deleteFile(urlParts.slice(3).join('/'));
        
        const newUrl = oldUrl.replace(/properties\/temp-\d+\//, `properties/${result.data.id}/main-image/`);
        const property = new Property(result.data);
        const updateResult = await property.update({ mainImage: newUrl });
        
        if (updateResult.success) {
          result.data.mainImage = newUrl;
        }
      }
    } catch (error) {
      console.error('Error organizing uploaded main image:', error);
    }
  }

  res.status(201).json({
    success: true,
    data: result.data
  });
}));

// @route   PUT /api/properties/:id
// @desc    Update property
// @access  Private (Admin, Moderator, PowerUser)
router.put('/:id', validate(schemas.property), asyncHandler(async (req, res) => {
  // Check if user can manage properties
  if (!hasPermission(req.user.role, 'manage_properties')) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions to update properties'
    });
  }
  
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

  // Process base64 image if provided
  if (updateData.image && updateData.image.startsWith('data:image/')) {
    try {
      const base64Data = updateData.image.split(',')[1];
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      const mimeType = updateData.image.split(',')[0].split(':')[1].split(';')[0];
      const fileExtension = mimeType.split('/')[1];
      
      const s3Key = `properties/${id}/images/main-image-${Date.now()}.${fileExtension}`;
      
      const uploadResult = await s3Utils.uploadFile(
        imageBuffer,
        s3Key,
        mimeType
      );

      if (uploadResult.success) {
        updateData.mainImage = uploadResult.url;
      }
    } catch (error) {
      console.error('Error processing updated property image:', error);
    }
    
    delete updateData.image;
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
// @access  Private (Admin, Moderator, PowerUser)
router.delete('/:id', asyncHandler(async (req, res) => {
  // Check if user can manage properties
  if (!hasPermission(req.user.role, 'manage_properties')) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions to delete properties'
    });
  }
  
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

module.exports = router;
