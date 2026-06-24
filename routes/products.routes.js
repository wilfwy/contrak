const express = require('express');
const router = express.Router();

const { authenticateFirebase, loadUserInfo } = require('../middlewares/auth.middleware');
const { quotaMiddleware } = require('../services/quota.service');

const productsController = require('../controllers/products.controller');
const { validateProductCreate, validateProductVersionCreate } = require('../middlewares/products.validation.middleware');


// Auth required
router.use(authenticateFirebase);
router.use(loadUserInfo);

// CRUD products
router.get('/', productsController.listProducts);
router.post('/', quotaMiddleware('products'), validateProductCreate, productsController.createProduct);
router.get('/:productId', productsController.getProduct);
router.put('/:productId', productsController.updateProduct);
router.delete('/:productId', productsController.deleteProduct);
router.post('/:productId/duplicate', productsController.duplicateProduct);

// Product versions
router.post('/:productId/versions', validateProductVersionCreate, productsController.createProductVersion);
router.get('/:productId/versions/:versionId', productsController.getProductVersion);
router.put('/:productId/versions/:versionId', productsController.updateProductVersion);
router.delete('/:productId/versions/:versionId', productsController.deleteProductVersion);

module.exports = router;

