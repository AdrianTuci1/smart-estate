const Joi = require('joi');

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
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
    phone: Joi.string().min(5).max(20).optional().allow(''),
    email: Joi.string().email().optional().allow(''),
    notes: Joi.string().max(1000).optional().allow(''),
    status: Joi.string().valid('New', 'Attempted', 'Connected', 'Progress', 'Potential', 'Customer').default('New'),
    interest: Joi.string().max(200).optional().allow(''),
    property: Joi.string().max(200).optional().allow(''),
    propertyId: Joi.string().optional().allow(''),
    propertyAddress: Joi.string().max(300).optional().allow(''),
    apartment: Joi.string().max(100).optional().allow(''),
    apartmentId: Joi.string().optional().allow(''),
    apartmentRooms: Joi.number().integer().min(1).max(10).optional().allow(null),
    apartmentArea: Joi.number().positive().optional().allow(null),
    apartmentPrice: Joi.number().positive().optional().allow(null),
    propertiesOfInterest: Joi.array().items(Joi.string()).default([])
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
    query: Joi.string().min(1).max(100).required()
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
