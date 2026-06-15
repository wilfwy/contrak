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
  getSession,
  getOrCreateCustomer,
  createPortalSession
};