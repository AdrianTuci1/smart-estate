const { v4: uuidv4 } = require('uuid');
const { dynamoDB, TABLES } = require('../config/database');

class Property {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name || data.address || 'Proprietate fără nume'; // Property name, fallback to address
    this.address = data.address;
    this.status = data.status || 'in-constructie'; // finalizat, in-constructie
    this.companyId = data.companyId;
    this.images = data.images || []; // Array of S3 URLs for gallery
    this.mainImage = data.mainImage || null; // Main image/logo URL
    this.description = data.description || '';
    this.coordinates = data.coordinates || null; // { lat: number, lng: number }
    this.files = data.files || []; // Array of file references
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Create a new property
  static async create(data) {
    const property = new Property(data);
    
    const params = {
      TableName: TABLES.PROPERTIES,
      Item: property
    };

    try {
      await dynamoDB.put(params).promise();
      return { success: true, data: property };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get property by ID
  static async getById(id) {
    const params = {
      TableName: TABLES.PROPERTIES,
      Key: { id }
    };

    try {
      const result = await dynamoDB.get(params).promise();
      return { success: true, data: result.Item || null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get properties by company
  static async getByCompany(companyId, limit = 50, lastKey = null) {
    const params = {
      TableName: TABLES.PROPERTIES,
      IndexName: 'CompanyIdIndex',
      KeyConditionExpression: 'companyId = :companyId',
      ExpressionAttributeValues: {
        ':companyId': companyId
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

  // Search properties by name and address
  static async search(companyId, searchTerm) {
    const params = {
      TableName: TABLES.PROPERTIES,
      IndexName: 'CompanyIdIndex',
      KeyConditionExpression: 'companyId = :companyId',
      FilterExpression: 'contains(#name, :searchTerm) OR contains(address, :searchTerm)',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':companyId': companyId,
        ':searchTerm': searchTerm
      }
    };

    try {
      const result = await dynamoDB.query(params).promise();
      // Format results for search display
      const formattedResults = result.Items.map(property => ({
        ...property,
        type: 'property',
        display: property.name || property.address
      }));
      return { success: true, data: formattedResults };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get properties by status
  static async getByStatus(companyId, status) {
    const params = {
      TableName: TABLES.PROPERTIES,
      IndexName: 'CompanyIdIndex',
      KeyConditionExpression: 'companyId = :companyId',
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':companyId': companyId,
        ':status': status
      }
    };

    try {
      const result = await dynamoDB.query(params).promise();
      return { success: true, data: result.Items };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update property
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
      TableName: TABLES.PROPERTIES,
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

  // Add image to property
  async addImage(imageUrl) {
    if (!this.images.includes(imageUrl)) {
      this.images.push(imageUrl);
      return await this.update({ images: this.images });
    }
    return { success: true, data: this };
  }

  // Remove image from property
  async removeImage(imageUrl) {
    this.images = this.images.filter(url => url !== imageUrl);
    return await this.update({ images: this.images });
  }


  // Add file reference
  async addFile(fileData) {
    const fileEntry = {
      id: fileData.id || require('uuid').v4(),
      name: fileData.name,
      type: fileData.type,
      size: fileData.size,
      url: fileData.url,
      s3Key: fileData.s3Key,
      createdAt: fileData.createdAt || new Date().toISOString()
    };

    this.files.push(fileEntry);
    return await this.update({ files: this.files });
  }

  // Delete file reference
  async deleteFile(fileId) {
    this.files = this.files.filter(file => file.id !== fileId);
    return await this.update({ files: this.files });
  }

  // Delete property
  static async delete(id) {
    const params = {
      TableName: TABLES.PROPERTIES,
      Key: { id }
    };

    try {
      await dynamoDB.delete(params).promise();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get properties within coordinates range (for map view)
  static async getByCoordinates(companyId, bounds) {
    const params = {
      TableName: TABLES.PROPERTIES,
      IndexName: 'CompanyIdIndex',
      KeyConditionExpression: 'companyId = :companyId',
      FilterExpression: 'coordinates.lat BETWEEN :minLat AND :maxLat AND coordinates.lng BETWEEN :minLng AND :maxLng',
      ExpressionAttributeValues: {
        ':companyId': companyId,
        ':minLat': bounds.south,
        ':maxLat': bounds.north,
        ':minLng': bounds.west,
        ':maxLng': bounds.east
      }
    };

    try {
      const result = await dynamoDB.query(params).promise();
      return { success: true, data: result.Items };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = Property;
