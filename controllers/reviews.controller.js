const { createReview, listReviewsByProduct, getAverageRating, hasUserReviewedProduct } = require('../services/firebase.service');

async function addReview(req, res) {
  try {
    const { productId, rating, comment } = req.body;
    if (!productId || !rating) return res.status(400).json({ error: 'productId and rating required' });
    if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });

    const already = await hasUserReviewedProduct(req.userId, productId);
    if (already) return res.status(409).json({ error: 'You already reviewed this product' });

    const review = await createReview({ userId: req.userId, userEmail: req.user.email || '', productId, rating, comment: comment || '' });
    const avg = await getAverageRating(productId);
    res.status(201).json({ review, average: avg });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

async function listReviews(req, res) {
  try {
    const { productId } = req.params;
    const reviews = await listReviewsByProduct(productId);
    const avg = await getAverageRating(productId);
    res.json({ reviews, average: avg });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

module.exports = { addReview, listReviews };
