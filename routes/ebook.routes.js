const express = require('express');
const router = express.Router();
const { authenticateFirebase, loadUserInfo } = require('../middlewares/auth.middleware');
const { quotaMiddleware } = require('../services/quota.service');
const { uploadVideo } = require('../middlewares/upload.middleware');
const ebookController = require('../controllers/ebook.controller');

router.use(authenticateFirebase);
router.use(loadUserInfo);

router.get('/', ebookController.listEbooks);
router.get('/stats', ebookController.getEbookStats);
router.get('/suggestions', ebookController.getSuggestions);
router.post('/ai-suggestions', quotaMiddleware('aiSuggestionsPerDay'), ebookController.getAISuggestions);
router.post('/transcribe-url', quotaMiddleware('transcriptionsPerMonth'), ebookController.transcribeUrl);
router.post('/transcribe-upload', quotaMiddleware('transcriptionsPerMonth'), uploadVideo.single('video'), ebookController.transcribeUpload);
router.post('/from-video', quotaMiddleware('ebooks'), ebookController.createFromVideo);
router.post('/custom', quotaMiddleware('ebooks'), ebookController.createCustom);
router.get('/export/:ebookId', ebookController.exportEbook);
router.get('/data/:ebookId', ebookController.getEbookData);
router.get('/preview/:ebookId', ebookController.getEbookData);

module.exports = router;
