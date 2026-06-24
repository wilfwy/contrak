const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateFirebase, loadUserInfo } = require('../middlewares/auth.middleware');
const { quotaMiddleware } = require('../services/quota.service');
const mediaController = require('../controllers/media.controller');

const uploadDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function(req, file, cb) { cb(null, uploadDir); },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const fileFilter = function(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, png, gif, webp, svg) are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.use(authenticateFirebase, loadUserInfo);

router.get('/', mediaController.list);
router.post('/upload', quotaMiddleware('media'), upload.single('file'), mediaController.upload);
router.delete('/:mediaId', mediaController.remove);

module.exports = router;
