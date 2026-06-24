const { createDigitalCheckoutSession } = require('../services/stripe.service');
const { createOrder, getCart, getCouponByCode } = require('../services/firebase.service');

/**
 * Validate a coupon code and compute discount for a given amount
 */
async function validateCouponCode(code, amount) {
  if (!code) return { valid: false };
  const coupon = await getCouponByCode(code);
  if (!coupon) return { valid: false, error: 'Invalid coupon code' };
  if (!coupon.active) return { valid: false, error: 'Coupon is inactive' };
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { valid: false, error: 'Coupon has expired' };
  }
  if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
    return { valid: false, error: 'Coupon usage limit reached' };
  }
  if (coupon.minAmount && amount < coupon.minAmount) {
    return { valid: false, error: `Minimum amount of ${coupon.minAmount} not met` };
  }

  let discount = 0;
  if (coupon.discountPercent) {
    discount = Math.round(amount * coupon.discountPercent / 100);
  } else if (coupon.discountAmount) {
    discount = coupon.discountAmount;
  }
  discount = Math.min(discount, amount); // never go below zero

  return { valid: true, coupon, discount, finalAmount: amount - discount };
}

/**
 * Creates a Stripe Checkout session.
 * Supports:
 * - Cart-based (no productVersionId) — reads items from user's cart
 * - Single-item checkout (productVersionId provided)
 * - Optional couponCode for discount
 */
async function createCheckoutSession(req, res) {
  try {
    const userId = req.userId;
    const userEmail = req.user.email || req.userInfo?.email;

    if (!userId) return res.status(401).json({ error: 'Missing userId' });
    if (!userEmail) return res.status(400).json({ error: 'Missing user email' });

    const { productVersionId, currency = 'eur', amount, successUrl, cancelUrl, couponCode } = req.body || {};

    // ===== Cart-based checkout =====
    if (!productVersionId) {
      const cart = await getCart(userId);
      if (!cart.items || cart.items.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
      }

      let items = cart.items;

      // Determine order currency: use body currency override, or detect from items
      const uniqueCurrencies = [...new Set(items.map(i => (i.currency || 'EUR').toUpperCase()))];
      let orderCurrency = currency.toUpperCase();
      if (!currency || currency === 'eur') {
        if (uniqueCurrencies.length === 1) {
          orderCurrency = uniqueCurrencies[0];
        } else {
          // Mixed currencies — default to EUR, items keep their own currency for display
          orderCurrency = 'EUR';
        }
      }

      const rawTotal = items.reduce((sum, item) => sum + Number(item.price), 0);

      // Apply coupon to total
      let couponInfo = null;
      let totalAmount = rawTotal;
      if (couponCode) {
        const result = await validateCouponCode(couponCode, rawTotal);
        if (!result.valid) return res.status(400).json({ error: result.error || 'Invalid coupon' });
        couponInfo = { code: couponCode.toUpperCase(), discount: result.discount, couponId: result.coupon.id };
        totalAmount = result.finalAmount;
      }

      const order = await createOrder({
        userId,
        status: 'pending',
        currency: orderCurrency,
        totals: { total: rawTotal, discount: couponInfo?.discount || 0, finalTotal: totalAmount },
        items: items.map(item => ({
          productId: item.productId,
          productVersionId: item.productVersionId,
          title: item.title,
          versionLabel: item.versionLabel,
          price: Number(item.price),
          currency: item.currency || 'EUR'
        })),
        couponCode: couponInfo?.code || null,
        couponId: couponInfo?.couponId || null,
        couponDiscount: couponInfo?.discount || 0
      });

      const session = await createDigitalCheckoutSession({
        userId,
        userEmail,
        orderId: order.id,
        items,
        amount: totalAmount,
        currency,
        successUrl,
        cancelUrl
      });

      return res.json({
        orderId: order.id,
        sessionId: session.id,
        url: session.url,
        discount: couponInfo?.discount || 0
      });
    }

    // ===== Single-item checkout =====
    const version = await (require('../services/firebase.service').getProductVersionById)(productVersionId);
    if (!version) return res.status(404).json({ error: 'Version not found' });

    const rawAmount = amount || version.price;

    // Apply coupon
    let couponInfo = null;
    let finalAmount = rawAmount;
    if (couponCode) {
      const result = await validateCouponCode(couponCode, rawAmount);
      if (!result.valid) return res.status(400).json({ error: result.error || 'Invalid coupon' });
      couponInfo = { code: couponCode.toUpperCase(), discount: result.discount, couponId: result.coupon.id };
      finalAmount = result.finalAmount;
    }

    const order = await createOrder({
      userId,
      status: 'pending',
      currency,
      totals: { total: rawAmount, discount: couponInfo?.discount || 0, finalTotal: finalAmount },
      productId: version.productId || null,
      productVersionId,
      couponCode: couponInfo?.code || null,
      couponId: couponInfo?.couponId || null,
      couponDiscount: couponInfo?.discount || 0
    });

    const session = await createDigitalCheckoutSession({
      userId,
      userEmail,
      orderId: order.id,
      productVersionId,
      currency,
      amount: finalAmount,
      successUrl,
      cancelUrl
    });

    return res.json({
      orderId: order.id,
      sessionId: session.id,
      url: session.url,
      discount: couponInfo?.discount || 0
    });
  } catch (error) {
    console.error('createCheckoutSession error:', error);
    return res.status(500).json({ error: 'Error while creating checkout session' });
  }
}

async function listMyOrders(req, res) {
  try {
    const userId = req.userId;
    const orders = await require('../services/firebase.service').listOrdersByUser(userId);
    return res.json({ orders });
  } catch (error) {
    console.error('listMyOrders error:', error);
    return res.status(500).json({ error: 'Error while listing orders' });
  }
}

async function getMyOrder(req, res) {
  try {
    const userId = req.userId;
    const { orderId } = req.params;
    const { getOrderById } = require('../services/firebase.service');
    const order = await getOrderById(orderId, userId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    return res.json({ order });
  } catch (error) {
    console.error('getMyOrder error:', error);
    return res.status(500).json({ error: 'Error while getting order' });
  }
}

module.exports = {
  createCheckoutSession,
  listMyOrders,
  getMyOrder,
  validateCouponCode
};
