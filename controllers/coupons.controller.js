const { createCoupon, listCouponsByOwner, getCouponByCode, updateCouponById, deleteCouponById } = require('../services/firebase.service');

async function listCoupons(req, res) {
  try {
    const coupons = await listCouponsByOwner(req.userId);
    res.json({ coupons });
  } catch (error) {
    console.error('listCoupons error:', error);
    res.status(500).json({ error: 'Error fetching coupons' });
  }
}

async function create(req, res) {
  try {
    const payload = req.body;
    if (!payload.code) return res.status(400).json({ error: 'Coupon code is required' });
    if (!payload.discountPercent && !payload.discountAmount) {
      return res.status(400).json({ error: 'Discount percent or amount required' });
    }
    const existing = await getCouponByCode(payload.code);
    if (existing) return res.status(409).json({ error: 'Coupon code already exists' });

    const coupon = await createCoupon({
      ownerId: req.userId,
      code: payload.code.toUpperCase(),
      description: payload.description || null,
      discountPercent: payload.discountPercent || null,
      discountAmount: payload.discountAmount || null,
      minAmount: payload.minAmount || null,
      maxUses: payload.maxUses || null,
      currentUses: 0,
      expiresAt: payload.expiresAt || null,
      productId: payload.productId || null,
      active: payload.active !== false
    });
    res.status(201).json({ coupon });
  } catch (error) {
    console.error('createCoupon error:', error);
    res.status(500).json({ error: 'Error creating coupon' });
  }
}

async function remove(req, res) {
  try {
    const { couponId } = req.params;
    await deleteCouponById(couponId);
    res.json({ message: 'Coupon deleted' });
  } catch (error) {
    console.error('deleteCoupon error:', error);
    res.status(500).json({ error: 'Error deleting coupon' });
  }
}

async function validate(req, res) {
  try {
    const { code, amount } = req.body;
    if (!code) return res.status(400).json({ error: 'Code required' });

    const coupon = await getCouponByCode(code);
    if (!coupon) return res.status(404).json({ valid: false, error: 'Invalid coupon code' });
    if (!coupon.active) return res.status(400).json({ valid: false, error: 'Coupon is inactive' });
    if (coupon.ownerId !== req.userId && req.userId) {
      // Allow if the coupon belongs to the same user or is global
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ valid: false, error: 'Coupon has expired' });
    }
    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return res.status(400).json({ valid: false, error: 'Coupon usage limit reached' });
    }

    let discount = 0;
    if (coupon.discountPercent) {
      discount = Math.round((amount || 0) * coupon.discountPercent / 100);
    } else if (coupon.discountAmount) {
      discount = coupon.discountAmount;
    }

    res.json({ valid: true, coupon, discount, finalAmount: Math.max(0, (amount || 0) - discount) });
  } catch (error) {
    console.error('validateCoupon error:', error);
    res.status(500).json({ error: 'Error validating coupon' });
  }
}

module.exports = { listCoupons, create, remove, validate };
