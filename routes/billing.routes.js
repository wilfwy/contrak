const express = require('express');
const router = express.Router();
const { authenticateFirebase, loadUserInfo } = require('../middlewares/auth.middleware');
const billingController = require('../controllers/billing.controller');

// Créer une session Stripe Checkout
router.post('/create-checkout-session', authenticateFirebase, loadUserInfo, billingController.createCheckoutSession);

// Page de succès après paiement
router.get('/success', billingController.success);

// Webhook Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), billingController.webhook);

// Page pour gérer l'abonnement
router.get('/portal', authenticateFirebase, loadUserInfo, billingController.createPortalSession);

module.exports = router;