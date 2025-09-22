const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const googleSheetsService = require('../services/googleSheetsService');
const multer = require('multer');

// Configure multer for Excel and Word file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'text/plain', // .txt
      'application/docx',
      'application/doc'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel files (.xlsx, .xls), CSV files, Word documents (.docx, .doc), and text files (.txt) are allowed.'), false);
    }
  }
});

// Get all Google Sheets for a property
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    // Extract propertyId from URL if not in params
    let finalPropertyId = propertyId;
    if (!finalPropertyId) {
      const urlMatch = req.originalUrl.match(/\/api\/properties\/([^\/]+)\/google-sheets/);
      if (urlMatch) {
        finalPropertyId = urlMatch[1];
      }
    }
    
    if (!finalPropertyId) {
      return res.status(400).json({
        success: false,
        error: 'Property ID is required'
      });
    }
    
    const result = await googleSheetsService.getPropertySpreadsheets(finalPropertyId);
    res.json(result);
  } catch (error) {
    console.error('Error getting property spreadsheets:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get property spreadsheets'
    });
  }
});

// Create a new Google Sheet for a property
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { title } = req.body;
    
    // Extract propertyId from URL if not in params
    let finalPropertyId = propertyId;
    if (!finalPropertyId) {
      const urlMatch = req.originalUrl.match(/\/api\/properties\/([^\/]+)\/google-sheets/);
      if (urlMatch) {
        finalPropertyId = urlMatch[1];
      }
    }
    
    if (!finalPropertyId) {
      return res.status(400).json({
        success: false,
        error: 'Property ID is required'
      });
    }
    
    // Check if company has Google Sheets authorization
    const isAuthorized = await googleSheetsService.isCompanyAuthorized(req.user.companyId);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: 'Google Sheets is not authorized for this company. Please contact your administrator.'
      });
    }
    
    // Set up authentication for this request using company credentials
    await googleSheetsService.getAuthClientForCompany(req.user.companyId);
    
    const result = await googleSheetsService.createSpreadsheet(title, finalPropertyId);
    res.json(result);
  } catch (error) {
    console.error('Error creating property spreadsheet:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create property spreadsheet'
    });
  }
});

// Convert Excel file to Google Sheet for a property
router.post('/convert', upload.single('file'), authenticateToken, async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    console.log('🔍 Convert route - req.params:', req.params);
    console.log('🔍 Convert route - req.url:', req.url);
    console.log('🔍 Convert route - req.originalUrl:', req.originalUrl);
    console.log('🔍 Convert route - propertyId from params:', propertyId);
    
    // Extract propertyId from URL if not in params
    let finalPropertyId = propertyId;
    if (!finalPropertyId) {
      const urlMatch = req.originalUrl.match(/\/api\/properties\/([^\/]+)\/google-sheets/);
      if (urlMatch) {
        finalPropertyId = urlMatch[1];
        console.log('🔍 Convert route - extracted propertyId from URL:', finalPropertyId);
      }
    }
    
    console.log('🔍 Convert route - final propertyId:', finalPropertyId);
    console.log('🔍 Convert route - req.file:', req.file ? 'Present' : 'Missing');
    
    if (!finalPropertyId) {
      return res.status(400).json({
        success: false,
        error: 'Property ID is required'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'File is required'
      });
    }
    
    // Check if company has Google authorization
    const isAuthorized = await googleSheetsService.isCompanyAuthorized(req.user.companyId);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: 'Google integration is not authorized for this company. Please contact your administrator.'
      });
    }
    
    // Set up authentication for this request using company credentials
    await googleSheetsService.getAuthClientForCompany(req.user.companyId);
    
    // Determine file type and call appropriate conversion method
    const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();
    let result;
    
    if (['xlsx', 'xls', 'csv'].includes(fileExtension)) {
      // Excel files go to Google Sheets
      result = await googleSheetsService.convertExcelToGoogleSheet(finalPropertyId, req.file);
    } else if (['docx', 'doc', 'txt'].includes(fileExtension)) {
      // Word documents go to Google Docs
      result = await googleSheetsService.convertDocxToGoogleDocs(finalPropertyId, req.file);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Unsupported file type'
      });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error converting Excel to Google Sheet:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to convert Excel to Google Sheet'
    });
  }
});

