const express = require('express');
const router = express.Router();
const { authenticateFirebase, loadUserInfo } = require('../middlewares/auth.middleware');
const aiController = require('../controllers/ai.controller');

router.use(authenticateFirebase);
router.use(loadUserInfo);

router.get('/check', aiController.checkKey);
router.post('/landing-page', aiController.landingPage);
router.post('/marketing-copy', aiController.marketingCopy);
router.post('/marketing-email', aiController.marketingEmail);

module.exports = router;
