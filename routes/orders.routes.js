const express = require('express');
const router = express.Router();

const { authenticateFirebase, loadUserInfo } = require('../middlewares/auth.middleware');
const ordersController = require('../controllers/orders.controller');

// Guest checkout (no auth required)
router.post('/guest-checkout', ordersController.guestCheckout);

// Protégé
router.use(authenticateFirebase);
router.use(loadUserInfo);

// MVP digital product checkout
router.post('/create-checkout-session', ordersController.createCheckoutSession);

// Backward compat
router.post('/create', ordersController.createCheckoutSession);


// Liste des commandes de l'utilisateur
router.get('/', ordersController.listMyOrders);

// Récupérer une commande (appartenance contrôlée côté contrôleur)
router.get('/:orderId', ordersController.getMyOrder);

module.exports = router;
