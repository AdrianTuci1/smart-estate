const { v4: uuidv4 } = require('uuid');
const { dynamoDB, TABLES } = require('../config/database');
const { containsNormalized } = require('../utils/textNormalizer');

class Apartment {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.propertyId = data.propertyId; // Reference to the property
    this.apartmentNumber = data.apartmentNumber; // A12, B5, C301, etc.
    this.rooms = data.rooms || null; // Number of rooms
    this.area = data.area || null; // Square meters
    this.price = data.price || null; // Price in euros
    this.images = data.images || [];
    this.documents = data.documents || []; // PDFs, contracts, etc.
    this.companyId = data.companyId;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Create a new apartment
  static async create(data) {
    const apartment = new Apartment(data);
    
    const params = {
      TableName: TABLES.APARTMENTS,
      Item: apartment
    };

    try {
      await dynamoDB.put(params).promise();
      return { success: true, data: apartment };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get apartment by ID
  static async getById(id) {
    const params = {
      TableName: TABLES.APARTMENTS,
      Key: { id }
    };

    try {
      const result = await dynamoDB.get(params).promise();
      return { success: true, data: result.Item || null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get apartments by property ID
  static async getByProperty(propertyId, limit = 50, lastKey = null) {
    const params = {
      TableName: TABLES.APARTMENTS,
      IndexName: 'PropertyIdIndex',
      KeyConditionExpression: 'propertyId = :propertyId',
      ExpressionAttributeValues: {
        ':propertyId': propertyId
      },
      Limit: limit,
      ScanIndexForward: false // Sort by creation date descending
    };

    if (lastKey) {
      params.ExclusiveStartKey = lastKey;
    }

    try {
      const result = await dynamoDB.query(params).promise();
      return { 
        success: true, 
        data: result.Items,
        lastKey: result.LastEvaluatedKey,
        hasMore: !!result.LastEvaluatedKey
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get apartments by company
  static async getByCompany(companyId, limit = 50, lastKey = null) {
    const params = {
      TableName: TABLES.APARTMENTS,
      IndexName: 'CompanyIdIndex',
      KeyConditionExpression: 'companyId = :companyId',
      ExpressionAttributeValues: {
        ':companyId': companyId
      },
      Limit: limit,
      ScanIndexForward: false
    };

    if (lastKey) {
      params.ExclusiveStartKey = lastKey;
    }

    try {
      const result = await dynamoDB.query(params).promise();
      return { 
        success: true, 
        data: result.Items,
        lastKey: result.LastEvaluatedKey,
        hasMore: !!result.LastEvaluatedKey
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Search apartments by apartment number or property (case-insensitive and diacritic-insensitive)
  static async search(companyId, searchTerm) {
    try {
      // First, get all apartments for the company
      const params = {
        TableName: TABLES.APARTMENTS,
        IndexName: 'CompanyIdIndex',
        KeyConditionExpression: 'companyId = :companyId',
        ExpressionAttributeValues: {
          ':companyId': companyId
        }
      };

      const result = await dynamoDB.query(params).promise();
      
      // Filter apartments using normalized text comparison
      const filteredResults = result.Items.filter(apartment => {
        const apartmentNumber = apartment.apartmentNumber || '';
        const propertyId = apartment.propertyId || '';
        
        // Check if search term is contained in apartment number or property ID (case-insensitive and diacritic-insensitive)
        return containsNormalized(apartmentNumber, searchTerm) || containsNormalized(propertyId, searchTerm);
      });

      return { success: true, data: filteredResults };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update apartment
  async update(updateData) {
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(updateData).forEach((key, index) => {
      if (key !== 'id' && key !== 'createdAt') {
        updateExpressions.push(`#attr${index} = :val${index}`);
        expressionAttributeNames[`#attr${index}`] = key;
        expressionAttributeValues[`:val${index}`] = updateData[key];
      }
    });

    if (updateExpressions.length === 0) {
      return { success: false, error: 'No valid fields to update' };
    }

    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const params = {
      TableName: TABLES.APARTMENTS,
      Key: { id: this.id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    try {
      const result = await dynamoDB.update(params).promise();
      return { success: true, data: result.Attributes };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Add image to apartment
  async addImage(imageUrl) {
    if (!this.images.includes(imageUrl)) {
      this.images.push(imageUrl);
      return await this.update({ images: this.images });
    }
    return { success: true, data: this };
  }

  // Remove image from apartment
  async removeImage(imageUrl) {
    this.images = this.images.filter(url => url !== imageUrl);
    return await this.update({ images: this.images });
  }

  // Add document to apartment
  async addDocument(document) {
    if (!this.documents) {
      this.documents = [];
    }
    this.documents.push(document);
    return await this.update({ documents: this.documents });
  }

  // Remove document from apartment
  async removeDocument(documentUrl) {
    this.documents = this.documents.filter(doc => doc.url !== documentUrl);
    return await this.update({ documents: this.documents });
  }

  // Delete apartment
  static async delete(id) {
    const params = {
      TableName: TABLES.APARTMENTS,
      Key: { id }
    };

    try {
      await dynamoDB.delete(params).promise();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = Apartment;
