const { getCart, setCart, getProductVersionById, getProductById } = require('../services/firebase.service');

async function getMyCart(req, res) {
  try {
    const cart = await getCart(req.userId);
    res.json({ cart });
  } catch (error) {
    console.error('getCart error:', error);
    res.status(500).json({ error: 'Error fetching cart' });
  }
}

async function addItem(req, res) {
  try {
    const { productVersionId } = req.body;
    if (!productVersionId) return res.status(400).json({ error: 'Missing productVersionId' });

    const version = await getProductVersionById(productVersionId);
    if (!version) return res.status(404).json({ error: 'Version not found' });

    const product = await getProductById(version.productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const cart = await getCart(req.userId);
    const items = cart.items || [];

    // Check if already in cart
    if (items.some(item => item.productVersionId === productVersionId)) {
      return res.json({ cart: { ...cart, items }, message: 'Item already in cart' });
    }

    const newItem = {
      productId: version.productId,
      productVersionId,
      title: product.title || 'Untitled',
      versionLabel: version.versionLabel || '',
      price: version.price,
      currency: version.currency || 'eur'
    };

    items.push(newItem);
    const updated = await setCart(req.userId, items);
    res.json({ cart: updated });
  } catch (error) {
    console.error('addToCart error:', error);
    res.status(500).json({ error: 'Error adding to cart' });
  }
}

async function removeItem(req, res) {
  try {
    const { productVersionId } = req.params;
    const cart = await getCart(req.userId);
    const items = (cart.items || []).filter(item => item.productVersionId !== productVersionId);
    const updated = await setCart(req.userId, items);
    res.json({ cart: updated });
  } catch (error) {
    console.error('removeFromCart error:', error);
    res.status(500).json({ error: 'Error removing from cart' });
  }
}

async function clearCart(req, res) {
  try {
    const updated = await setCart(req.userId, []);
    res.json({ cart: updated });
  } catch (error) {
    console.error('clearCart error:', error);
    res.status(500).json({ error: 'Error clearing cart' });
  }
}

module.exports = {
  getMyCart,
  addItem,
  removeItem,
  clearCart
};
