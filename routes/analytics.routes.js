const express = require('express');
const router = express.Router();
const { authenticateFirebase, loadUserInfo } = require('../middlewares/auth.middleware');
const analyticsController = require('../controllers/analytics.controller');

// Public tracking endpoint (no auth needed for page views)
router.post('/track', analyticsController.track);

// Authenticated stats endpoints
router.get('/stats', authenticateFirebase, loadUserInfo, analyticsController.stats);
router.get('/sales-dashboard', authenticateFirebase, loadUserInfo, analyticsController.salesDashboard);

module.exports = router;
