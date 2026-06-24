const {
  createProduct: createProductInDb,
  listProductsByOwner,
  getProductById,
  updateProductById,
  deleteProductById,
  createProductVersion: createProductVersionInDb,
  getProductVersionById,
  updateProductVersionById,
  deleteProductVersionById,
  listVersionsByProduct,
  getPageBySlug
} = require('../services/firebase.service');


function ensureOwner(resource, userId) {
  if (!resource) return false;
  if (resource.ownerId !== userId) return false;
  return true;
}

function slugify(text) {
  return text.toString().toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function listProducts(req, res) {
  try {
    const products = await listProductsByOwner(req.userId);
    const results = await Promise.allSettled(products.map(async (p) => {
      const versions = await listVersionsByProduct(p.id);
      const published = versions.filter(v => v.status === 'published');
      const minPrice = published.length ? Math.min(...published.map(v => v.price || 0)) : 0;
      return { ...p, versions, versionCount: versions.length, price: minPrice };
    }));
    const withVersions = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    res.json({ products: withVersions });
  } catch (error) {
    console.error('listProducts error:', error);
    res.status(500).json({ error: 'Error while fetching products' });
  }
}

async function createProduct(req, res) {
  try {
    const payload = req.body;
    const slug = payload.slug || slugify(payload.title) || 'product-' + Date.now();
    const created = await createProductInDb({
      ownerId: req.userId,
      title: payload.title,
      slug,
      description: payload.description || null,
      status: payload.status || 'draft',
      coverMediaId: payload.coverMediaId || null,
      theme: payload.theme || null,
      ebookId: payload.ebookId || null,
      landingPageSlug: payload.landingPageSlug || null,
      createdBy: req.userId
    });

    res.status(201).json({ product: created });
  } catch (error) {
    console.error('createProduct error:', error);
    res.status(500).json({ error: 'Error while creating product' });
  }
}

async function getProduct(req, res) {
  try {
    const { productId } = req.params;
    const product = await getProductById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (!ensureOwner(product, req.userId)) return res.status(403).json({ error: 'Forbidden access' });
    res.json({ product });
  } catch (error) {
    console.error('getProduct error:', error);
    res.status(500).json({ error: 'Error while fetching product' });
  }
}

async function updateProduct(req, res) {
  try {
    const { productId } = req.params;
    const payload = req.body;

    const existing = await getProductById(productId);
    if (!existing) return res.status(404).json({ error: 'Product not found' });
    if (!ensureOwner(existing, req.userId)) return res.status(403).json({ error: 'Forbidden access' });

    const updated = await updateProductById(productId, {
      title: payload.title,
      slug: payload.slug,
      description: payload.description,
      status: payload.status,
      coverMediaId: payload.coverMediaId,
      theme: payload.theme,
      ebookId: payload.ebookId || null,
      landingPageSlug: payload.landingPageSlug || null
    });

    res.json({ product: updated });
  } catch (error) {
    console.error('updateProduct error:', error);
    res.status(500).json({ error: 'Error while updating product' });
  }
}

async function deleteProduct(req, res) {
  try {
    const { productId } = req.params;
    const existing = await getProductById(productId);
    if (!existing) return res.status(404).json({ error: 'Product not found' });
    if (!ensureOwner(existing, req.userId)) return res.status(403).json({ error: 'Forbidden access' });

    await deleteProductById(productId);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('deleteProduct error:', error);
    res.status(500).json({ error: 'Error while deleting product' });
  }
}

async function createProductVersion(req, res) {
  try {
    const { productId } = req.params;
    const payload = req.body;

    const product = await getProductById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (!ensureOwner(product, req.userId)) return res.status(403).json({ error: 'Forbidden access' });

    const version = await createProductVersionInDb({
      productId,
      ownerId: req.userId,
      versionLabel: payload.versionLabel || 'v1',
      status: payload.status || 'draft',
      price: payload.price ?? 0,
      currency: payload.currency || 'EUR',
      ebookPayload: payload.ebookPayload || null,
      marketingCopy: payload.marketingCopy || null
    });

    res.status(201).json({ productVersion: version });
  } catch (error) {
    console.error('createProductVersion error:', error);
    res.status(500).json({ error: 'Error while creating product version' });
  }
}

async function getProductVersion(req, res) {
  try {
    const { productId, versionId } = req.params;
    const product = await getProductById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (!ensureOwner(product, req.userId)) return res.status(403).json({ error: 'Forbidden access' });

    const version = await getProductVersionById(versionId);
    if (!version || version.productId !== productId) {
      return res.status(404).json({ error: 'Product version not found' });
    }

    res.json({ productVersion: version });
  } catch (error) {
    console.error('getProductVersion error:', error);
    res.status(500).json({ error: 'Error while fetching product version' });
  }
}

async function updateProductVersion(req, res) {
  try {
    const { productId, versionId } = req.params;
    const payload = req.body;

    const product = await getProductById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (!ensureOwner(product, req.userId)) return res.status(403).json({ error: 'Forbidden access' });

    const existing = await getProductVersionById(versionId);
    if (!existing || existing.productId !== productId) return res.status(404).json({ error: 'Product version not found' });

    const updated = await updateProductVersionById(versionId, {
      versionLabel: payload.versionLabel,
      status: payload.status,
      price: payload.price,
      currency: payload.currency,
      ebookPayload: payload.ebookPayload,
      marketingCopy: payload.marketingCopy
    });

    res.json({ productVersion: updated });
  } catch (error) {
    console.error('updateProductVersion error:', error);
    res.status(500).json({ error: 'Error while updating product version' });
  }
}

async function deleteProductVersion(req, res) {
  try {
    const { productId, versionId } = req.params;

    const product = await getProductById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (!ensureOwner(product, req.userId)) return res.status(403).json({ error: 'Forbidden access' });

    const existing = await getProductVersionById(versionId);
    if (!existing || existing.productId !== productId) return res.status(404).json({ error: 'Product version not found' });

    await deleteProductVersionById(versionId);
    res.json({ message: 'Product version deleted' });
  } catch (error) {
    console.error('deleteProductVersion error:', error);
    res.status(500).json({ error: 'Error while deleting product version' });
  }
}

async function duplicateProduct(req, res) {
  try {
    const { productId } = req.params;
    const existing = await getProductById(productId);
    if (!existing) return res.status(404).json({ error: 'Product not found' });
    if (!ensureOwner(existing, req.userId)) return res.status(403).json({ error: 'Forbidden access' });

    const versions = await listVersionsByProduct(productId);

    const dup = await createProductInDb({
      ownerId: req.userId,
      title: existing.title + ' (copy)',
      slug: slugify(existing.title + '-copy-' + Date.now()),
      description: existing.description || null,
      status: 'draft',
      coverMediaId: existing.coverMediaId || null,
      theme: existing.theme || null,
      ebookId: existing.ebookId || null,
      landingPageSlug: null,
      createdBy: req.userId
    });

    for (const v of versions) {
      await createProductVersionInDb({
        productId: dup.id,
        ownerId: req.userId,
        versionLabel: v.versionLabel || 'v1',
        status: 'draft',
        price: v.price ?? 0,
        currency: v.currency || 'EUR',
        ebookPayload: v.ebookPayload || null,
        marketingCopy: v.marketingCopy || null
      });
    }

    res.status(201).json({ product: dup });
  } catch (error) {
    console.error('duplicateProduct error:', error);
    res.status(500).json({ error: 'Error duplicating product' });
  }
}

module.exports = {
  listProducts,
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  createProductVersion,
  getProductVersion,
  updateProductVersion,
  deleteProductVersion
};

