const express = require('express');
const router = express.Router();
const fs = require('fs');

const { authenticateFirebase, loadUserInfo } = require('../middlewares/auth.middleware');
const { getProductVersionById, getProductById, hasUserPurchasedVersion, getEbookByFileId } = require('../services/firebase.service');
const { generateProductVersionPdf, getEbookFilePath } = require('../services/ebook.service');

router.use(authenticateFirebase);
router.use(loadUserInfo);

router.get('/product-versions/:versionId', async (req, res) => {
  try {
    const { versionId } = req.params;
    const version = await getProductVersionById(versionId);
    if (!version) return res.status(404).json({ error: 'Version not found' });

    // Allow download if user is the owner OR has purchased this version
    const isOwner = version.ownerId === req.userId;
    const isBuyer = await hasUserPurchasedVersion(req.userId, versionId);
    if (!isOwner && !isBuyer) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const product = await getProductById(version.productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Check if version has no chapters but product is linked to an ebook
    const payload = version.ebookPayload || {};
    const hasNoChapters = !payload.chapters || payload.chapters.length === 0;

    if (hasNoChapters && product.ebookId) {
      const ebookRecord = await getEbookByFileId(product.ebookId, product.ownerId);
      if (ebookRecord) {
        const ebookPath = getEbookFilePath(product.ebookId);
        if (fs.existsSync(ebookPath)) {
          const filename = `${(product.slug || product.title || 'product').replace(/[^a-z0-9]/gi, '_')}_${version.versionLabel || 'v1'}.pdf`;
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          const stream = fs.createReadStream(ebookPath);
          stream.pipe(res);
          stream.on('end', () => {});
          return;
        }
      }
    }

    const { filePath } = await generateProductVersionPdf(version, product);

    const filename = `${(product.slug || product.title || 'product').replace(/[^a-z0-9]/gi, '_')}_${version.versionLabel || 'v1'}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    stream.on('end', () => {
      fs.unlink(filePath, () => {});
    });
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ error: 'Error while generating PDF export' });
  }
});

module.exports = router;
