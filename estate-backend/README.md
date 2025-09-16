# Smart Estate Backend

Backend server for the Smart Estate management system built with Node.js, Express, and AWS DynamoDB.

## Features

- **Multi-tenant Architecture**: Company-based data isolation using company aliases
- **JWT Authentication**: Secure token-based authentication
- **AWS Integration**: DynamoDB for data storage, S3 for file storage
- **Advanced Search**: Support for @pers and @loc search syntax
- **CRUD Operations**: Complete CRUD for properties and leads
- **File Management**: S3 integration for property images
- **Rate Limiting**: Built-in rate limiting for API protection
- **Input Validation**: Joi-based request validation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: AWS DynamoDB
- **File Storage**: AWS S3
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting

## Prerequisites

- Node.js (v16 or higher)
- AWS Account with DynamoDB and S3 access
- AWS CLI configured (optional, for local development)

## Installation

1. **Clone and navigate to the backend directory**:
   ```bash
   cd estate-backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   ```bash
   cp env.example .env
   ```

4. **Configure your .env file**:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=24h

   # DynamoDB Configuration
   DYNAMODB_REGION=us-east-1
   DYNAMODB_ENDPOINT=

   # AWS Configuration
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key

   # S3 Configuration
   S3_BUCKET_NAME=estate-app-files
   CLOUDFRONT_DOMAIN=your-cloudfront-domain.cloudfront.net

   # CORS Configuration
   CORS_ORIGIN=http://localhost:5173

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

## AWS Setup

### DynamoDB Tables

The application will automatically create the following DynamoDB tables:

- `estate-users` - User accounts
- `estate-companies` - Company information
- `estate-leads` - Lead management
- `estate-properties` - Property listings

### S3 Bucket

Create an S3 bucket for file storage:

1. Create a bucket named `estate-app-files` (or update the name in .env)
2. Configure CORS policy for the bucket:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```

### IAM Permissions

Create an IAM user with the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:CreateTable",
        "dynamodb:DescribeTable",
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/estate-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::estate-app-files",
        "arn:aws:s3:::estate-app-files/*"
      ]
    }
  ]
}
```

## Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your .env file).

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (admin only)
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/refresh` - Refresh JWT token

### Properties
- `GET /api/properties` - Get all properties
- `GET /api/properties/:id` - Get property by ID
- `POST /api/properties` - Create new property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property
- `GET /api/properties/map/bounds` - Get properties within map bounds
- `POST /api/properties/:id/images` - Upload property image
- `DELETE /api/properties/:id/images/:imageUrl` - Remove property image

### Leads
- `GET /api/leads` - Get all leads
- `GET /api/leads/:id` - Get lead by ID
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `POST /api/leads/:id/properties/:propertyId` - Add property interest
- `DELETE /api/leads/:id/properties/:propertyId` - Remove property interest
- `PUT /api/leads/:id/status` - Update lead status

### Search
- `GET /api/search?query=...` - Universal search
- `GET /api/search/suggestions?q=...` - Get search suggestions
- `GET /api/search/recent` - Get recent searches

## Search Syntax

The API supports advanced search syntax:

- `@pers [term]` - Search in leads (people)
- `@loc [term]` - Search in properties (locations)
- `[term]` - General search in both leads and properties

Examples:
- `@pers John` - Find leads with "John" in name or phone
- `@loc Bucuresti` - Find properties in Bucharest
- `apartament` - Find both leads and properties containing "apartament"

## Multi-tenancy

The system uses company aliases for multi-tenancy:

1. Each company has a unique alias
2. Users are associated with a company via the alias
3. All data is automatically filtered by company
4. Users can only access data from their own company

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": ["Additional error details"]
}
```

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation with Joi
- Company-based data isolation

## Development

### Project Structure

```
estate-backend/
├── config/
│   ├── aws.js          # AWS configuration
│   └── database.js     # DynamoDB configuration
├── middleware/
│   ├── auth.js         # Authentication middleware
│   ├── errorHandler.js # Error handling
│   └── validation.js   # Input validation
├── models/
│   ├── Company.js      # Company model
│   ├── User.js         # User model
│   ├── Lead.js         # Lead model
│   └── Property.js     # Property model
├── routes/
│   ├── auth.js         # Authentication routes
│   ├── properties.js   # Property routes
│   ├── leads.js        # Lead routes
│   └── search.js       # Search routes
├── server.js           # Main server file
├── package.json
└── README.md
```

### Adding New Features

1. Create new models in the `models/` directory
2. Add validation schemas in `middleware/validation.js`
3. Create routes in the `routes/` directory
4. Update the main server file to include new routes

## Deployment

### AWS EC2

1. Launch an EC2 instance
2. Install Node.js and npm
3. Clone the repository
4. Configure environment variables
5. Install dependencies
6. Start the application with PM2 or similar

### AWS Lambda (Serverless)

The application can be adapted for serverless deployment using the `serverless-http` package already included in dependencies.

## Monitoring

- Health check endpoint: `GET /health`
- Logs are output to console
- Consider integrating with AWS CloudWatch for production monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License
