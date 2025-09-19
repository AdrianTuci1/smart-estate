const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { dynamoDB, TABLES } = require('../config/database');

class User {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.username = data.username;
    this.passwordHash = data.passwordHash;
    this.companyAlias = data.companyAlias?.toLowerCase().trim();
    this.companyId = data.companyId;
    this.role = data.role || 'User';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Hash password
  static async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Verify password
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.passwordHash);
  }

  // Create a new user
  static async create(data) {
    const passwordHash = await User.hashPassword(data.password);
    const user = new User({
      ...data,
      passwordHash
    });
    
    const params = {
      TableName: TABLES.USERS,
      Item: user,
      ConditionExpression: 'attribute_not_exists(username) AND attribute_not_exists(companyAlias)' // Ensure unique username per company
    };

    try {
      await dynamoDB.put(params).promise();
      // Remove password hash from response
      const { passwordHash: _, ...userResponse } = user;
      return { success: true, data: userResponse };
    } catch (error) {
      if (error.code === 'ConditionalCheckFailedException') {
        return { success: false, error: 'Username already exists in this company' };
      }
      return { success: false, error: error.message };
    }
  }

  // Get user by ID
  static async getById(id) {
    const params = {
      TableName: TABLES.USERS,
      Key: { id }
    };

    try {
      const result = await dynamoDB.get(params).promise();
      if (result.Item) {
        const { passwordHash: _, ...user } = result.Item;
        return { success: true, data: user };
      }
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get user by username and company alias (for login)
  static async getByUsernameAndCompany(username, companyAlias) {
    const params = {
      TableName: TABLES.USERS,
      FilterExpression: 'username = :username AND companyAlias = :companyAlias',
      ExpressionAttributeValues: {
        ':username': username,
        ':companyAlias': companyAlias.toLowerCase().trim()
      }
    };

    try {
      const result = await dynamoDB.scan(params).promise();
      return { success: true, data: result.Items[0] || null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get users by company
  static async getByCompany(companyAlias) {
    const params = {
      TableName: TABLES.USERS,
      IndexName: 'CompanyAliasIndex',
      KeyConditionExpression: 'companyAlias = :companyAlias',
      ExpressionAttributeValues: {
        ':companyAlias': companyAlias.toLowerCase().trim()
      }
    };

    try {
      const result = await dynamoDB.query(params).promise();
      // Remove password hashes from response
      const users = result.Items.map(({ passwordHash: _, ...user }) => user);
      return { success: true, data: users };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update user
  async update(updateData) {
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(updateData).forEach((key, index) => {
      if (key !== 'id' && key !== 'createdAt' && key !== 'passwordHash') {
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
      TableName: TABLES.USERS,
      Key: { id: this.id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    try {
      const result = await dynamoDB.update(params).promise();
      const { passwordHash: _, ...userResponse } = result.Attributes;
      return { success: true, data: userResponse };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update password
  async updatePassword(newPassword) {
    const passwordHash = await User.hashPassword(newPassword);
    
    const params = {
      TableName: TABLES.USERS,
      Key: { id: this.id },
      UpdateExpression: 'SET passwordHash = :passwordHash, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':passwordHash': passwordHash,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    };

    try {
      const result = await dynamoDB.update(params).promise();
      const { passwordHash: _, ...userResponse } = result.Attributes;
      return { success: true, data: userResponse };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Delete user
  static async delete(id) {
    const params = {
      TableName: TABLES.USERS,
      Key: { id }
    };

    try {
      await dynamoDB.delete(params).promise();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // List all users
  static async list() {
    const params = {
      TableName: TABLES.USERS
    };

    try {
      const result = await dynamoDB.scan(params).promise();
      // Remove password hashes from response
      const users = result.Items.map(({ passwordHash: _, ...user }) => user);
      return { success: true, data: users };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = User;
