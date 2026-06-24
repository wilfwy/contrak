const express = require('express');
const router = express.Router();
const { authenticateFirebase, loadUserInfo } = require('../middlewares/auth.middleware');
const couponsController = require('../controllers/coupons.controller');

router.use(authenticateFirebase);
router.use(loadUserInfo);

router.get('/', couponsController.listCoupons);
router.post('/', couponsController.create);
router.delete('/:couponId', couponsController.remove);

// Public validation
router.post('/validate', couponsController.validate);

module.exports = router;
