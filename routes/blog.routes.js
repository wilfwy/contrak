const express = require('express');
const router = express.Router();
const { authenticateFirebase, loadUserInfo } = require('../middlewares/auth.middleware');
const blogController = require('../controllers/blog.controller');

// Public
router.get('/public', blogController.publicList);
router.get('/public/:slug', blogController.publicGet);

// Authenticated (admin)
router.use(authenticateFirebase, loadUserInfo);
router.get('/', blogController.list);
router.post('/', blogController.create);
router.get('/:articleId', blogController.getOne);
router.put('/:articleId', blogController.update);
router.delete('/:articleId', blogController.remove);

module.exports = router;
