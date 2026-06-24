const { createMedia, listMediaByOwner, deleteMediaById } = require('../services/firebase.service');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = process.env.VERCEL
  ? '/tmp/uploads'
  : path.join(__dirname, '..', 'public', 'uploads');

try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
} catch (e) {
  console.error('Could not create upload dir:', e.message);
}

async function upload(req, res) {
  try {
    let url = req.body?.url;
    let name = req.body?.name || 'untitled';
    let type = req.body?.type || 'image';

    if (req.file) {
      url = '/uploads/' + req.file.filename;
      name = req.file.originalname;
      type = req.file.mimetype.startsWith('image/') ? 'image' : 'file';
    }

    if (!url) return res.status(400).json({ error: 'Media URL or file is required' });

    const media = await createMedia({
      ownerId: req.userId,
      url,
      name,
      type,
      size: req.file?.size || null
    });

    res.status(201).json({ media });
  } catch (error) {
    console.error('Media upload error:', error);
    res.status(500).json({ error: 'Error uploading media' });
  }
}

async function list(req, res) {
  try {
    const media = await listMediaByOwner(req.userId);
    res.json({ media });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching media' });
  }
}

async function remove(req, res) {
  try {
    const { mediaId } = req.params;
    await deleteMediaById(mediaId);
    res.json({ message: 'Media deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting media' });
  }
}

module.exports = { upload, list, remove };
