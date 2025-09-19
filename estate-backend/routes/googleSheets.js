const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const googleSheetsService = require('../services/googleSheetsService');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel files (.xlsx, .xls) and CSV files are allowed.'), false);
    }
  }
});

// Company OAuth2 authentication routes
router.get('/auth/company/url', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin of the company
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only company administrators can authorize Google Sheets'
      });
    }

    const authUrl = googleSheetsService.getCompanyAuthUrl(
      req.user.companyId, 
      req.user.id
    );
    
    res.json({
      success: true,
      data: {
        authUrl
      }
    });
  } catch (error) {
    console.error('Error generating company auth URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate authentication URL'
    });
  }
});

router.post('/auth/company/callback', authenticateToken, async (req, res) => {
  try {
    const { code, state } = req.body;
    
    if (!code || !state) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code and state are required'
      });
    }

    // Parse state to get company info
    const stateData = JSON.parse(state);
    const { companyId, authorizedBy, type } = stateData;

    if (type !== 'company') {
      return res.status(400).json({
        success: false,
        error: 'Invalid authorization type'
      });
    }

    // Verify the user is admin of this company
    if (req.user.companyId !== companyId || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to authorize Google Sheets for this company'
      });
    }

    const result = await googleSheetsService.handleCompanyAuthCallback(
      code, 
      companyId, 
      authorizedBy
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error handling company auth callback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete company authentication'
    });
  }
});

// GET callback route for Google OAuth redirect
router.get('/auth/company/callback', async (req, res) => {
  try {
    console.log('🔗 Company callback received:', req.query);
    const { code, state, error } = req.query;
    
    if (error) {
      console.log('❌ Auth error:', error);
      return res.redirect(`${process.env.CORS_ORIGIN || 'http://localhost:5173'}/admin/settings?auth_error=${encodeURIComponent(error)}`);
    }
    
    if (!code || !state) {
      console.log('❌ Missing code or state');
      return res.redirect(`${process.env.CORS_ORIGIN || 'http://localhost:5173'}/admin/settings?auth_error=missing_code_or_state`);
    }

    // Parse state to get company info
    const stateData = JSON.parse(state);
    console.log('📋 Parsed state:', stateData);
    const { companyId, authorizedBy, type } = stateData;

    if (type !== 'company') {
      console.log('❌ Invalid auth type:', type);
      return res.redirect(`${process.env.CORS_ORIGIN || 'http://localhost:5173'}/admin/settings?auth_error=invalid_auth_type`);
    }

    console.log('🔄 Processing auth callback for company:', companyId);
    // Store credentials in DynamoDB
    const result = await googleSheetsService.handleCompanyAuthCallback(
      code, 
      companyId, 
      authorizedBy
    );
    
    console.log('✅ Auth callback result:', result);
    
    if (result.success) {
      console.log('🎉 Redirecting with success');
      return res.redirect(`${process.env.CORS_ORIGIN || 'http://localhost:5173'}?auth_success=true&view=settings`);
    } else {
      console.log('❌ Redirecting with error:', result.error);
      return res.redirect(`${process.env.CORS_ORIGIN || 'http://localhost:5173'}?auth_error=${encodeURIComponent(result.error || 'Authorization failed')}&view=settings`);
    }
  } catch (error) {
    console.error('💥 Error handling company auth callback:', error);
    return res.redirect(`${process.env.CORS_ORIGIN || 'http://localhost:5173'}?auth_error=${encodeURIComponent('Internal server error')}&view=settings`);
  }
});

// Legacy callback route - redirect to company callback
router.get('/auth/callback', async (req, res) => {
  try {
    console.log('🔗 Legacy callback received:', req.query);
    const { code, state, error } = req.query;
    
    if (error) {
      console.log('❌ Legacy auth error:', error);
      return res.redirect(`${process.env.CORS_ORIGIN || 'http://localhost:5173'}?auth_error=${encodeURIComponent(error)}&view=settings`);
    }
    
    if (!code || !state) {
      console.log('❌ Legacy missing code or state');
      return res.redirect(`${process.env.CORS_ORIGIN || 'http://localhost:5173'}?auth_error=missing_code_or_state&view=settings`);
    }

    // Parse state to determine if this is a company auth
    const stateData = JSON.parse(state);
    console.log('📋 Legacy parsed state:', stateData);
    
    if (stateData.type === 'company') {
      console.log('🔄 Redirecting to company callback');
      // Redirect to company callback with the same parameters
      const params = new URLSearchParams(req.query);
      return res.redirect(`/api/google-sheets/auth/company/callback?${params.toString()}`);
    }

    // For legacy user auth, handle directly
    console.log('❌ Legacy auth not supported');
    return res.redirect(`${process.env.CORS_ORIGIN || 'http://localhost:5173'}?auth_error=legacy_auth_not_supported&view=settings`);
  } catch (error) {
    console.error('💥 Error in legacy callback:', error);
    return res.redirect(`${process.env.CORS_ORIGIN || 'http://localhost:5173'}?auth_error=${encodeURIComponent('Internal server error')}&view=settings`);
  }
});

