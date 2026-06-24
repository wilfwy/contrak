const cloudinaryService = require('../services/cloudinary.service');
const { createMedia, listMediaByOwner, deleteMediaById, getDb } = require('../services/firebase.service');

async function upload(req, res) {
  try {
    let result;
    if (req.file) {
      if (!cloudinaryService.isConfigured()) {
        return res.status(500).json({ error: 'Cloudinary not configured (set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET env vars)' });
      }
      result = await cloudinaryService.uploadImage(req.file.buffer, { folder: 'contrak/media' });
    } else if (req.body.url) {
      if (!cloudinaryService.isConfigured()) {
        return res.status(500).json({ error: 'Cloudinary not configured' });
      }
      result = await cloudinaryService.uploadFromUrl(req.body.url, { folder: 'contrak/media' });
    } else {
      return res.status(400).json({ error: 'No file or URL provided' });
    }

    const mediaRecord = await createMedia({
      ownerId: req.userId,
      url: result.url,
      cloudinaryPublicId: result.publicId,
      name: req.file ? req.file.originalname : (req.body.name || 'from-url'),
      type: result.format || 'image',
      size: result.bytes || (req.file ? req.file.size : 0)
    });

    res.status(201).json({ media: mediaRecord, url: result.url });
  } catch (error) {
    console.error('media upload error:', error);
    res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
}

async function list(req, res) {
  try {
    const media = await listMediaByOwner(req.userId);
    res.json({ media });
  } catch (error) {
    console.error('list media error:', error);
    res.status(500).json({ error: 'Error listing media' });
  }
}

async function get(req, res) {
  try {
    const media = await listMediaByOwner(req.userId);
    const item = media.find(m => m.id === req.params.mediaId);
    if (!item) return res.status(404).json({ error: 'Media not found' });
    res.redirect(item.url);
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
}

async function remove(req, res) {
  try {
    const media = await listMediaByOwner(req.userId);
    const item = media.find(m => m.id === req.params.mediaId);
    if (!item) return res.status(404).json({ error: 'Media not found' });

    if (item.cloudinaryPublicId) {
      await cloudinaryService.deleteResource(item.cloudinaryPublicId);
    }
    await deleteMediaById(req.params.mediaId);
    res.json({ message: 'Media deleted' });
  } catch (error) {
    console.error('delete media error:', error);
    res.status(500).json({ error: 'Error deleting media' });
  }
}

module.exports = { upload, list, get, remove };
