const express = require('express');
const router = express.Router();
const { authenticateFirebase, loadUserInfo } = require('../middlewares/auth.middleware');
const analyticsController = require('../controllers/analytics.controller');

// Public tracking endpoint (no auth needed for page views)
router.post('/track', analyticsController.track);

// Authenticated stats endpoint
router.get('/stats', authenticateFirebase, loadUserInfo, analyticsController.stats);

module.exports = router;
