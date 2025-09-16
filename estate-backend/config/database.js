const AWS = require('aws-sdk');

// Configure DynamoDB
const dynamoDB = new AWS.DynamoDB.DocumentClient({
  region: process.env.DYNAMODB_REGION || 'us-east-1',
  endpoint: process.env.DYNAMODB_ENDPOINT || undefined, // Use AWS DynamoDB by default
});

// Table names
const TABLES = {
  USERS: 'estate-users',
  COMPANIES: 'estate-companies',
  LEADS: 'estate-leads',
  PROPERTIES: 'estate-properties',
  APARTMENTS: 'estate-apartments'
};

// Initialize tables (create if they don't exist)
const initializeTables = async () => {
  const dynamodb = new AWS.DynamoDB({
    region: process.env.DYNAMODB_REGION || 'us-east-1',
    endpoint: process.env.DYNAMODB_ENDPOINT || undefined,
  });

  const tables = [
    {
      TableName: TABLES.USERS,
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'companyAlias', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'CompanyAliasIndex',
          KeySchema: [
            { AttributeName: 'companyAlias', KeyType: 'HASH' }
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
        }
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    },
    {
      TableName: TABLES.COMPANIES,
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'alias', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'AliasIndex',
          KeySchema: [
            { AttributeName: 'alias', KeyType: 'HASH' }
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
        }
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    },
    {
      TableName: TABLES.LEADS,
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'companyId', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'CompanyIdIndex',
          KeySchema: [
            { AttributeName: 'companyId', KeyType: 'HASH' }
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
        }
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    },
    {
      TableName: TABLES.PROPERTIES,
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'companyId', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'CompanyIdIndex',
          KeySchema: [
            { AttributeName: 'companyId', KeyType: 'HASH' }
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
        }
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    },
    {
      TableName: TABLES.APARTMENTS,
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'companyId', AttributeType: 'S' },
        { AttributeName: 'propertyId', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'CompanyIdIndex',
          KeySchema: [
            { AttributeName: 'companyId', KeyType: 'HASH' }
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
        },
        {
          IndexName: 'PropertyIdIndex',
          KeySchema: [
            { AttributeName: 'propertyId', KeyType: 'HASH' }
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
        }
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    }
  ];

  for (const table of tables) {
    try {
      await dynamodb.createTable(table).promise();
      console.log(`Table ${table.TableName} created successfully`);
    } catch (error) {
      if (error.code === 'ResourceInUseException') {
        console.log(`Table ${table.TableName} already exists`);
      } else {
        console.error(`Error creating table ${table.TableName}:`, error);
      }
    }
  }
};

module.exports = {
  dynamoDB,
  TABLES,
  initializeTables
};
