const express = require('express');
const router = express.Router();

// Import modular routes
const basicRoutes = require('./basic');
const imageRoutes = require('./images');
const fileRoutes = require('./files');
const mapRoutes = require('./map');

// Combine all property routes
router.use('/', basicRoutes);
router.use('/', imageRoutes);
router.use('/', fileRoutes);
router.use('/', mapRoutes);

module.exports = router;
