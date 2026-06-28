const express = require('express');
const router = express.Router();
const { authenticateFirebase, loadUserInfo } = require('../middlewares/auth.middleware');
const { quotaMiddleware } = require('../services/quota.service');
const pagesController = require('../controllers/pages.controller');

router.use(authenticateFirebase);
router.use(loadUserInfo);

router.get('/', pagesController.listPages);
router.post('/', quotaMiddleware('pages'), pagesController.create);
router.post('/ai-generate', quotaMiddleware('aiSuggestionsPerDay'), pagesController.aiGenerate);
router.post('/regenerate-section', quotaMiddleware('aiSuggestionsPerDay'), pagesController.regenerateSection);
router.get('/:pageId', pagesController.getOne);
router.put('/:pageId', pagesController.update);
router.delete('/:pageId', pagesController.remove);

module.exports = router;
