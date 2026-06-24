const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateFirebase, loadUserInfo } = require('../middlewares/auth.middleware');
const { quotaMiddleware } = require('../services/quota.service');
const mediaController = require('../controllers/media.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: function(req, file, cb) {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, png, gif, webp, svg) are allowed'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.use(authenticateFirebase, loadUserInfo);

router.get('/', mediaController.list);
router.post('/upload', quotaMiddleware('media'), upload.single('file'), mediaController.upload);
router.get('/:mediaId', mediaController.get);
router.delete('/:mediaId', mediaController.remove);

module.exports = router;
