const express = require('express');
const router = express.Router();
const { authenticateFirebase, loadUserInfo } = require('../middlewares/auth.middleware');
const reviewsController = require('../controllers/reviews.controller');

// Public: get reviews for a product
router.get('/:productId', reviewsController.listReviews);

// Authenticated: add a review
router.post('/', authenticateFirebase, loadUserInfo, reviewsController.addReview);

module.exports = router;
