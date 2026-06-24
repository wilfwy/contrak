const { callGrok, hasGrokKey, parseAIJsonResponse } = require('./grok.service');

function hasAnthropicKey() {
  return hasGrokKey();
}

async function generateLandingPage(productTitle, productDescription, keywords) {
  if (!hasGrokKey()) {
    throw new Error('Grok API key not configured');
  }

  const prompt = `Output ONLY valid JSON for a landing page. Use these exact field names.

Product: "${productTitle}"
Description: "${productDescription || ''}"
Keywords: "${keywords || ''}"

Required structure:
{
  "sections": [...array of section objects...],
  "theme": { "background": "#hex", "textColor": "#hex", "accentColor": "#hex" }
}

Section formats (copy field names exactly):
HERO: {"type":"hero","title":"...","subtitle":"...","content":"","ctaText":"Buy Now","ctaLink":"#","image":"","background":"dark"}
FEATURES: {"type":"features","title":"...","subtitle":"","content":"line1\\nline2\\nline3","background":"light"}
CONTENT: {"type":"content","title":"...","subtitle":"","content":"...","image":"","background":"light"}
CTA: {"type":"cta","title":"...","subtitle":"","content":"","ctaText":"Buy Now","ctaLink":"#","background":"accent"}
TESTIMONIALS: {"type":"testimonials","title":"...","content":"line1\\nline2","background":"dark"}
FAQ: {"type":"faq","title":"...","content":"Q1?\\nQ2?","background":"light"}

NEVER use "button", "action", or "testimonials" as keys. Use "ctaText"/"ctaLink".
Generate 4-6 relevant sections. Output ONLY the JSON object.`;
  const raw = await callGrok(prompt, 2048);
  return parseAIJsonResponse(raw);
}

async function generateMarketingCopy(productTitle, productDescription, targetAudience) {
  if (!hasGrokKey()) {
    throw new Error('Grok API key not configured');
  }

  const prompt = `Output ONLY valid JSON. No markdown or explanation.

Write persuasive marketing copy for a digital product.
Product: "${productTitle}"
Description: "${productDescription || ''}"
Target audience: "${targetAudience || 'General'}"

Required JSON format:
{"headline":"...","subheadline":"...","description":"...","benefits":["...","...","..."],"callToAction":"Buy Now"}`;
  const raw = await callGrok(prompt, 1024);
  return parseAIJsonResponse(raw);
}

async function generatePageFromPrompt(prompt) {
  if (!hasGrokKey()) {
    throw new Error('Grok API key not configured');
  }

  const systemPrompt = `You output ONLY valid JSON. No markdown, no code fences, no explanation text before or after.

Generate a landing page JSON with this exact structure:

{
  "title": "...",
  "description": "...",
  "slug": "...",
  "sections": [...],
  "theme": { "background": "#ffffff", "textColor": "#111111", "accentColor": "#2563EB" }
}

Each section object MUST be one of these EXACT formats. Copy the field names exactly:

HERO: {"type":"hero","title":"...","subtitle":"...","content":"","ctaText":"...","ctaLink":"#","image":"","background":"dark"}
FEATURES: {"type":"features","title":"...","subtitle":"","content":"line1\\nline2\\nline3","background":"light"}
TESTIMONIALS: {"type":"testimonials","title":"...","content":"line1\\nline2","background":"dark"}
FAQ: {"type":"faq","title":"...","content":"Q1?\\nQ2?","background":"light"}
CONTENT: {"type":"content","title":"...","subtitle":"","content":"...","image":"","background":"light"}
CTA: {"type":"cta","title":"...","subtitle":"","content":"","ctaText":"...","ctaLink":"#","background":"accent"}

RULES:
- NEVER use "button", "action", or "testimonials" as object keys. Use "ctaText" and "ctaLink" instead.
- For testimonials, put all quotes in "content" separated by \\n.
- For features, put all feature names in "content" separated by \\n.
- For FAQ, put all questions in "content" separated by \\n.
- Choose 4-6 sections relevant to the topic.
- Output ONLY the JSON object, nothing else.`;

  const fullPrompt = `${systemPrompt}\n\nUser request: ${prompt}\n\nOutput JSON:`;
  const raw = await callGrok(fullPrompt, 3072);
  return parseAIJsonResponse(raw);
}

async function generateMarketingEmail(productTitle, productDescription, emailType) {
  if (!hasGrokKey()) {
    throw new Error('Grok API key not configured');
  }

  const prompt = `Output ONLY valid JSON. No markdown or explanation.

Write a marketing email for a digital product.
Product: "${productTitle}"
Description: "${productDescription || ''}"
Email type: "${emailType || 'launch'}"

Required JSON format:
{"subject":"...","previewText":"...","body":"...","ctaText":"...","ctaLink":"#"}`;
  const raw = await callGrok(prompt, 1024);
  return parseAIJsonResponse(raw);
}

module.exports = {
  generateLandingPage,
  generateMarketingCopy,
  generateMarketingEmail,
  generatePageFromPrompt,
  hasAnthropicKey
};
