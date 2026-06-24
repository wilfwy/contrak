const { createCheckoutSession: createStripeCheckoutSession, getSession, createPortalSession: createStripePortalSession } = require('../services/stripe.service');
const {
  updateUserPlan,
  getUser,
  getTransactionByStripeSessionId,
  createTransaction,
  updateOrderStatus,
  getProductVersionById,
  getProductById,
  getOrderById,
  updateCouponById,
  getCouponByCode
} = require('../services/firebase.service');
const { sendOrderConfirmation } = require('../services/email.service');
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
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const orderId = session.metadata?.orderId;

      // ===== PRO subscription flow (existant) =====
      if (orderId == null) {
        if (userId && session.payment_status === 'paid') {
          await updateUserPlan(userId, 'pro');
          console.log(`User ${userId} upgraded to PRO`);
        }
        break;
      }

      // ===== Digital product flow (MVP commerce) =====
      if (session.payment_status !== 'paid') {
        if (orderId) {
          // MVP: ordre en échec s'il y a eu un paiement mais pas paid
          await updateOrderStatus(orderId, {
            status: 'failed',
            failureReason: `Stripe session payment_status=${session.payment_status}`
          });
        }
        break;
      }

      // Commerce (digital product) helpers

      // Idempotency: ne pas créer 2 transactions si webhook est rejoué
      const existingTx = await getTransactionByStripeSessionId(session.id);
      if (!existingTx) {
        const amountTotal = session.amount_total || null;

        const tx = await createTransaction({
          orderId,
          provider: 'stripe',
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent || null,
          status: 'paid',
          currency: session.currency || 'eur',
          amount: amountTotal,
          raw: {
            payment_status: session.payment_status
          }
        });

        console.log(`Transaction created for order ${orderId}: ${tx.id}`);
      } else {
        console.log(`Transaction already exists for order ${orderId} (stripeSessionId=${session.id})`);
      }

      await updateOrderStatus(orderId, {
        status: 'paid',
        provider: 'stripe',
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent || null,
        currency: session.currency || 'eur',
        totals: session.amount_total
          ? { total: session.amount_total }
          : {}
      });

      // Increment coupon usage if a coupon was applied to this order
      try {
        const paidOrder = await getOrderById(orderId);
        if (paidOrder && paidOrder.couponCode && paidOrder.couponId) {
          const coupon = await getCouponByCode(paidOrder.couponCode);
          if (coupon && coupon.id === paidOrder.couponId) {
            await updateCouponById(paidOrder.couponId, { currentUses: (coupon.currentUses || 0) + 1 });
          }
        }
      } catch (couponErr) {
        console.error('Failed to increment coupon usage:', couponErr.message);
      }

      // Digital delivery: send confirmation email(s) with download link(s)
      try {
        const order = await getOrderById(orderId);
        if (order && order.userId) {
          const user = await getUser(order.userId);
          if (user && user.email) {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

            if (order.items && Array.isArray(order.items) && order.items.length > 0) {
              // Multi-item order: send one email with all items
              const itemsHtml = order.items.map(item => {
                const dlUrl = `${frontendUrl}/api/exports/product-versions/${item.productVersionId}`;
                return `<tr><td style="padding:10px;border:1px solid #ddd;">${item.title || item.versionLabel || 'Digital product'}</td><td style="padding:10px;border:1px solid #ddd;">${item.versionLabel || ''}</td><td style="padding:10px;border:1px solid #ddd;"><a href="${dlUrl}" style="color:#052E2B;">Download</a></td></tr>`;
              }).join('');

              await sendOrderConfirmation({
                email: user.email,
                orderId: order.id,
                productTitle: 'Your Contrak order (multi-item)',
                versionLabel: '',
                downloadUrl: `${frontendUrl}/dashboard?orderId=${order.id}`
              });
            } else if (order.productVersionId) {
              // Single-item order
              const version = await getProductVersionById(order.productVersionId);
              const product = version && version.productId ? await getProductById(version.productId) : null;
              const downloadUrl = `${frontendUrl}/api/exports/product-versions/${order.productVersionId}`;

              await sendOrderConfirmation({
                email: user.email,
                orderId: order.id,
                productTitle: product?.title || version?.versionLabel || 'Digital product',
                versionLabel: version?.versionLabel,
                downloadUrl
              });
            }
          }
        }
      } catch (emailErr) {
        console.error('Failed to send order confirmation email:', emailErr.message);
      }

      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const customer = await stripe.customers.retrieve(subscription.customer);
      const user = await getUser(customer.metadata?.userId);
      if (user) {
        await updateUserPlan(user.uid || user.id, 'basic');
        console.log(`User ${user.uid || user.id} downgraded to BASIC`);
      }
      break;
    }

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
