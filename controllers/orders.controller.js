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

async function guestCheckout(req, res) {
  try {
    const { items, guestEmail, currency = 'eur', successUrl, cancelUrl, couponCode } = req.body || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
    }
    if (!guestEmail) {
      return res.status(400).json({ error: 'Guest email is required' });
    }

    const rawTotal = items.reduce((sum, item) => sum + Number(item.price), 0);

    let couponInfo = null;
    let totalAmount = rawTotal;
    if (couponCode) {
      const result = await validateCouponCode(couponCode, rawTotal);
      if (!result.valid) return res.status(400).json({ error: result.error || 'Invalid coupon' });
      couponInfo = { code: couponCode.toUpperCase(), discount: result.discount, couponId: result.coupon.id };
      totalAmount = result.finalAmount;
    }

    const order = await createOrder({
      userId: null,
      userEmail: guestEmail,
      status: 'pending',
      currency: currency.toUpperCase(),
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
      couponDiscount: couponInfo?.discount || 0,
      isGuest: true
    });

    const session = await createDigitalCheckoutSession({
      userId: 'guest_' + order.id,
      userEmail: guestEmail,
      orderId: order.id,
      items,
      amount: totalAmount,
      currency,
      successUrl: successUrl || (process.env.FRONTEND_URL || 'http://localhost:3000') + '/thank-you?orderId=' + order.id,
      cancelUrl: cancelUrl || (process.env.FRONTEND_URL || 'http://localhost:3000') + '/cart?payment=cancel'
    });

    return res.json({
      orderId: order.id,
      sessionId: session.id,
      url: session.url,
      discount: couponInfo?.discount || 0
    });
  } catch (error) {
    console.error('guestCheckout error:', error);
    return res.status(500).json({ error: 'Error while creating guest checkout session' });
  }
}

async function listCustomers(req, res) {
  try {
    const userId = req.userId;
    const { listOrdersByUser } = require('../services/firebase.service');
    const { getOrderById } = require('../services/firebase.service');
    
    // Get all orders that belong to this user's products
    // First get all products owned by user
    const { listProductsByOwner } = require('../services/firebase.service');
    const products = await listProductsByOwner(userId);
    const productIds = products.map(p => p.id);
    
    if (!productIds.length) return res.json({ customers: [] });
    
    // Get all orders (we need to query orders collection)
    const db = require('../services/firebase.service').getDb();
    const ordersSnap = await db.collection('orders')
      .where('status', '==', 'paid')
      .get();
    
    const customerMap = {};
    ordersSnap.docs.forEach(doc => {
      const data = doc.data();
      const items = data.items || [];
      const hasMyProduct = items.some(item => productIds.includes(item.productId)) || 
        (data.productId && productIds.includes(data.productId));
      
      if (hasMyProduct) {
        const email = data.userEmail || data.email || 'unknown';
        if (!customerMap[email]) {
          customerMap[email] = {
            email,
            userId: data.userId,
            isGuest: data.isGuest || false,
            totalSpent: 0,
            orderCount: 0,
            lastPurchase: data.createdAt || null,
            products: []
          };
        }
        customerMap[email].totalSpent += (data.totals?.finalTotal || 0);
        customerMap[email].orderCount++;
        if (!customerMap[email].lastPurchase || data.createdAt > customerMap[email].lastPurchase) {
          customerMap[email].lastPurchase = data.createdAt;
        }
        items.forEach(item => {
          if (productIds.includes(item.productId)) {
            const title = item.title || 'Product';
            if (!customerMap[email].products.includes(title)) {
              customerMap[email].products.push(title);
            }
          }
        });
      }
    });
    
    const customers = Object.values(customerMap).sort((a, b) => {
      if (!a.lastPurchase) return 1;
      if (!b.lastPurchase) return -1;
      return b.lastPurchase.localeCompare(a.lastPurchase);
    });
    
    return res.json({ customers });
  } catch (error) {
    console.error('listCustomers error:', error);
    return res.status(500).json({ error: 'Error listing customers' });
  }
}

async function exportOrdersCSV(req, res) {
  try {
    const userId = req.userId;
    const orders = await (require('../services/firebase.service').listOrdersByUser)(userId);

    const headers = 'Order ID,Date,Email,Status,Items,Currency,Total,Discount,Coupon\n';
    const rows = orders.map(o => {
      const id = (o.id || '').replace(/"/g, '""');
      const date = o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : '';
      const email = (o.userEmail || o.email || '').replace(/"/g, '""');
      const status = o.status || '';
      const items = (o.items || []).map(i => (i.title || '') + ' ' + (i.versionLabel || '')).join('; ').replace(/"/g, '""');
      const currency = o.currency || 'EUR';
      const total = o.totals?.finalTotal != null ? (o.totals.finalTotal / 100).toFixed(2) : '';
      const discount = o.totals?.discount != null ? (o.totals.discount / 100).toFixed(2) : '';
      const coupon = o.couponCode || '';
      return `"${id}","${date}","${email}","${status}","${items}","${currency}","${total}","${discount}","${coupon}"`;
    }).join('\n');

    const csv = '\uFEFF' + headers + rows;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
    res.send(csv);
  } catch (error) {
    console.error('exportOrdersCSV error:', error);
    return res.status(500).json({ error: 'Error exporting orders' });
  }
}

module.exports = {
  createCheckoutSession,
  listMyOrders,
  getMyOrder,
  validateCouponCode,
  guestCheckout,
  listCustomers,
  exportOrdersCSV
};
