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
    this.status = data.status || 'New'; // New, Attempted, Connected, Progress, Potential, Customer
    this.interest = data.interest || '';
    this.property = data.property || '';
    this.propertyId = data.propertyId || '';
    this.propertyAddress = data.propertyAddress || '';
    this.apartment = data.apartment || '';
    this.apartmentId = data.apartmentId || '';
    this.apartmentRooms = data.apartmentRooms || null;
    this.apartmentArea = data.apartmentArea || null;
    this.apartmentPrice = data.apartmentPrice || null;
    this.history = data.history || []; // Array of history entries
    this.files = data.files || []; // Array of file references
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    
    // If propertyId is provided but not in propertiesOfInterest, add it
    if (this.propertyId && !this.propertiesOfInterest.includes(this.propertyId)) {
      this.propertiesOfInterest.push(this.propertyId);
    }
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
      FilterExpression: 'contains(propertiesOfInterest, :propertyId) OR propertyId = :propertyId',
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

  // Add history entry
  async addHistoryEntry(entry) {
    const historyEntry = {
      id: entry.id || require('uuid').v4(),
      type: entry.type,
      date: entry.date,
      time: entry.time || new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
      notes: entry.notes,
      createdAt: new Date().toISOString()
    };

    this.history.unshift(historyEntry); // Add to beginning of array
    return await this.update({ history: this.history });
  }

  // Update history entry
  async updateHistoryEntry(entryId, updateData) {
    const entryIndex = this.history.findIndex(entry => entry.id === entryId);
    if (entryIndex === -1) {
      return { success: false, error: 'History entry not found' };
    }

    this.history[entryIndex] = {
      ...this.history[entryIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    return await this.update({ history: this.history });
  }

  // Delete history entry
  async deleteHistoryEntry(entryId) {
    this.history = this.history.filter(entry => entry.id !== entryId);
    return await this.update({ history: this.history });
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
      createdAt: new Date().toISOString()
    };

    this.files.push(fileEntry);
    return await this.update({ files: this.files });
  }

  // Delete file reference
  async deleteFile(fileId) {
    this.files = this.files.filter(file => file.id !== fileId);
    return await this.update({ files: this.files });
  }
}

module.exports = Lead;
