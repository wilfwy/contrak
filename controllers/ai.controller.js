const { generateLandingPage, generateMarketingCopy, generateMarketingEmail, hasAnthropicKey } = require('../services/ai.service');

async function checkKey(req, res) {
  res.json({ available: hasAnthropicKey() });
}

async function landingPage(req, res) {
  try {
    if (!hasAnthropicKey()) return res.status(400).json({ error: 'Anthropic API key not configured' });
    const { productTitle, productDescription, keywords } = req.body;
    if (!productTitle) return res.status(400).json({ error: 'productTitle is required' });
    const result = await generateLandingPage(productTitle, productDescription, keywords);
    res.json({ result });
  } catch (error) {
    console.error('AI landing page error:', error);
    res.status(500).json({ error: 'Error generating landing page' });
  }
}

async function marketingCopy(req, res) {
  try {
    if (!hasAnthropicKey()) return res.status(400).json({ error: 'Anthropic API key not configured' });
    const { productTitle, productDescription, targetAudience } = req.body;
    if (!productTitle) return res.status(400).json({ error: 'productTitle is required' });
    const result = await generateMarketingCopy(productTitle, productDescription, targetAudience);
    res.json({ result });
  } catch (error) {
    console.error('AI marketing copy error:', error);
    res.status(500).json({ error: 'Error generating marketing copy' });
  }
}

async function marketingEmail(req, res) {
  try {
    if (!hasAnthropicKey()) return res.status(400).json({ error: 'Anthropic API key not configured' });
    const { productTitle, productDescription, emailType } = req.body;
    if (!productTitle) return res.status(400).json({ error: 'productTitle is required' });
    const result = await generateMarketingEmail(productTitle, productDescription, emailType);
    res.json({ result });
  } catch (error) {
    console.error('AI marketing email error:', error);
    res.status(500).json({ error: 'Error generating marketing email' });
  }
}

module.exports = { checkKey, landingPage, marketingCopy, marketingEmail };
