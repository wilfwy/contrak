const express = require('express');
const router = express.Router();
const { authenticateFirebase, loadUserInfo, requireProPlan } = require('../middlewares/auth.middleware');
const ebookController = require('../controllers/ebook.controller');

router.use(authenticateFirebase);
router.use(loadUserInfo);

router.get('/stats', ebookController.getEbookStats);
router.get('/suggestions', ebookController.getSuggestions);
router.post('/ai-suggestions', requireProPlan, ebookController.getAISuggestions);
router.post('/from-video', requireProPlan, ebookController.createFromVideo);
router.post('/custom', ebookController.createCustom);
router.get('/export/:ebookId', ebookController.exportEbook);

module.exports = router;
