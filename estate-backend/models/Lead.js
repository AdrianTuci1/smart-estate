const { v4: uuidv4 } = require('uuid');
const { dynamoDB, TABLES } = require('../config/database');

class Lead {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.phone = data.phone;
    this.email = data.email || null;
    this.companyId = data.companyId;
    this.propertiesOfInterest = data.propertiesOfInterest || []; // Array of property IDs
    this.notes = data.notes || '';
    this.status = data.status || 'active'; // active, contacted, converted, lost
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Create a new lead
  static async create(data) {
    const lead = new Lead(data);
    
    const params = {
      TableName: TABLES.LEADS,
      Item: lead
    };

    try {
      await dynamoDB.put(params).promise();
      return { success: true, data: lead };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get lead by ID
  static async getById(id) {
    const params = {
      TableName: TABLES.LEADS,
      Key: { id }
    };

    try {
      const result = await dynamoDB.get(params).promise();
      return { success: true, data: result.Item || null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get leads by company
  static async getByCompany(companyId, limit = 50, lastKey = null) {
    const params = {
      TableName: TABLES.LEADS,
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

  // Search leads by name or phone
  static async search(companyId, searchTerm) {
    const params = {
      TableName: TABLES.LEADS,
      IndexName: 'CompanyIdIndex',
      KeyConditionExpression: 'companyId = :companyId',
      FilterExpression: 'contains(#name, :searchTerm) OR contains(phone, :searchTerm)',
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
      return { success: true, data: result.Items };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update lead
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
      TableName: TABLES.LEADS,
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

  // Add property to interest list
  async addPropertyInterest(propertyId) {
    if (!this.propertiesOfInterest.includes(propertyId)) {
      this.propertiesOfInterest.push(propertyId);
      return await this.update({ propertiesOfInterest: this.propertiesOfInterest });
    }
    return { success: true, data: this };
  }

  // Remove property from interest list
  async removePropertyInterest(propertyId) {
    this.propertiesOfInterest = this.propertiesOfInterest.filter(id => id !== propertyId);
    return await this.update({ propertiesOfInterest: this.propertiesOfInterest });
  }

  // Delete lead
  static async delete(id) {
    const params = {
      TableName: TABLES.LEADS,
      Key: { id }
    };

    try {
      await dynamoDB.delete(params).promise();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get leads by property interest
  static async getByPropertyInterest(companyId, propertyId) {
    const params = {
      TableName: TABLES.LEADS,
      IndexName: 'CompanyIdIndex',
      KeyConditionExpression: 'companyId = :companyId',
      FilterExpression: 'contains(propertiesOfInterest, :propertyId)',
      ExpressionAttributeValues: {
        ':companyId': companyId,
        ':propertyId': propertyId
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

module.exports = Lead;
