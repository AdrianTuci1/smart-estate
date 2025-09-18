const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Initialize AWS services
const s3 = new AWS.S3();
const ses = new AWS.SES();
const textract = new AWS.Textract({
  apiVersion: '2018-06-27'
});

// S3 Configuration
const S3_CONFIG = {
  BUCKET_NAME: process.env.S3_BUCKET_NAME || 'estate-app-files',
  REGION: process.env.AWS_REGION || 'us-east-1'
};

// S3 Utility functions
const s3Utils = {
  // Upload file to S3
  uploadFile: async (file, key, contentType) => {
    const params = {
      Bucket: S3_CONFIG.BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType
      // ACL removed - using bucket policy instead for public access
    };

    try {
      const result = await s3.upload(params).promise();
      return {
        success: true,
        url: result.Location,
        key: key
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Delete file from S3
  deleteFile: async (key) => {
    const params = {
      Bucket: S3_CONFIG.BUCKET_NAME,
      Key: key
    };

    try {
      await s3.deleteObject(params).promise();
      return { success: true };
    } catch (error) {
      console.error('S3 delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Generate presigned URL for file upload
  generatePresignedUploadUrl: (key, contentType, expiresIn = 3600) => {
    const params = {
      Bucket: S3_CONFIG.BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      Expires: expiresIn
    };

    return s3.getSignedUrl('putObject', params);
  },

  // Generate presigned URL for file download
  generatePresignedDownloadUrl: (key, expiresIn = 3600) => {
    const params = {
      Bucket: S3_CONFIG.BUCKET_NAME,
      Key: key,
      Expires: expiresIn
    };

    return s3.getSignedUrl('getObject', params);
  },

  // List files in a directory
  listFiles: async (prefix = '') => {
    const params = {
      Bucket: S3_CONFIG.BUCKET_NAME,
      Prefix: prefix
    };

    try {
      const result = await s3.listObjectsV2(params).promise();
      return {
        success: true,
        files: result.Contents.map(item => ({
          key: item.Key,
          url: `https://${S3_CONFIG.BUCKET_NAME}.s3.${S3_CONFIG.REGION}.amazonaws.com/${item.Key}`,
          size: item.Size,
          lastModified: item.LastModified
        }))
      };
    } catch (error) {
      console.error('S3 list error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// Textract utility functions
const textractUtils = {
  // Extract text from document (PDF, images)
  extractTextFromDocument: async (bucket, key) => {
    try {
      const params = {
        Document: {
          S3Object: {
            Bucket: bucket,
            Name: key
          }
        }
      };

      const result = await textract.detectDocumentText(params).promise();
      
      // Extract text from blocks
      const textBlocks = result.Blocks.filter(block => block.BlockType === 'LINE');
      const extractedText = textBlocks.map(block => block.Text).join('\n');
      
      // Parse apartment data from extracted text
      const apartmentData = textractUtils.parseApartmentData(extractedText);
      
      return { 
        success: true, 
        data: { 
          rawText: extractedText,
          apartmentData: apartmentData
        } 
      };
    } catch (error) {
      console.error('Textract error:', error);
      return { success: false, error: error.message };
    }
  },

  // Parse apartment data from extracted text
  parseApartmentData: (text) => {
    const apartmentData = {
      apartmentNumber: null,
      rooms: null,
      area: null,
      price: null,
      notes: 'Date extrase automat din document'
    };

    // Extract apartment number (patterns like A12, B5, C301, Ap. 15, etc.)
    const apartmentNumberRegex = /(?:ap(?:artament)?\.?\s*)?([A-Z]?\d+[A-Z]?)/i;
    const apartmentMatch = text.match(apartmentNumberRegex);
    if (apartmentMatch) {
      apartmentData.apartmentNumber = apartmentMatch[1].toUpperCase();
    }

    // Extract rooms (patterns like "3 camere", "3 rooms", "3r", etc.)
    const roomsRegex = /(\d+)\s*(?:camere?|rooms?|r\b)/i;
    const roomsMatch = text.match(roomsRegex);
    if (roomsMatch) {
      apartmentData.rooms = parseInt(roomsMatch[1]);
    }

    // Extract area (patterns like "75 mp", "75 m²", "75 sqm", "75 m2", etc.)
    const areaRegex = /(\d+(?:\.\d+)?)\s*(?:mp|m²|sqm|m2)/i;
    const areaMatch = text.match(areaRegex);
    if (areaMatch) {
      apartmentData.area = parseFloat(areaMatch[1]);
    }

    // Extract price (patterns like "150000 €", "150,000 EUR", "150000 lei", etc.)
    const priceRegex = /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:€|EUR|euro|lei|RON)/i;
    const priceMatch = text.match(priceRegex);
    if (priceMatch) {
      // Remove commas and convert to number
      const priceStr = priceMatch[1].replace(/,/g, '');
      apartmentData.price = parseFloat(priceStr);
    }

    // If no specific data found, try to extract any numbers that might be relevant
    if (!apartmentData.apartmentNumber && !apartmentData.rooms && !apartmentData.area && !apartmentData.price) {
      const numbers = text.match(/\d+/g);
      if (numbers) {
        // Try to identify what each number might be based on context
        numbers.forEach(num => {
          const numValue = parseInt(num);
          if (numValue >= 1 && numValue <= 10 && !apartmentData.rooms) {
            // Likely number of rooms
            apartmentData.rooms = numValue;
          } else if (numValue >= 20 && numValue <= 200 && !apartmentData.area) {
            // Likely area in square meters
            apartmentData.area = numValue;
          } else if (numValue >= 50000 && !apartmentData.price) {
            // Likely price
            apartmentData.price = numValue;
          }
        });
      }
    }

    return apartmentData;
  },

  // Extract text from image specifically
  extractTextFromImage: async (bucket, key) => {
    try {
      const params = {
        Document: {
          S3Object: {
            Bucket: bucket,
            Name: key
          }
        }
      };

      const result = await textract.detectDocumentText(params).promise();
      
      // Extract text from blocks
      const textBlocks = result.Blocks.filter(block => block.BlockType === 'LINE');
      const extractedText = textBlocks.map(block => block.Text).join('\n');
      
      // Parse apartment data from extracted text
      const apartmentData = textractUtils.parseApartmentData(extractedText);
      
      return { 
        success: true, 
        data: { 
          rawText: extractedText,
          apartmentData: apartmentData
        } 
      };
    } catch (error) {
      console.error('Textract image processing error:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = {
  s3,
  ses,
  textract,
  AWS,
  S3_CONFIG,
  s3Utils,
  textractUtils
};
