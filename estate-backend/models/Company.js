const { v4: uuidv4 } = require('uuid');
const { dynamoDB, TABLES } = require('../config/database');

class Company {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.alias = data.alias?.toLowerCase().trim();
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Create a new company
  static async create(data) {
    const company = new Company(data);
    
    const params = {
      TableName: TABLES.COMPANIES,
      Item: company,
      ConditionExpression: 'attribute_not_exists(alias)' // Ensure alias is unique
    };

    try {
      await dynamoDB.put(params).promise();
      return { success: true, data: company };
    } catch (error) {
      if (error.code === 'ConditionalCheckFailedException') {
        return { success: false, error: 'Company alias already exists' };
      }
      return { success: false, error: error.message };
    }
  }

  // Get company by ID
  static async getById(id) {
    const params = {
      TableName: TABLES.COMPANIES,
      Key: { id }
    };

    try {
      const result = await dynamoDB.get(params).promise();
      return { success: true, data: result.Item || null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get company by alias
  static async getByAlias(alias) {
    const params = {
      TableName: TABLES.COMPANIES,
      IndexName: 'AliasIndex',
      KeyConditionExpression: 'alias = :alias',
      ExpressionAttributeValues: {
        ':alias': alias.toLowerCase().trim()
      }
    };

    try {
      const result = await dynamoDB.query(params).promise();
      return { success: true, data: result.Items[0] || null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update company
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
      TableName: TABLES.COMPANIES,
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

  // Delete company
  static async delete(id) {
    const params = {
      TableName: TABLES.COMPANIES,
      Key: { id }
    };

    try {
      await dynamoDB.delete(params).promise();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // List all companies
  static async list() {
    const params = {
      TableName: TABLES.COMPANIES
    };

    try {
      const result = await dynamoDB.scan(params).promise();
      return { success: true, data: result.Items };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = Company;