// Check company authentication status
router.get('/auth/company/status', authenticateToken, async (req, res) => {
  try {
    const authInfo = await googleSheetsService.getCompanyAuthorizationInfo(req.user.companyId);
    
    res.json({
      success: true,
      data: authInfo
    });
  } catch (error) {
    console.error('Error checking company auth status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check company authentication status'
    });
  }
});

// Legacy OAuth2 authentication routes (for backward compatibility)
router.get('/auth/url', authenticateToken, async (req, res) => {
  try {
    const authUrl = googleSheetsService.getAuthUrl(req.user.id);
    
    res.json({
      success: true,
      data: {
        authUrl
      }
    });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate authentication URL'
    });
  }
});

router.post('/auth/callback', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code is required'
      });
    }

    const result = await googleSheetsService.handleAuthCallback(code, req.user.id);
    
    res.json(result);
  } catch (error) {
    console.error('Error handling auth callback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete authentication'
    });
  }
});

// Check authentication status
router.get('/auth/status', authenticateToken, async (req, res) => {
  try {
    const credentials = await googleSheetsService.getUserCredentials(req.user.id);
    
    res.json({
      success: true,
      data: {
        isAuthenticated: !!credentials
      }
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check authentication status'
    });
  }
});

// Spreadsheet management routes
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { title, propertyId } = req.body;
    
    if (!propertyId) {
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
    
    const result = await googleSheetsService.createSpreadsheet(title, propertyId);
    res.json(result);
  } catch (error) {
    console.error('Error creating spreadsheet:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create spreadsheet'
    });
  }
});

router.get('/:spreadsheetId', authenticateToken, async (req, res) => {
  try {
    const { spreadsheetId } = req.params;
    
    // Set up authentication for this request
    await googleSheetsService.getAuthClient(req.user.id);
    
    const response = await googleSheetsService.sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'properties,sheets.properties'
    });
    
    res.json({
      success: true,
      data: {
        spreadsheetId,
        title: response.data.properties.title,
        sheets: response.data.sheets.map(sheet => ({
          sheetId: sheet.properties.sheetId,
          title: sheet.properties.title,
          index: sheet.properties.index
        }))
      }
    });
  } catch (error) {
    console.error('Error getting spreadsheet:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get spreadsheet'
    });
  }
});

router.get('/:spreadsheetId/values', authenticateToken, async (req, res) => {
  try {
    const { spreadsheetId } = req.params;
    const { range } = req.query;
    
    // Set up authentication for this request
    await googleSheetsService.getAuthClient(req.user.id);
    
    const result = await googleSheetsService.getSpreadsheetData(spreadsheetId, range);
    res.json(result);
  } catch (error) {
    console.error('Error getting spreadsheet data:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get spreadsheet data'
    });
  }
});

router.put('/:spreadsheetId/values/:range', authenticateToken, async (req, res) => {
  try {
    const { spreadsheetId, range } = req.params;
    const { values } = req.body;
    
    if (!values) {
      return res.status(400).json({
        success: false,
        error: 'Values are required'
      });
    }
    
    // Set up authentication for this request
    await googleSheetsService.getAuthClient(req.user.id);
    
    const result = await googleSheetsService.updateSpreadsheetData(spreadsheetId, range, values);
    res.json(result);
  } catch (error) {
    console.error('Error updating spreadsheet data:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update spreadsheet data'
    });
  }
});

router.get('/:spreadsheetId/sheets', authenticateToken, async (req, res) => {
  try {
    const { spreadsheetId } = req.params;
    
    // Set up authentication for this request
    await googleSheetsService.getAuthClient(req.user.id);
    
    const result = await googleSheetsService.getSpreadsheetSheets(spreadsheetId);
    res.json(result);
  } catch (error) {
    console.error('Error getting spreadsheet sheets:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get spreadsheet sheets'
    });
  }
});

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
    console.error('Error sharing spreadsheet:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to share spreadsheet'
    });
  }
});

router.get('/:spreadsheetId/collaborators', authenticateToken, async (req, res) => {
  try {
    const { spreadsheetId } = req.params;
    
    // Set up authentication for this request
    await googleSheetsService.getAuthClient(req.user.id);
    
    const result = await googleSheetsService.getSpreadsheetCollaborators(spreadsheetId);
    res.json(result);
  } catch (error) {
    console.error('Error getting collaborators:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get collaborators'
    });
  }
});

router.post('/:spreadsheetId/export', authenticateToken, async (req, res) => {
  try {
    const { spreadsheetId } = req.params;
    const { format = 'xlsx' } = req.body;
    
    // Set up authentication for this request
    await googleSheetsService.getAuthClient(req.user.id);
    
    const result = await googleSheetsService.exportGoogleSheetToExcel(spreadsheetId, format);
    res.json(result);
  } catch (error) {
    console.error('Error exporting spreadsheet:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export spreadsheet'
    });
  }
});

module.exports = router;
