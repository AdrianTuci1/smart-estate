const { google } = require('googleapis');
const { DynamoDBClient, PutItemCommand, GetItemCommand, DeleteItemCommand, DescribeTableCommand, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const fs = require('fs');
const path = require('path');

class GoogleSheetsService {
  constructor() {
    // Initialize DynamoDB client with AWS SDK v3
    this.dynamodb = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    
    this.sheets = google.sheets({ version: 'v4' });
    this.drive = google.drive({ version: 'v3' });
    
    // Initialize auth - will be set when user authenticates
    this.auth = null;
  }

  // Set authentication for the service
  setAuth(auth) {
    this.auth = auth;
    this.sheets = google.sheets({ version: 'v4', auth });
    this.drive = google.drive({ version: 'v3', auth });
  }

  // Get or create OAuth2 client for company
  async getAuthClientForCompany(companyId) {
    try {
      // Check if company has stored credentials
      const credentials = await this.getCompanyCredentials(companyId);
      
      if (credentials) {
        const auth = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI
        );
        
        auth.setCredentials(credentials);
        this.setAuth(auth);
        return auth;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting auth client for company:', error);
      throw error;
    }
  }

  // Get or create OAuth2 client (legacy support for user-based auth)
  async getAuthClient(userId) {
    try {
      // Check if user has stored credentials
      const credentials = await this.getUserCredentials(userId);
      
      if (credentials) {
        const auth = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI
        );
        
        auth.setCredentials(credentials);
        this.setAuth(auth);
        return auth;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting auth client:', error);
      throw error;
    }
  }


  // Get company credentials
  async getCompanyCredentials(companyId) {
    try {
      const params = {
        TableName: 'CompanyGoogleCredentials',
        Key: marshall({ companyId: companyId || '' }, { removeUndefinedValues: true })
      };
      
      const command = new GetItemCommand(params);
      const result = await this.dynamodb.send(command);
      return result.Item ? unmarshall(result.Item).credentials : null;
    } catch (error) {
      console.error('Error getting company credentials:', error);
      return null;
    }
  }

  // Check if company has Google Sheets authorization
  async isCompanyAuthorized(companyId) {
    try {
      const credentials = await this.getCompanyCredentials(companyId);
      return !!credentials;
    } catch (error) {
      console.error('Error checking company authorization:', error);
      return false;
    }
  }

  // Get authorization info for company
  async getCompanyAuthorizationInfo(companyId) {
    try {
      console.log('🔍 Getting authorization info for company:', companyId);
      
      // Try DynamoDB first
      const key = { companyId: companyId || '' };
      console.log('🔑 Looking for key:', JSON.stringify(key, null, 2));
      
      const params = {
        TableName: 'CompanyGoogleCredentials',
        Key: marshall(key, { removeUndefinedValues: true })
      };
      
      console.log('📋 DynamoDB params:', JSON.stringify(params, null, 2));
      
      const command = new GetItemCommand(params);
      const result = await this.dynamodb.send(command);
      console.log('📊 DynamoDB result - has item:', !!result.Item);
      if (result.Item) {
        console.log('📊 DynamoDB result keys:', Object.keys(result.Item));
      }
      
      if (result.Item) {
        const item = unmarshall(result.Item);
        console.log('✅ Found authorization info in DynamoDB for:', companyId);
        console.log('📄 Item data:', JSON.stringify(item, null, 2));
        return {
          isAuthorized: true,
          authorizedBy: item.authorizedBy,
          authorizedAt: item.createdAt,
          lastUpdated: item.updatedAt
        };
      }
      
      console.log('❌ No authorization info found in DynamoDB for:', companyId);
      return { isAuthorized: false };
    } catch (error) {
      console.error('❌ Error getting company authorization info:', error);
      return { isAuthorized: false };
    }
  }

  // Store company credentials (main authorization)
  async storeCompanyCredentials(companyId, credentials, authorizedBy) {
    try {
      console.log('💾 Storing company credentials for:', companyId);
      console.log('📊 Credentials object:', JSON.stringify(credentials, null, 2));
      
      // First, let's verify the table exists
      try {
        const describeCommand = new DescribeTableCommand({ TableName: 'CompanyGoogleCredentials' });
        const describeResult = await this.dynamodb.send(describeCommand);
        console.log('📋 Table exists, status:', describeResult.Table.TableStatus);
      } catch (describeError) {
        console.error('❌ Table does not exist or cannot access:', describeError.message);
        throw new Error('CompanyGoogleCredentials table not accessible');
      }
      
      // Try DynamoDB first
      const item = {
        companyId: companyId || '',
        credentials: credentials || {},
        authorizedBy: authorizedBy || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('📝 Item to store:', JSON.stringify(item, null, 2));
      
      const params = {
        TableName: 'CompanyGoogleCredentials',
        Item: marshall(item, {
          removeUndefinedValues: true
        })
      };
      
      console.log('📤 About to call putItem with params:', JSON.stringify(params, null, 2));
      
      const putCommand = new PutItemCommand(params);
      const putResult = await this.dynamodb.send(putCommand);
      console.log('📥 putItem result:', putResult);
      console.log('✅ Successfully stored credentials in DynamoDB for:', companyId);
      
      // Wait a moment and verify the item was saved
      setTimeout(async () => {
        try {
          console.log('🔄 Verifying item was saved...');
          const verifyParams = {
            TableName: 'CompanyGoogleCredentials',
            Key: marshall({ companyId: companyId || '' }, { removeUndefinedValues: true })
          };
          const verifyCommand = new GetItemCommand(verifyParams);
          const verifyResult = await this.dynamodb.send(verifyCommand);
          console.log('✅ Verification - item exists:', !!verifyResult.Item);
        } catch (verifyError) {
          console.error('❌ Verification failed:', verifyError.message);
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error storing company credentials:', error);
      throw error;
    }
  }

  // Get company credentials (main authorization)
  async getCompanyCredentials(companyId) {
    try {
      console.log('🔍 Getting company credentials for:', companyId);
      
      // Try DynamoDB first
      const params = {
        TableName: 'CompanyGoogleCredentials',
        Key: marshall({ companyId: companyId || '' }, { removeUndefinedValues: true })
      };
      
      const command = new GetItemCommand(params);
      const result = await this.dynamodb.send(command);
      if (result.Item) {
        const credentials = unmarshall(result.Item).credentials;
        console.log('✅ Found credentials in DynamoDB for:', companyId);
        return credentials;
      }
      
      console.log('❌ No credentials found in DynamoDB for:', companyId);
      return null;
    } catch (error) {
      console.error('❌ Error getting company credentials:', error);
      return null;
    }
  }

  // Create a new spreadsheet
  async createSpreadsheet(title, propertyId) {
    try {
      if (!this.auth) {
        throw new Error('Not authenticated with Google Sheets');
      }

      const resource = {
        properties: {
          title: title || `Property ${propertyId} - Spreadsheet`
        }
      };

      const response = await this.sheets.spreadsheets.create({
        resource,
        fields: 'spreadsheetId,spreadsheetUrl,properties.title'
      });

      const spreadsheetId = response.data.spreadsheetId;
      const spreadsheetUrl = response.data.spreadsheetUrl;
      const fileId = `gs_${spreadsheetId}`;

      // Store spreadsheet reference in database
      await this.storeSpreadsheetReference(propertyId, spreadsheetId, title, spreadsheetUrl);

      // Set permissions to allow anyone with the link to edit
      await this.setSpreadsheetPublicPermissions(spreadsheetId);

      // Add Google Sheet to property files array for persistence (only if propertyId is provided)
      if (propertyId) {
        const Property = require('../models/Property');
        const property = await Property.getById(propertyId);
        
        if (property.success && property.data) {
          const propertyInstance = new Property(property.data);
          await propertyInstance.addFile({
            id: fileId,
            name: title || `Property ${propertyId} - Spreadsheet`,
            type: 'GOOGLE_SHEET',
            size: 'Google Sheet',
            url: spreadsheetUrl,
            s3Key: '', // Google Sheets don't have S3 keys
            createdAt: new Date().toISOString(),
            isGoogleSheet: true,
            spreadsheetId: spreadsheetId
          });
        }
      }

      return {
        success: true,
        data: {
          spreadsheetId,
          title: response.data.properties.title,
          spreadsheetUrl,
          createdAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      throw error;
    }
  }

  // Store spreadsheet reference in database
  async storeSpreadsheetReference(propertyId, spreadsheetId, fileName, url) {
    try {
      const params = {
        TableName: 'PropertyGoogleSheets',
        Item: marshall({
          propertyId: propertyId || '',
          spreadsheetId: spreadsheetId || '',
          fileName: fileName || 'Untitled Spreadsheet',
          url: url || '',
          documentType: 'google-sheets', // Add field to distinguish from docs
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, {
          removeUndefinedValues: true
        })
      };
      
      const putCommand = new PutItemCommand(params);
      await this.dynamodb.send(putCommand);
    } catch (error) {
      console.error('Error storing spreadsheet reference:', error);
      throw error;
    }
  }

  // Store document reference in database (using same table as spreadsheets)
  async storeDocumentReference(propertyId, documentId, fileName, url) {
    try {
      const params = {
        TableName: 'PropertyGoogleSheets',
        Item: marshall({
          propertyId: propertyId || '',
          spreadsheetId: documentId || '', // Reuse spreadsheetId field for documentId
          fileName: fileName || 'Untitled Document',
          url: url || '',
          documentType: 'google-docs', // Add field to distinguish from spreadsheets
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, {
          removeUndefinedValues: true
        })
      };
      
      const putCommand = new PutItemCommand(params);
      await this.dynamodb.send(putCommand);
    } catch (error) {
      console.error('Error storing document reference:', error);
      throw error;
    }
  }

  // Get spreadsheets for a property
  async getPropertySpreadsheets(propertyId) {
    try {
      const params = {
        TableName: 'PropertyGoogleSheets',
        FilterExpression: 'propertyId = :propertyId AND (attribute_not_exists(documentType) OR documentType = :documentType)',
        ExpressionAttributeValues: marshall({
          ':propertyId': propertyId || '',
          ':documentType': 'google-sheets'
        }, {
          removeUndefinedValues: true
        })
      };
      
      const scanCommand = new ScanCommand(params);
      const result = await this.dynamodb.send(scanCommand);
      const spreadsheets = result.Items ? result.Items.map(item => unmarshall(item)) : [];
      
      return {
        success: true,
        data: spreadsheets
      };
    } catch (error) {
      console.error('Error getting property spreadsheets:', error);
      throw error;
    }
  }

  // Get documents for a property
  async getPropertyDocuments(propertyId) {
    try {
      const params = {
        TableName: 'PropertyGoogleSheets',
        FilterExpression: 'propertyId = :propertyId AND documentType = :documentType',
        ExpressionAttributeValues: marshall({
          ':propertyId': propertyId || '',
          ':documentType': 'google-docs'
        }, {
          removeUndefinedValues: true
        })
      };
      
      const scanCommand = new ScanCommand(params);
      const result = await this.dynamodb.send(scanCommand);
      const documents = result.Items ? result.Items.map(item => unmarshall(item)) : [];
      
      return {
        success: true,
        data: documents
      };
    } catch (error) {
      console.error('Error getting property documents:', error);
      throw error;
    }
  }

  // Get spreadsheet data
  async getSpreadsheetData(spreadsheetId, range = null) {
    try {
      if (!this.auth) {
        throw new Error('Not authenticated with Google Sheets');
      }

      const actualRange = range || 'Sheet1!A:Z';
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: actualRange
      });

      return {
        success: true,
        data: {
          values: response.data.values || [],
          range: response.data.range
        }
      };
    } catch (error) {
      console.error('Error getting spreadsheet data:', error);
      throw error;
    }
  }

  // Update spreadsheet data
  async updateSpreadsheetData(spreadsheetId, range, values) {
    try {
      if (!this.auth) {
        throw new Error('Not authenticated with Google Sheets');
      }

      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values
        }
      });

      return {
        success: true,
        data: {
          updatedCells: response.data.updatedCells,
          updatedRows: response.data.updatedRows,
          updatedColumns: response.data.updatedColumns
        }
      };
    } catch (error) {
      console.error('Error updating spreadsheet data:', error);
      throw error;
    }
  }

  // Get spreadsheet sheets
  async getSpreadsheetSheets(spreadsheetId) {
    try {
      if (!this.auth) {
        throw new Error('Not authenticated with Google Sheets');
      }

      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'sheets.properties'
      });

      const sheets = response.data.sheets.map(sheet => ({
        sheetId: sheet.properties.sheetId,
        title: sheet.properties.title,
        index: sheet.properties.index
      }));

      return {
        success: true,
        data: sheets
      };
    } catch (error) {
      console.error('Error getting spreadsheet sheets:', error);
      throw error;
    }
  }

  // Convert Excel file to Google Sheet using Google Drive API
  async convertExcelToGoogleSheet(propertyId, file) {
    try {
      if (!this.auth) {
        throw new Error('Not authenticated with Google Sheets');
      }

      // Get the file name - handle both originalname and name properties
      const fileName = file.originalname || file.name || 'Untitled Spreadsheet';
      console.log('🔄 Converting Excel file to Google Sheets:', fileName);
      
      // Upload Excel file directly to Google Drive and convert to Google Sheets
      const { Readable } = require('stream');
      
      // Convert buffer to stream for Google Drive API
      const fileStream = new Readable();
      fileStream.push(file.buffer);
      fileStream.push(null); // End the stream
      
      const media = {
        mimeType: file.mimetype || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body: fileStream
      };

      const fileMetadata = {
        name: fileName,
        mimeType: 'application/vnd.google-apps.spreadsheet' // This converts to Google Sheets format
      };

      console.log('📤 Uploading to Google Drive with conversion...');
      const driveResponse = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id,name,webViewLink,mimeType'
      });

      const spreadsheetId = driveResponse.data.id;
      const spreadsheetUrl = driveResponse.data.webViewLink;
      const fileId = `gs_${spreadsheetId}`;

      console.log('✅ Excel converted to Google Sheets:', {
        spreadsheetId,
        fileName,
        spreadsheetUrl
      });

      // Store spreadsheet reference in database
      await this.storeSpreadsheetReference(propertyId, spreadsheetId, fileName, spreadsheetUrl);

      // Set permissions to allow anyone with the link to edit
      await this.setSpreadsheetPublicPermissions(spreadsheetId);

      // Add Google Sheet to property files array for persistence
      const Property = require('../models/Property');
      const property = await Property.getById(propertyId);
      
      if (property.success && property.data) {
        const propertyInstance = new Property(property.data);
        await propertyInstance.addFile({
          id: fileId,
          name: fileName,
          type: 'GOOGLE_SHEET',
          size: 'Google Sheet',
          url: spreadsheetUrl,
          s3Key: '', // Google Sheets don't have S3 keys
          createdAt: new Date().toISOString(),
          isGoogleSheet: true,
          spreadsheetId: spreadsheetId
        });
      }

      return {
        success: true,
        data: {
          spreadsheetId,
          fileName: fileName,
          spreadsheetUrl: spreadsheetUrl,
          fileId: fileId,
          fileType: 'GOOGLE_SHEET',
          createdAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error converting Excel to Google Sheet:', error);
      throw error;
    }
  }

  // Convert DOCX file to Google Docs using Google Drive API
  async convertDocxToGoogleDocs(propertyId, file) {
    try {
      if (!this.auth) {
        throw new Error('Not authenticated with Google Drive');
      }

      // Get the file name - handle both originalname and name properties
      const fileName = file.originalname || file.name || 'Untitled Document';
      console.log('🔄 Converting DOCX file to Google Docs:', fileName);
      
      // Upload DOCX file directly to Google Drive and convert to Google Docs
      const { Readable } = require('stream');
      
      // Convert buffer to stream for Google Drive API
      const fileStream = new Readable();
      fileStream.push(file.buffer);
      fileStream.push(null); // End the stream
      
      const media = {
        mimeType: file.mimetype || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        body: fileStream
      };

      const fileMetadata = {
        name: fileName,
        mimeType: 'application/vnd.google-apps.document' // This converts to Google Docs format
      };

      console.log('📤 Uploading to Google Drive with conversion...');
      const driveResponse = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id,name,webViewLink,mimeType'
      });

      const documentId = driveResponse.data.id;
      const documentUrl = driveResponse.data.webViewLink;
      const fileId = `gd_${documentId}`;

      console.log('✅ DOCX converted to Google Docs:', {
        documentId,
        fileName,
        documentUrl
      });

      // Store document reference in database
      await this.storeDocumentReference(propertyId, documentId, fileName, documentUrl);

      // Set permissions to allow anyone with the link to edit
      await this.setDocumentPublicPermissions(documentId);

      // Add Google Docs to property files array for persistence
      const Property = require('../models/Property');
      const property = await Property.getById(propertyId);
      
      if (property.success && property.data) {
        const propertyInstance = new Property(property.data);
        await propertyInstance.addFile({
          id: fileId,
          name: fileName,
          type: 'GOOGLE_DOC',
          size: 'Google Doc',
          url: documentUrl,
          s3Key: '', // Google Docs don't have S3 keys
          createdAt: new Date().toISOString(),
          isGoogleDoc: true,
          documentId: documentId
        });
      }

      return {
        success: true,
        data: {
          documentId,
          fileName: fileName,
          documentUrl: documentUrl,
          fileId: fileId,
          fileType: 'GOOGLE_DOC',
          createdAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error converting DOCX to Google Docs:', error);
      throw error;
    }
  }

  // Export Google Sheet to Excel
  async exportGoogleSheetToExcel(spreadsheetId, format = 'xlsx') {
    try {
      if (!this.auth) {
        throw new Error('Not authenticated with Google Sheets');
      }

      const mimeType = format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/vnd.ms-excel';
      
      const response = await this.drive.files.export({
        fileId: spreadsheetId,
        mimeType
      }, {
        responseType: 'stream'
      });

      // Generate a temporary download URL
      const downloadUrl = await this.generateDownloadUrl(spreadsheetId, format);

      return {
        success: true,
        data: {
          downloadUrl,
          format,
          mimeType
        }
      };
    } catch (error) {
      console.error('Error exporting Google Sheet:', error);
      throw error;
    }
  }

  // Generate download URL for exported file
  async generateDownloadUrl(spreadsheetId, format) {
    try {
      // In a real implementation, you would upload the file to S3 and return a presigned URL
      // For now, we'll return a placeholder URL
      return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=${format}`;
    } catch (error) {
      console.error('Error generating download URL:', error);
      throw error;
    }
  }

  // Set public permissions for spreadsheet (anyone with link can edit)
  async setSpreadsheetPublicPermissions(spreadsheetId) {
    try {
      if (!this.auth) {
        throw new Error('Not authenticated with Google Sheets');
      }

      // Set permission for anyone with the link to edit
      const permission = {
        role: 'writer', // Allows editing
        type: 'anyone', // Anyone with the link
      };

      const response = await this.drive.permissions.create({
        fileId: spreadsheetId,
        resource: permission,
      });

      console.log(`✅ Set public edit permissions for spreadsheet: ${spreadsheetId}`);
      return {
        success: true,
        data: {
          permissionId: response.data.id,
          role: response.data.role,
          type: response.data.type
        }
      };
    } catch (error) {
      console.error('Error setting public permissions:', error);
      // Don't throw error - this is not critical for spreadsheet creation
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Set public permissions for document (anyone with link can edit)
  async setDocumentPublicPermissions(documentId) {
    try {
      if (!this.auth) {
        throw new Error('Not authenticated with Google Drive');
      }

      // Set permission for anyone with the link to edit
      const permission = {
        role: 'writer', // Allows editing
        type: 'anyone', // Anyone with the link
      };

      const response = await this.drive.permissions.create({
        fileId: documentId,
        resource: permission,
      });

      console.log(`✅ Set public edit permissions for document: ${documentId}`);
      return {
        success: true,
        data: {
          permissionId: response.data.id,
          role: response.data.role,
          type: response.data.type
        }
      };
    } catch (error) {
      console.error('Error setting document public permissions:', error);
      // Don't throw error - this is not critical for document creation
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Share spreadsheet
  async shareSpreadsheet(spreadsheetId, email, role = 'reader') {
    try {
      if (!this.auth) {
        throw new Error('Not authenticated with Google Sheets');
      }

      const response = await this.drive.permissions.create({
        fileId: spreadsheetId,
        resource: {
          role,
          type: 'user',
          emailAddress: email
        }
      });

      return {
        success: true,
        data: {
          permissionId: response.data.id,
          role,
          email
        }
      };
    } catch (error) {
      console.error('Error sharing spreadsheet:', error);
      throw error;
    }
  }

  // Get spreadsheet collaborators
  async getSpreadsheetCollaborators(spreadsheetId) {
    try {
      if (!this.auth) {
        throw new Error('Not authenticated with Google Sheets');
      }

      const response = await this.drive.permissions.list({
        fileId: spreadsheetId,
        fields: 'permissions(id,role,emailAddress,displayName)'
      });

      const collaborators = response.data.permissions
        .filter(permission => permission.emailAddress) // Only email-based permissions
        .map(permission => ({
          id: permission.id,
          role: permission.role,
          email: permission.emailAddress,
          displayName: permission.displayName
        }));

      return {
        success: true,
        data: collaborators
      };
    } catch (error) {
      console.error('Error getting collaborators:', error);
      throw error;
    }
  }

  // Unlink spreadsheet from property
  async unlinkSpreadsheetFromProperty(propertyId, spreadsheetId) {
    try {
      const params = {
        TableName: 'PropertyGoogleSheets',
        Key: marshall({
          propertyId: propertyId || '',
          spreadsheetId: spreadsheetId || ''
        }, {
          removeUndefinedValues: true
        })
      };
      
      const deleteCommand = new DeleteItemCommand(params);
      await this.dynamodb.send(deleteCommand);

      // Also remove from property files array
      const Property = require('../models/Property');
      const property = await Property.getById(propertyId);
      
      if (property.success && property.data) {
        const propertyInstance = new Property(property.data);
        const fileId = `gs_${spreadsheetId}`;
        await propertyInstance.deleteFile(fileId);
      }
      
      return {
        success: true,
        message: 'Spreadsheet unlinked successfully'
      };
    } catch (error) {
      console.error('Error unlinking spreadsheet:', error);
      throw error;
    }
  }

  // Unlink document from property
  async unlinkDocumentFromProperty(propertyId, documentId) {
    try {
      const params = {
        TableName: 'PropertyGoogleSheets',
        Key: marshall({
          propertyId: propertyId || '',
          spreadsheetId: documentId || '' // Use spreadsheetId field for documentId
        }, {
          removeUndefinedValues: true
        })
      };
      
      const deleteCommand = new DeleteItemCommand(params);
      await this.dynamodb.send(deleteCommand);

      // Also remove from property files array
      const Property = require('../models/Property');
      const property = await Property.getById(propertyId);
      
      if (property.success && property.data) {
        const propertyInstance = new Property(property.data);
        const fileId = `gd_${documentId}`;
        await propertyInstance.deleteFile(fileId);
      }
      
      return {
        success: true,
        message: 'Document unlinked successfully'
      };
    } catch (error) {
      console.error('Error unlinking document:', error);
      throw error;
    }
  }

  // Get OAuth2 authorization URL for company
  getCompanyAuthUrl(companyId, authorizedBy) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const scopes = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/drive.file'
    ];

    const state = JSON.stringify({ 
      companyId, 
      authorizedBy,
      type: 'company' 
    });

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent', // Force consent screen to ensure refresh token
      scope: scopes,
      state: state // Include company ID and authorized by in state for callback
    });

    return authUrl;
  }

  // Get OAuth2 authorization URL (legacy support)
  getAuthUrl(userId) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const scopes = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/drive.file'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId // Include user ID in state for callback
    });

    return authUrl;
  }

  // Handle OAuth2 callback for company authorization
  async handleCompanyAuthCallback(code, companyId, authorizedBy) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // Store tokens for the company
      await this.storeCompanyCredentials(companyId, tokens, authorizedBy);

      this.setAuth(oauth2Client);

      return {
        success: true,
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          companyId,
          authorizedBy
        }
      };
    } catch (error) {
      console.error('Error handling company auth callback:', error);
      throw error;
    }
  }

  // Handle OAuth2 callback (legacy support)
  async handleAuthCallback(code, userId) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // Store tokens for the user
      await this.storeUserCredentials(userId, tokens);

      this.setAuth(oauth2Client);

      return {
        success: true,
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token
        }
      };
    } catch (error) {
      console.error('Error handling auth callback:', error);
      throw error;
    }
  }
}

module.exports = new GoogleSheetsService();
