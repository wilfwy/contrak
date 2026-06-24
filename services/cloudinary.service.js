const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

function isConfigured() {
  return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

async function uploadImage(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: options.folder || 'contrak', resource_type: 'image', ...options },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes
        });
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

async function uploadVideo(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: options.folder || 'contrak', resource_type: 'video', ...options },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes,
          duration: result.duration
        });
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

async function uploadFromUrl(url, options = {}) {
  try {
    const result = await cloudinary.uploader.upload(url, {
      folder: options.folder || 'contrak',
      ...options
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error) {
    throw new Error('Cloudinary upload from URL failed: ' + error.message);
  }
}

async function deleteResource(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete failed:', error.message);
  }
}

async function getVideoTranscriptionUrl(publicId) {
  try {
    const result = await cloudinary.api.resource(publicId, { resource_type: 'video' });
    if (result && result.url) {
      const audioUrl = result.url.replace(/\.\w+$/, '.mp3');
      return audioUrl;
    }
  } catch (e) {}
  return null;
}

module.exports = {
  isConfigured,
  uploadImage,
  uploadVideo,
  uploadFromUrl,
  deleteResource,
  getVideoTranscriptionUrl
};
