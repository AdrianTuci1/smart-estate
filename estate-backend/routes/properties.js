const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const Property = require('../models/Property');
const { authenticateToken, requireCompanyAccess, hasPermission } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { s3Utils, S3_CONFIG } = require('../config/aws');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit (pentru fișiere Excel mari)
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      // PDF documents
      'application/pdf', 
      
      // Word documents
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'application/docx',
      
      // Excel documents
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/vnd.ms-excel.sheet.macroEnabled.12', // .xlsm
      'application/vnd.ms-excel.sheet.binary.macroEnabled.12', // .xlsb
      'text/csv', // .csv
      
      // Text documents
      'text/plain',
      
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tip de fișier nepermis. Sunt acceptate: PDF, DOCX, DOC, XLSX, XLS, XLSM, XLSB, CSV, TXT și imagini.'), false);
    }
  }
});

// Configure multer specifically for images
const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for images
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tip de fișier nepermis. Doar imagini JPEG, PNG, GIF și WEBP sunt acceptate.'), false);
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

  // Generate presigned URLs for main images
  const processedProperties = await Promise.all(result.data.map(async (property) => {
    if (property.mainImage) {
      try {
        // Extract S3 key from URL
        const urlParts = property.mainImage.split('/');
        const s3Key = urlParts.slice(3).join('/'); // Remove protocol, domain, bucket parts
        
        // Generate presigned URL for secure access (24 hours)
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

  // Log properties with main images for debugging
  const propertiesWithMainImages = processedProperties.filter(prop => prop.mainImage);
  const propertiesWithGalleryImages = processedProperties.filter(prop => prop.images && prop.images.length > 0);
  console.log(`GET /properties - Returning ${processedProperties.length} properties, ${propertiesWithMainImages.length} with main images, ${propertiesWithGalleryImages.length} with gallery images`);

  res.json({
    success: true,
    data: processedProperties,
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

  console.log('POST /properties - Request body image field:', {
    hasImage: !!propertyData.image,
    imageType: propertyData.image ? (propertyData.image.startsWith('data:image/') ? 'base64' : 'other') : 'none',
    imageLength: propertyData.image ? propertyData.image.length : 0
  });

  // Process base64 image if provided
  if (propertyData.image && propertyData.image.startsWith('data:image/')) {
    console.log('POST /properties - Processing base64 image for new property');
    try {
      // Extract base64 data
      const base64Data = propertyData.image.split(',')[1];
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Determine file extension from mime type
      const mimeType = propertyData.image.split(',')[0].split(':')[1].split(';')[0];
      const fileExtension = mimeType.split('/')[1];
      
      // Generate S3 key for the image
      const s3Key = `properties/temp-${Date.now()}/main-image.${fileExtension}`;
      
      // Upload image to S3
      const uploadResult = await s3Utils.uploadFile(
        imageBuffer,
        s3Key,
        mimeType
      );

      if (uploadResult.success) {
        // Set as main image/logo, not in gallery images
        propertyData.mainImage = uploadResult.url;
        console.log('Property main image uploaded to S3:', uploadResult.url);
      } else {
        console.error('Failed to upload property main image:', uploadResult.error);
      }
    } catch (error) {
      console.error('Error processing property image:', error);
    }
    
    // Remove the base64 image field as we've processed it
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
    console.log('POST /properties - Reorganizing main image from temp location');
    try {
      const oldUrl = result.data.mainImage;
      const urlParts = oldUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const newS3Key = `properties/${result.data.id}/main-image/${fileName}`;
      
      console.log('POST /properties - Copying from:', urlParts.slice(3).join('/'), 'to:', newS3Key);
      
      // Copy to new location
      const copyResult = await s3Utils.copyFile(
        urlParts.slice(3).join('/'), // old key
        newS3Key // new key
      );
      
      if (copyResult.success) {
        console.log('POST /properties - Copy successful, deleting old file and updating property');
        // Delete old file
        await s3Utils.deleteFile(urlParts.slice(3).join('/'));
        
        // Update property with new URL
        const newUrl = oldUrl.replace(/properties\/temp-\d+\//, `properties/${result.data.id}/main-image/`);
        const property = new Property(result.data);
        const updateResult = await property.update({ mainImage: newUrl });
        
        if (updateResult.success) {
          result.data.mainImage = newUrl;
          console.log('POST /properties - Main image reorganized successfully:', newUrl);
        } else {
          console.error('POST /properties - Failed to update property with new mainImage URL:', updateResult.error);
        }
      } else {
        console.error('POST /properties - Failed to copy main image:', copyResult.error);
      }
    } catch (error) {
      console.error('Error organizing uploaded main image:', error);
    }
  }

  console.log('POST /properties - Returning property data:', {
    id: result.data.id,
    name: result.data.name,
    mainImage: result.data.mainImage,
    hasImages: !!(result.data.images && result.data.images.length > 0)
  });

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
    console.log('PUT /properties/:id - Processing base64 image for property update');
    try {
      // Extract base64 data
      const base64Data = updateData.image.split(',')[1];
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Determine file extension from mime type
      const mimeType = updateData.image.split(',')[0].split(':')[1].split(';')[0];
      const fileExtension = mimeType.split('/')[1];
      
      // Generate S3 key for the image
      const s3Key = `properties/${id}/images/main-image-${Date.now()}.${fileExtension}`;
      
      // Upload image to S3
      const uploadResult = await s3Utils.uploadFile(
        imageBuffer,
        s3Key,
        mimeType
      );

      if (uploadResult.success) {
        // Set as main image/logo, not in gallery images
        updateData.mainImage = uploadResult.url;
        console.log('Property main image updated and uploaded to S3:', uploadResult.url);
      } else {
        console.error('Failed to upload updated property main image:', uploadResult.error);
      }
    } catch (error) {
      console.error('Error processing updated property image:', error);
    }
    
    // Remove the base64 image field as we've processed it
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

// @route   POST /api/properties/:id/images/upload
// @desc    Upload image file for property to S3
// @access  Private
router.post('/:id/images/upload', uploadImage.single('image'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No image uploaded'
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
    // Generate S3 key for the image
    const fileExtension = path.extname(req.file.originalname);
    const s3Key = `properties/${id}/images/${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
    
    // Upload image to S3
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

    const property = new Property(getResult.data);
    const result = await property.addImage(uploadResult.url);
    
    if (!result.success) {
      // If database update fails, delete the image from S3
      await s3Utils.deleteFile(s3Key);
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data,
      imageUrl: uploadResult.url
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Image upload failed'
    });
  }
}));

// @route   POST /api/properties/:id/images
// @desc    Add image URL to property (for external images)
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
  try {
    // Handle both presigned URLs and direct S3 URLs
    let s3Key;
    
    if (decodedImageUrl.includes('X-Amz-Algorithm')) {
      // This is a presigned URL - extract the original S3 URL
      const urlParts = decodedImageUrl.split('?')[0]; // Remove query parameters
      const urlPartsArray = urlParts.split('/');
      const bucketIndex = urlPartsArray.findIndex(part => part.includes('.s3.'));
      s3Key = urlPartsArray.slice(bucketIndex + 1).join('/');
    } else {
      // This is a direct S3 URL
      const urlParts = decodedImageUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part.includes('.s3.'));
      s3Key = urlParts.slice(bucketIndex + 1).join('/');
    }
    
    await s3Utils.deleteFile(s3Key);
  } catch (error) {
    console.error('Error deleting image from S3:', error);
    // Continue even if S3 deletion fails
  }

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
    // If the file is publicly accessible, use the direct URL, otherwise generate presigned URL
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

// @route   GET /api/properties/:id/gallery
// @desc    Get all images for property gallery
// @access  Private
router.get('/:id/gallery', asyncHandler(async (req, res) => {
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

  // Return all images with presigned URLs for secure access
  const images = await Promise.all(
    getResult.data.images.map(async (imageUrl, index) => {
      // Extract S3 key from URL
      const urlParts = imageUrl.split('/');
      const s3Key = urlParts.slice(3).join('/'); // Remove protocol, domain, bucket parts
      
      // Generate presigned URL for secure access
      const presignedUrl = s3Utils.generatePresignedDownloadUrl(s3Key, 3600); // 1 hour expiry
      
      return {
        id: `img_${index}`,
        url: presignedUrl,
        originalUrl: imageUrl, // Keep original URL for deletion
        thumbnail: presignedUrl, // Using same presigned URL for thumbnail
        alt: `Property ${getResult.data.name} - Image ${index + 1}`
      };
    })
  );

  res.json({
    success: true,
    data: {
      propertyId: id,
      propertyName: getResult.data.name,
      images,
      totalImages: images.length
    }
  });
}));

// @route   GET /api/properties/:id/images/:imageIndex/view
// @desc    Get presigned URL for specific image viewing
// @access  Private
router.get('/:id/images/:imageIndex/view', asyncHandler(async (req, res) => {
  const { id, imageIndex } = req.params;
  const index = parseInt(imageIndex);

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

  // Check if image index is valid
  if (index < 0 || index >= getResult.data.images.length) {
    return res.status(404).json({
      success: false,
      error: 'Image not found'
    });
  }

  try {
    const imageUrl = getResult.data.images[index];
    
    // Extract S3 key from URL
    const urlParts = imageUrl.split('/');
    const s3Key = urlParts.slice(3).join('/'); // Remove protocol, domain, bucket parts
    
    // Generate presigned URL for secure access
    const presignedUrl = s3Utils.generatePresignedDownloadUrl(s3Key, 3600); // 1 hour expiry

    res.json({
      success: true,
      data: {
        viewUrl: presignedUrl,
        imageIndex: index,
        propertyId: id
      }
    });
  } catch (error) {
    console.error('Image view URL generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate image view URL'
    });
  }
}));

// @route   POST /api/properties/:id/gallery/bulk-upload
// @desc    Upload multiple images for property gallery
// @access  Private
router.post('/:id/gallery/bulk-upload', uploadImage.array('images', 10), asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No images uploaded'
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
    const uploadResults = [];
    const uploadedUrls = [];

    // Upload all images to S3
    for (const file of req.files) {
      const fileExtension = path.extname(file.originalname);
      const s3Key = `properties/${id}/gallery/${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
      
      const uploadResult = await s3Utils.uploadFile(
        file.buffer,
        s3Key,
        file.mimetype
      );

      if (uploadResult.success) {
        uploadResults.push({
          originalName: file.originalname,
          url: uploadResult.url,
          s3Key: s3Key
        });
        uploadedUrls.push(uploadResult.url);
      }
    }

    // Add all uploaded images to property
    const property = new Property(getResult.data);
    const currentImages = property.images || [];
    const updatedImages = [...currentImages, ...uploadedUrls];
    
    const result = await property.update({ images: updatedImages });
    
    if (!result.success) {
      // If database update fails, delete uploaded images from S3
      for (const upload of uploadResults) {
        await s3Utils.deleteFile(upload.s3Key);
      }
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data,
      uploadedImages: uploadResults.length,
      uploadResults
    });
  } catch (error) {
    console.error('Bulk image upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Bulk image upload failed'
    });
  }
}));

module.exports = router;
