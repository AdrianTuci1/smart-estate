const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamodb = new AWS.DynamoDB();

async function createTables() {
  try {
    // Create CompanyGoogleCredentials table
    const companyCredentialsParams = {
      TableName: 'CompanyGoogleCredentials',
      KeySchema: [
        {
          AttributeName: 'companyId',
          KeyType: 'HASH' // Partition key
        }
      ],
      AttributeDefinitions: [
        {
          AttributeName: 'companyId',
          AttributeType: 'S'
        }
      ],
      BillingMode: 'PAY_PER_REQUEST', // On-demand billing
      Tags: [
        {
          Key: 'Environment',
          Value: 'Development'
        },
        {
          Key: 'Application',
          Value: 'EstateApp'
        }
      ]
    };

    try {
      await dynamodb.createTable(companyCredentialsParams).promise();
      console.log('✅ Created table: CompanyGoogleCredentials');
    } catch (error) {
      if (error.code === 'ResourceInUseException') {
        console.log('ℹ️  Table CompanyGoogleCredentials already exists');
      } else {
        throw error;
      }
    }

    // Wait for table to be active
    console.log('⏳ Waiting for CompanyGoogleCredentials table to become active...');
    await dynamodb.waitFor('tableExists', { TableName: 'CompanyGoogleCredentials' }).promise();
    console.log('✅ CompanyGoogleCredentials table is ready!');

    // Create PropertyGoogleSheets table
    const propertyGoogleSheetsParams = {
      TableName: 'PropertyGoogleSheets',
      KeySchema: [
        {
          AttributeName: 'propertyId',
          KeyType: 'HASH' // Partition key
        },
        {
          AttributeName: 'spreadsheetId',
          KeyType: 'RANGE' // Sort key
        }
      ],
      AttributeDefinitions: [
        {
          AttributeName: 'propertyId',
          AttributeType: 'S'
        },
        {
          AttributeName: 'spreadsheetId',
          AttributeType: 'S'
        }
      ],
      BillingMode: 'PAY_PER_REQUEST', // On-demand billing
      Tags: [
        {
          Key: 'Environment',
          Value: 'Development'
        },
        {
          Key: 'Application',
          Value: 'EstateApp'
        }
      ]
    };

    try {
      await dynamodb.createTable(propertyGoogleSheetsParams).promise();
      console.log('✅ Created table: PropertyGoogleSheets');
    } catch (error) {
      if (error.code === 'ResourceInUseException') {
        console.log('ℹ️  Table PropertyGoogleSheets already exists');
      } else {
        throw error;
      }
    }

    // Wait for PropertyGoogleSheets table to be active
    console.log('⏳ Waiting for PropertyGoogleSheets table to become active...');
    await dynamodb.waitFor('tableExists', { TableName: 'PropertyGoogleSheets' }).promise();
    console.log('✅ PropertyGoogleSheets table is ready!');

    
    console.log('🎉 All tables are ready!');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
}

// Run the script
createTables();
