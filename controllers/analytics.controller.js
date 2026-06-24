const { trackEvent, getAnalyticsStats, getSalesAnalytics } = require('../services/firebase.service');

async function track(req, res) {
  try {
    const { type, productId, amount, metadata } = req.body;
    if (!type) return res.status(400).json({ error: 'Missing event type' });

    await trackEvent({
      type,
      productId: productId || null,
      amount: amount || null,
      ownerId: req.userId || null,
      metadata: metadata || {},
      ip: req.ip || null,
      userAgent: req.headers['user-agent'] || null
    });

    res.json({ ok: true });
  } catch (error) {
    console.error('Track event error:', error);
    res.status(500).json({ error: 'Error tracking event' });
  }
}

async function stats(req, res) {
  try {
    const stats = await getAnalyticsStats(req.userId);
    res.json({ stats });
  } catch (error) {
    console.error('Analytics stats error:', error);
    res.status(500).json({ error: 'Error fetching stats' });
  }
}

async function salesDashboard(req, res) {
  try {
    const data = await getSalesAnalytics(req.userId);
    res.json({ data });
  } catch (error) {
    console.error('Sales analytics error:', error);
    res.status(500).json({ error: 'Error fetching sales analytics' });
  }
}

module.exports = { track, stats, salesDashboard };
