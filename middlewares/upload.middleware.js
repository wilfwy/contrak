const multer = require('multer');

const ALLOWED_MIMES = [
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mpeg',
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/mp4', 'audio/x-m4a'
];

const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = require('path').extname(file.originalname).toLowerCase();
    const allowedExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.mp3', '.wav', '.m4a', '.mpeg', '.mpg'];
    if (ALLOWED_MIMES.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format non supporté. Utilisez MP4, MOV, WebM, MP3 ou WAV.'));
    }
  }
});

module.exports = { uploadVideo };
