const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

function getFromAddress() {
  return process.env.SMTP_FROM || 'noreply@contrak.io';
}

function getFrontendUrl() {
  return process.env.FRONTEND_URL || 'http://localhost:3000';
}

async function sendEmail({ to, subject, html }) {
  if (!to || !subject || !html) {
    console.warn('Email skipped: missing required fields');
    return;
  }
  try {
    const info = await transporter.sendMail({
      from: `"Contrak" <${getFromAddress()}>`,
      to,
      subject,
      html
    });
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Email send error:', error.message);
  }
}

async function sendOrderConfirmation({ email, orderId, productTitle, versionLabel, downloadUrl }) {
  const subject = `Your order #${orderId.slice(0, 8)} is confirmed!`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#052E2B;padding:20px;text-align:center;">
        <h1 style="color:#fff;margin:0;">CONTRAK</h1>
      </div>
      <div style="padding:30px;background:#f9f9f9;">
        <h2>Thank you for your purchase!</h2>
        <p>Your order <strong>#${orderId.slice(0, 8)}</strong> has been confirmed.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <tr><td style="padding:10px;border:1px solid #ddd;"><strong>Product</strong></td><td style="padding:10px;border:1px solid #ddd;">${productTitle}</td></tr>
          <tr><td style="padding:10px;border:1px solid #ddd;"><strong>Version</strong></td><td style="padding:10px;border:1px solid #ddd;">${versionLabel || 'Standard'}</td></tr>
        </table>
        <a href="${downloadUrl}" style="display:inline-block;background:#052E2B;color:#fff;padding:12px 32px;border-radius:9999px;text-decoration:none;font-weight:600;">Download your product</a>
        <p style="margin-top:20px;color:#666;font-size:0.9rem;">This link will expire in 7 days.</p>
      </div>
      <div style="padding:15px;text-align:center;color:#999;font-size:0.8rem;">
        <p>Contrak - ${getFrontendUrl()}</p>
      </div>
    </div>
  `;
  return sendEmail({ to: email, subject, html });
}

async function sendPasswordResetEmail({ email, resetLink }) {
  const subject = 'Reset your Contrak password';
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#052E2B;padding:20px;text-align:center;">
        <h1 style="color:#fff;margin:0;">CONTRAK</h1>
      </div>
      <div style="padding:30px;background:#f9f9f9;">
        <h2>Password Reset</h2>
        <p>You requested a password reset. Click the link below to set a new password.</p>
        <a href="${resetLink}" style="display:inline-block;background:#052E2B;color:#fff;padding:12px 32px;border-radius:9999px;text-decoration:none;font-weight:600;">Reset Password</a>
        <p style="margin-top:20px;color:#666;font-size:0.9rem;">This link will expire in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
      <div style="padding:15px;text-align:center;color:#999;font-size:0.8rem;">
        <p>Contrak - ${getFrontendUrl()}</p>
      </div>
    </div>
  `;
  return sendEmail({ to: email, subject, html });
}

async function sendNewOrderNotification({ email, orderId, customerEmail, productTitle, amount, currency }) {
  const subject = 'New sale: ' + productTitle + ' - Contrak';
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#052E2B;padding:20px;text-align:center;">
        <h1 style="color:#fff;margin:0;">CONTRAK</h1>
      </div>
      <div style="padding:30px;background:#f9f9f9;">
        <h2>You made a sale! 🎉</h2>
        <p>Someone just purchased your product.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <tr><td style="padding:10px;border:1px solid #ddd;"><strong>Product</strong></td><td style="padding:10px;border:1px solid #ddd;">${productTitle}</td></tr>
          <tr><td style="padding:10px;border:1px solid #ddd;"><strong>Customer</strong></td><td style="padding:10px;border:1px solid #ddd;">${customerEmail}</td></tr>
          <tr><td style="padding:10px;border:1px solid #ddd;"><strong>Amount</strong></td><td style="padding:10px;border:1px solid #ddd;">${((amount || 0) / 100).toFixed(2)} ${currency || 'EUR'}</td></tr>
          <tr><td style="padding:10px;border:1px solid #ddd;"><strong>Order</strong></td><td style="padding:10px;border:1px solid #ddd;">#${(orderId || '').slice(0, 8)}</td></tr>
        </table>
        <a href="${getFrontendUrl()}/orders-admin" style="display:inline-block;background:#052E2B;color:#fff;padding:12px 32px;border-radius:9999px;text-decoration:none;font-weight:600;">View Orders</a>
      </div>
      <div style="padding:15px;text-align:center;color:#999;font-size:0.8rem;">
        <p>Contrak - ${getFrontendUrl()}</p>
      </div>
    </div>
  `;
  return sendEmail({ to: email, subject, html });
}

module.exports = {
  sendEmail,
  sendOrderConfirmation,
  sendPasswordResetEmail,
  sendNewOrderNotification
};
