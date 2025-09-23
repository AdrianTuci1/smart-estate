const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const Property = require('../../models/Property');
const { authenticateToken, requireCompanyAccess } = require('../../middleware/auth');
const { asyncHandler } = require('../../middleware/errorHandler');
const { s3Utils } = require('../../config/aws');

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

// Apply middleware to all routes
router.use(authenticateToken);
router.use(requireCompanyAccess);

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
      const urlParts = decodedImageUrl.split('?')[0];
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
  }

  res.json({
    success: true,
    data: result.data
  });
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
      const s3Key = urlParts.slice(3).join('/');
      
      // Generate presigned URL for secure access
      const presignedUrl = s3Utils.generatePresignedDownloadUrl(s3Key, 3600);
      
      return {
        id: `img_${index}`,
        url: presignedUrl,
        originalUrl: imageUrl,
        thumbnail: presignedUrl,
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
    const s3Key = urlParts.slice(3).join('/');
    
    // Generate presigned URL for secure access
    const presignedUrl = s3Utils.generatePresignedDownloadUrl(s3Key, 3600);

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
