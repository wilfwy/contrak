const express = require('express');
const router = express.Router();

const { getProductBySlug, listVersionsByProduct, getPageBySlug } = require('../services/firebase.service');

router.get('/products/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await getProductBySlug(slug);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (product.status !== 'published') {
      return res.status(404).json({ error: 'Product not found' });
    }
    const versions = await listVersionsByProduct(product.id);
    return res.json({ product, versions });
  } catch (error) {
    console.error('Public product fetch error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/pages/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const page = await getPageBySlug(slug);
    if (!page || page.status !== 'published') {
      return res.status(404).json({ error: 'Page not found' });
    }
    return res.json({ page });
  } catch (error) {
    console.error('Public page fetch error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
