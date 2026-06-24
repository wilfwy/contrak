const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Crée une session Stripe Checkout pour le plan PRO
 */
async function createCheckoutSession(userId, userEmail) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Plan PRO - Contrak',
            description: 'Accès illimité à tous les contrats sans watermark'
          },
          unit_amount: 990, // 9.90 EUR en centimes
          recurring: {
            interval: 'month'
          }
        },
        quantity: 1
      }
    ],
    mode: 'subscription',
    success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pricing`,
    customer_email: userEmail,
    metadata: {
      userId: userId
    }
  });

  return session;
}

/**
 * ===== Commerce (digital product) =====
 * MVP: paiement one-time pour une product_version
 */
function getFrontendUrl() {
  return process.env.FRONTEND_URL || 'http://localhost:3000';
}

async function createDigitalCheckoutSession({
  userId,
  userEmail,
  orderId,
  productId,
  productVersionId,
  currency = 'eur',
  amount,
  successUrl: customSuccessUrl,
  cancelUrl: customCancelUrl,
  items
}) {
  if (!orderId) throw new Error('Missing orderId');
  if (!userId) throw new Error('Missing userId');
  if (!userEmail) throw new Error('Missing userEmail');
  if (!items && !productVersionId && !productId) throw new Error('Missing productVersionId (or productId)');

  const frontendUrl = getFrontendUrl();
  const successUrl = customSuccessUrl || `${frontendUrl}/dashboard?payment=success&orderId=${orderId}`;
  const cancelUrl = customCancelUrl || `${frontendUrl}/dashboard?payment=cancel`;

  // If multi-item (cart), build line_items from items array
  // Otherwise fallback to single-item mode for backward compat
  let lineItems;
  if (items && items.length > 0) {
    lineItems = items.map(item => ({
      price_data: {
        currency: item.currency || 'eur',
        product_data: {
          name: item.title || item.versionLabel || 'Digital product',
          description: item.versionLabel || ''
        },
        unit_amount: Number(item.price)
      },
      quantity: 1
    }));
  } else {
    const normalizedAmount = amount != null ? Number(amount) : null;
    if (!normalizedAmount || Number.isNaN(normalizedAmount)) {
      throw new Error('Missing/invalid amount');
    }
    lineItems = [{
      price_data: {
        currency,
        product_data: {
          name: 'Contrak - Digital product',
          description: 'Accès à votre version digitale'
        },
        unit_amount: normalizedAmount
      },
      quantity: 1
    }];
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: userEmail,
    metadata: {
      userId,
      orderId,
      productId: productId || null,
      productVersionId: productVersionId || null
    }
  });

  return session;
}

/**
 * Vérifie et récupère une session Stripe
 */
async function getSession(sessionId) {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return session;
}

/**
 * Récupère ou crée un customer Stripe
 */
async function getOrCreateCustomer(email, userId) {
  const customers = await stripe.customers.list({
    email: email,
    limit: 1
  });

  if (customers.data.length > 0) {
    return customers.data[0];
  }

  return await stripe.customers.create({
    email: email,
    metadata: {
      userId: userId
    }
  });
}

/**
 * Crée un portal session pour gérer l'abonnement
 */
async function createPortalSession(customerId, returnUrl) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl
  });

  return session;
}

module.exports = {
  createCheckoutSession,
  createDigitalCheckoutSession,
  getSession,
  getOrCreateCustomer,
  createPortalSession
};
