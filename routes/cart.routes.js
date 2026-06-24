const express = require('express');
const router = express.Router();

const { authenticateFirebase, loadUserInfo } = require('../middlewares/auth.middleware');
const cartController = require('../controllers/cart.controller');

router.use(authenticateFirebase);
router.use(loadUserInfo);

router.get('/', cartController.getMyCart);
router.post('/items', cartController.addItem);
router.delete('/items/:productVersionId', cartController.removeItem);
router.delete('/', cartController.clearCart);

module.exports = router;
