const { createCheckoutSession: createStripeCheckoutSession, getSession, createPortalSession: createStripePortalSession } = require('../services/stripe.service');
const { updateUserPlan, getUser } = require('../services/firebase.service');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createCheckoutSession(req, res) {
  try {
    const userEmail = req.user.email || req.userInfo?.email;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'Missing user email' });
    }

    const session = await createStripeCheckoutSession(req.userId, userEmail);
    
    res.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Stripe session creation error:', error);
    res.status(500).json({ error: 'Error while creating payment session' });
  }
}

async function success(req, res) {
  try {
    const { session_id } = req.query;
    
    if (!session_id) {
      return res.status(400).send('Missing session ID');
    }

    const session = await getSession(session_id);
    
    if (session.payment_status === 'paid') {
      const userId = session.metadata?.userId;
      if (userId) {
        await updateUserPlan(userId, 'pro');
      }
      
      return res.redirect('/dashboard?upgraded=true');
    }

    res.redirect('/pricing?error=payment_failed');
  } catch (error) {
    console.error('Payment success handling error:', error);
    res.redirect('/pricing?error=payment_error');
  }
}

async function webhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const userId = session.metadata?.userId;
      
      if (userId && session.payment_status === 'paid') {
        await updateUserPlan(userId, 'pro');
        console.log(`User ${userId} upgraded to PRO`);
      }
      break;

    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      const customer = await stripe.customers.retrieve(subscription.customer);
      const user = await getUser(customer.metadata?.userId);
      if (user) {
        await updateUserPlan(user.uid || user.id, 'basic');
        console.log(`User ${user.uid || user.id} downgraded to BASIC`);
      }
      break;

    default:
      console.log(`Unhandled event: ${event.type}`);
  }

  res.json({ received: true });
}

async function createPortalSession(req, res) {
  try {
    const userEmail = req.user.email || req.userInfo?.email;
    const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`;

    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    });

    if (customers.data.length === 0) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const customer = customers.data[0];
    const session = await createStripePortalSession(customer.id, returnUrl);

    res.json({ url: session.url });
  } catch (error) {
    console.error('Billing portal creation error:', error);
    res.status(500).json({ error: 'Error while creating billing portal' });
  }
}

module.exports = {
  createCheckoutSession,
  success,
  webhook,
  createPortalSession
};