// Link existing Google Sheet to property
router.post('/link', authenticateToken, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { spreadsheetId, fileName } = req.body;
    
    if (!spreadsheetId) {
      return res.status(400).json({
        success: false,
        error: 'Spreadsheet ID is required'
      });
    }
    
    // Set up authentication for this request
    await googleSheetsService.getAuthClient(req.user.id);
    
    // Get spreadsheet info
    const spreadsheetResponse = await googleSheetsService.sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'properties.title,spreadsheetUrl'
    });
    
    const spreadsheetUrl = spreadsheetResponse.data.spreadsheetUrl;
    const title = fileName || spreadsheetResponse.data.properties.title;
    
    // Store the link
    await googleSheetsService.storeSpreadsheetReference(propertyId, spreadsheetId, title, spreadsheetUrl);
    
    res.json({
      success: true,
      data: {
        spreadsheetId,
        fileName: title,
        spreadsheetUrl,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error linking spreadsheet to property:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to link spreadsheet to property'
    });
  }
});

// Unlink Google Sheet from property
router.delete('/:spreadsheetId', authenticateToken, async (req, res) => {
  try {
    const { propertyId, spreadsheetId } = req.params;
    
    const result = await googleSheetsService.unlinkSpreadsheetFromProperty(propertyId, spreadsheetId);
    res.json(result);
  } catch (error) {
    console.error('Error unlinking spreadsheet from property:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to unlink spreadsheet from property'
    });
  }
});

// Get specific Google Sheet data for a property
router.get('/:spreadsheetId/data', authenticateToken, async (req, res) => {
  try {
    const { spreadsheetId } = req.params;
    const { range } = req.query;
    
    // Set up authentication for this request
    await googleSheetsService.getAuthClient(req.user.id);
    
    const result = await googleSheetsService.getSpreadsheetData(spreadsheetId, range);
    res.json(result);
  } catch (error) {
    console.error('Error getting property spreadsheet data:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get spreadsheet data'
    });
  }
});

// Update Google Sheet data for a property
router.put('/:spreadsheetId/data', authenticateToken, async (req, res) => {
  try {
    const { spreadsheetId } = req.params;
    const { range, values } = req.body;
    
    if (!range || !values) {
      return res.status(400).json({
        success: false,
        error: 'Range and values are required'
      });
    }
    
    // Set up authentication for this request
    await googleSheetsService.getAuthClient(req.user.id);
    
    const result = await googleSheetsService.updateSpreadsheetData(spreadsheetId, range, values);
    res.json(result);
  } catch (error) {
    console.error('Error updating property spreadsheet data:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update spreadsheet data'
    });
  }
});

// Share property Google Sheet
router.post('/:spreadsheetId/share', authenticateToken, async (req, res) => {
  try {
    const { spreadsheetId } = req.params;
    const { email, role } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }
    
    // Set up authentication for this request
    await googleSheetsService.getAuthClient(req.user.id);
    
    const result = await googleSheetsService.shareSpreadsheet(spreadsheetId, email, role);
    res.json(result);
  } catch (error) {
    console.error('Error sharing property spreadsheet:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to share spreadsheet'
    });
  }
});

// Get collaborators for property Google Sheet
router.get('/:spreadsheetId/collaborators', authenticateToken, async (req, res) => {
  try {
    const { spreadsheetId } = req.params;
    
    // Set up authentication for this request
    await googleSheetsService.getAuthClient(req.user.id);
    
    const result = await googleSheetsService.getSpreadsheetCollaborators(spreadsheetId);
    res.json(result);
  } catch (error) {
    console.error('Error getting property spreadsheet collaborators:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get collaborators'
    });
  }
});

// Export property Google Sheet to Excel
router.post('/:spreadsheetId/export', authenticateToken, async (req, res) => {
  try {
    const { spreadsheetId } = req.params;
    const { format = 'xlsx' } = req.body;
    
    // Set up authentication for this request
    await googleSheetsService.getAuthClient(req.user.id);
    
    const result = await googleSheetsService.exportGoogleSheetToExcel(spreadsheetId, format);
    res.json(result);
  } catch (error) {
    console.error('Error exporting property spreadsheet:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export spreadsheet'
    });
  }
});

module.exports = router;
