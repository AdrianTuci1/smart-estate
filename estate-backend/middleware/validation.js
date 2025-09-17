const Joi = require('joi');

// Validation middleware factory
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = source === 'query' ? req.query : req.body;
    const { error } = schema.validate(dataToValidate);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

// Validation schemas
const schemas = {
  // Authentication schemas
  login: Joi.object({
    username: Joi.string().min(3).max(50).required(),
    password: Joi.string().min(6).required(),
    companyAlias: Joi.string().min(2).max(20).required()
  }),

  register: Joi.object({
    username: Joi.string().min(3).max(50).required(),
    password: Joi.string().min(6).required(),
    companyAlias: Joi.string().min(2).max(20).required(),
    role: Joi.string().valid('admin', 'agent').default('agent')
  }),

  // Company schemas
  company: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    alias: Joi.string().min(2).max(20).alphanum().lowercase().required()
  }),

  createCompany: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    alias: Joi.string().min(2).max(20).alphanum().lowercase().required(),
    adminUsername: Joi.string().min(3).max(50).required(),
    adminPassword: Joi.string().min(6).required(),
    secret: Joi.string().required()
  }),

  // Lead schemas
  lead: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    phone: Joi.string().optional().allow('').allow(null),
    email: Joi.string().optional().allow('').allow(null),
    notes: Joi.string().max(1000).optional().allow('').allow(null),
    status: Joi.string().valid('New', 'Attempted', 'Connected', 'Progress', 'Potential', 'Customer').default('New'),
    interest: Joi.string().max(200).optional().allow('').allow(null),
    property: Joi.string().max(200).optional().allow('').allow(null),
    propertyId: Joi.string().optional().allow('').allow(null),
    propertyAddress: Joi.string().max(300).optional().allow('').allow(null),
    apartment: Joi.string().max(100).optional().allow('').allow(null),
    apartmentId: Joi.string().optional().allow('').allow(null),
    apartmentRooms: Joi.number().integer().min(1).max(10).optional().allow(null),
    apartmentArea: Joi.number().positive().optional().allow(null),
    apartmentPrice: Joi.number().positive().optional().allow(null),
    propertiesOfInterest: Joi.array().items(Joi.string()).default([]),
    // Add history and files fields for lead creation/update
    history: Joi.array().items(Joi.object({
      id: Joi.string().optional(),
      type: Joi.string().required(),
      date: Joi.string().required(),
      time: Joi.string().optional(),
      notes: Joi.string().required(),
      createdAt: Joi.string().optional()
    })).default([]),
    files: Joi.array().items(Joi.object({
      id: Joi.string().optional(),
      name: Joi.string().required(),
      type: Joi.string().required(),
      size: Joi.string().optional(),
      url: Joi.string().required(),
      s3Key: Joi.string().optional(),
      createdAt: Joi.string().optional()
    })).default([])
  }),

  // Property schemas
  property: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    address: Joi.string().min(5).max(200).required(),
    status: Joi.string().valid('finalizată', 'în construcție', 'finalizat', 'in-constructie').default('în construcție'),
    description: Joi.string().max(2000).optional().allow(''),
    image: Joi.string().uri().optional().allow(''),
    roomNumber: Joi.string().max(20).optional().allow(''),
    price: Joi.number().positive().optional().allow(null),
    rooms: Joi.number().integer().min(1).max(10).optional().allow(null),
    area: Joi.number().positive().optional().allow(null),
    position: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    }).optional().allow(null),
    coordinates: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    }).optional().allow(null),
    images: Joi.array().items(Joi.string().uri()).default([]),
    documents: Joi.array().items(Joi.object({
      url: Joi.string().uri().required(),
      name: Joi.string().required(),
      type: Joi.string().required(),
      extractedData: Joi.object().optional()
    })).default([])
  }),

  // Apartment schemas
  apartment: Joi.object({
    propertyId: Joi.string().required(),
    apartmentNumber: Joi.string().min(1).max(20).required(),
    rooms: Joi.number().integer().min(1).max(10).optional().allow(null),
    area: Joi.number().positive().optional().allow(null),
    price: Joi.number().positive().optional().allow(null),
    images: Joi.array().items(Joi.string().uri()).default([]),
    documents: Joi.array().items(Joi.object({
      url: Joi.string().uri().required(),
      name: Joi.string().required(),
      type: Joi.string().required(),
      extractedData: Joi.object().optional()
    })).default([])
  }),

  // Search schema
  search: Joi.object({
    query: Joi.string().min(2).max(200).required().custom((value, helpers) => {
      // Trim whitespace and check if still has content
      const trimmed = value.trim();
      if (trimmed.length < 2) {
        return helpers.error('string.min');
      }
      // Check if query has meaningful content (not just spaces or special chars)
      const hasMeaningfulContent = /[a-zA-Z0-9\u0100-\u017F]/.test(trimmed);
      if (!hasMeaningfulContent) {
        return helpers.error('string.pattern.base');
      }
      return trimmed;
    }),
    view: Joi.string().valid('all', 'map', 'leads', 'users').default('all')
  }),

  // Pagination schema
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  })
};

module.exports = {
  validate,
  schemas
};
