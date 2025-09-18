const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const { authenticateToken, requireCompanyAccess } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// Apply authentication and company access middleware to all routes
router.use(authenticateToken);
router.use(requireCompanyAccess);

// Popular Romanian cities for recommendations
const popularCities = [
  { name: 'Cluj-Napoca', lat: 46.7704, lng: 23.5918, population: '320000' },
  { name: 'București', lat: 44.4268, lng: 26.1025, population: '1880000' },
  { name: 'Timișoara', lat: 45.7471, lng: 21.2087, population: '320000' },
  { name: 'Iași', lat: 47.1585, lng: 27.6014, population: '290000' },
  { name: 'Constanța', lat: 44.1598, lng: 28.6348, population: '260000' },
  { name: 'Craiova', lat: 44.3199, lng: 23.7967, population: '230000' },
  { name: 'Galați', lat: 45.4353, lng: 28.0080, population: '220000' },
  { name: 'Ploiești', lat: 44.9419, lng: 26.0225, population: '200000' },
  { name: 'Brașov', lat: 45.6427, lng: 25.5887, population: '190000' },
  { name: 'Brăila', lat: 45.2667, lng: 27.9833, population: '180000' },
  { name: 'Oradea', lat: 47.0465, lng: 21.9190, population: '160000' },
  { name: 'Pitești', lat: 44.8565, lng: 24.8692, population: '150000' },
  { name: 'Arad', lat: 46.1866, lng: 21.3124, population: '140000' },
  { name: 'Sibiu', lat: 45.7983, lng: 24.1256, population: '130000' },
  { name: 'Bacău', lat: 46.5679, lng: 26.9141, population: '120000' },
  { name: 'Târgu Mureș', lat: 46.5386, lng: 24.5517, population: '110000' },
  { name: 'Baia Mare', lat: 47.6572, lng: 23.5881, population: '100000' },
  { name: 'Buzău', lat: 45.1511, lng: 26.8144, population: '95000' },
  { name: 'Satu Mare', lat: 47.8017, lng: 22.8572, population: '90000' },
  { name: 'Piatra Neamț', lat: 46.9275, lng: 26.3708, population: '85000' }
];

// Helper function to search in popular cities
const searchCities = (searchTerm) => {
  if (!searchTerm || searchTerm.length < 2) {
    return popularCities.slice(0, 8); // Return top 8 cities for recommendations
  }
  
  return popularCities.filter(city => 
    city.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 10); // Return max 10 results
};

// @route   GET /api/search
// @desc    Search properties and cities
// @access  Private
router.get('/', validate(schemas.search, 'query'), asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query || query.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Search query is required'
    });
  }

  const searchTerm = query.trim();
  let results = {
    properties: [],
    cities: [],
    total: 0
  };

  try {
    // Search in properties
    const propertyResult = await Property.search(req.user.companyId, searchTerm);
    if (propertyResult.success) {
      results.properties = propertyResult.data.map(property => ({
        ...property,
        type: 'property',
        display: property.name || property.address,
        coordinates: property.coordinates || property.position
      }));
    }

    // Search in popular cities (only if no properties found or search term is very specific)
    if (results.properties.length === 0 || searchTerm.length > 4) {
      const cityResults = searchCities(searchTerm);
      results.cities = cityResults.map(city => ({
        name: city.name,
        lat: city.lat,
        lng: city.lng,
        population: city.population,
        type: 'city',
        display: city.name
      }));
    }

    results.total = results.properties.length + results.cities.length;

    // Add search metadata
    const searchMetadata = {
      query: searchTerm,
      timestamp: new Date().toISOString(),
      companyId: req.user.companyId
    };

    res.json({
      success: true,
      data: results,
      metadata: searchMetadata
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
}));

// @route   GET /api/search/suggestions
// @desc    Get intelligent search suggestions based on existing data
// @access  Private
router.get('/suggestions', asyncHandler(async (req, res) => {
  const { q } = req.query;

  const suggestions = {
    properties: [],
    cities: [],
    recommendations: []
  };

  try {
    // If no query or very short query, return intelligent recommendations
    if (!q || q.trim().length < 2) {
      // Get popular cities for recommendations
      const cityRecommendations = searchCities(''); // Empty string returns top cities
      if (cityRecommendations.length > 0) {
        suggestions.recommendations.push({
          type: 'popular_cities',
          title: 'Orașe populare',
          items: cityRecommendations.slice(0, 5).map(city => ({
            name: city.name,
            lat: city.lat,
            lng: city.lng,
            population: city.population,
            type: 'city',
            display: `${city.name} (${city.population} locuitori)`
          }))
        });
      }

      // Get recent properties for recommendations
      const allPropertiesResult = await Property.getByCompany(req.user.companyId, 10);
      if (allPropertiesResult.success) {
        suggestions.recommendations.push({
          type: 'recent_properties',
          title: 'Proprietăți recente',
          items: allPropertiesResult.data.slice(0, 5).map(property => ({
            id: property.id,
            name: property.name,
            address: property.address,
            status: property.status,
            type: 'property',
            display: property.name || property.address
          }))
        });
      }

      return res.json({
        success: true,
        data: suggestions
      });
    }

    // If there's a query, provide filtered suggestions
    const searchTerm = q.trim();

    // Get property suggestions
    const propertyResult = await Property.search(req.user.companyId, searchTerm);
    if (propertyResult.success && propertyResult.data.length > 0) {
      suggestions.properties = propertyResult.data.slice(0, 5).map(property => ({
        id: property.id,
        name: property.name,
        address: property.address,
        status: property.status,
        type: 'property',
        display: property.name || property.address,
        coordinates: property.coordinates || property.position
      }));
    }

    // Get city suggestions (only if no properties found or search term is very specific)
    if (suggestions.properties.length === 0 || searchTerm.length > 4) {
      const citySuggestions = searchCities(searchTerm);
      suggestions.cities = citySuggestions.slice(0, 5).map(city => ({
        name: city.name,
        lat: city.lat,
        lng: city.lng,
        population: city.population,
        type: 'city',
        display: `${city.name} (${city.population} locuitori)`
      }));
    }

    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get search suggestions'
    });
  }
}));

// @route   GET /api/search/recommendations
// @desc    Get intelligent recommendations based on company data
// @access  Private
router.get('/recommendations', asyncHandler(async (req, res) => {
  const recommendations = {
    popular: [],
    recent: []
  };

  try {
    // Get recent properties first (priority)
    const allPropertiesResult = await Property.getByCompany(req.user.companyId, 5);
    if (allPropertiesResult.success) {
      allPropertiesResult.data.forEach(property => {
        recommendations.recent.push({
          type: 'property',
          display: property.name || property.address,
          id: property.id,
          coordinates: property.coordinates || property.position
        });
      });
    }

    // Get popular cities last (lower priority)
    const popularCityRecommendations = searchCities(''); // Empty string returns top cities
    recommendations.popular = popularCityRecommendations.slice(0, 8).map(city => ({
      type: 'city',
      name: city.name,
      lat: city.lat,
      lng: city.lng,
      population: city.population,
      display: `${city.name} (${city.population} locuitori)`
    }));

    res.json({
      success: true,
      data: recommendations
    });

  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendations'
    });
  }
}));

module.exports = router;
