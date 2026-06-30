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

async function generatePageFromPrompt(prompt, context) {
  if (!hasGrokKey()) {
    throw new Error('Grok API key not configured');
  }

  const sectionsWanted = (context && context.sections_wanted) || ['hero','features','testimonials','cta','faq'];
  const tone = (context && context.tone) || 'professional';
  const language = (context && context.language) || 'en';
  const productName = (context && context.product_name) || '';
  const targetAudience = (context && context.target_audience) || '';

  let toneDesc = '';
  if (tone === 'professional') toneDesc = 'Professional and credible tone, sophisticated yet accessible vocabulary.';
  else if (tone === 'casual') toneDesc = 'Relaxed and approachable tone, like a conversation between friends.';
  else if (tone === 'inspirational') toneDesc = 'Inspiring and motivating tone that drives action.';
  else if (tone === 'urgent') toneDesc = 'Direct and urgent tone that creates a sense of urgency.';

  let langInstruction = '';
  if (language === 'en') langInstruction = 'Generate all content in English. Use natural, fluent English.';
  else if (language === 'fr') langInstruction = 'Generer tout le contenu en francais. Utilisez un francais naturel et fluide.';
  else if (language === 'es') langInstruction = 'Genera todo el contenido en espanol. Usa espanol natural y fluido.';

  const systemPrompt = `You are an expert in copywriting and high-conversion landing page creation.

Generate a complete landing page in JSON format. 100% authentic and persuasive content, never Lorem ipsum or placeholders.

STRICT RULES:
- 100% authentic content specific to the topic, never generic text
- Each section must contain persuasive, conversion-oriented text
- AIDA structure: Attention → Interest → Desire → Action
- Adapt the tone, vocabulary, and style to the described audience
- Include figures and concrete benefits
- ${toneDesc}
- ${langInstruction}
- ${productName ? 'Nom du produit/marque : ' + productName : ''}
- ${targetAudience ? 'Audience cible : ' + targetAudience : ''}
- Genere des couleurs coherentes avec le type de page (ex: wellness = tons doux, tech = bleu/violet)
- The slug must be in English (or the chosen language), in kebab-case
- The description is a meta description for SEO, max 155 characters

FORMAT JSON A RETOURNER (structure exacte) :
{
  "title": "Catchy page title",
  "description": "SEO meta description, max 155 characters",
  "slug": "slug-in-kebab-case",
  "theme": {
    "background": "#hex",
    "textColor": "#hex",
    "accentColor": "#hex"
  },
  "sections": [ ... ]
}

TYPES DE SECTIONS DISPONIBLES (choisis uniquement parmi ${JSON.stringify(sectionsWanted)}) :

HERO: {"type":"hero","eyebrow":"Small text above the title","headline":"Catchy main headline, max 10 words","subheadline":"Benefit subheading 1-2 sentences","cta_primary_text":"Main button text","cta_primary_url":"#","cta_secondary_text":"Secondary button text (optional)","social_proof_text":"+XXXX people already...","layout":"centered","background":"dark","image":""}

FEATURES: {"type":"features","headline":"Benefits section title","subheadline":"Short description","layout":"grid-3","background":"light","items":[{"icon":"1","title":"Benefit title","description":"Concrete description with figures"}]}

CONTENT: {"type":"content","headline":"Title","body":"HTML content (paragraphs, ul/li lists allowed)","layout":"centered","background":"light","image_placeholder":"Description of the ideal image"}

CTA: {"type":"cta","headline":"Call-to-action title","subheadline":"Phrase that removes final hesitations","cta_primary_text":"Button text","cta_primary_url":"#","guarantee_text":"Satisfied or refunded within 7 days","urgency_text":"Offer valid while stocks last","background":"accent"}

TESTIMONIALS: {"type":"testimonials","headline":"What Our Clients Say","layout":"grid","background":"dark","items":[{"quote":"Realistic testimonial with concrete result","author":"First Name L.","role":"Profession","stars":5,"result_highlight":"-8kg in 3 weeks"}]}

FAQ: {"type":"faq","headline":"Frequently Asked Questions","background":"light","items":[{"question":"Real question","answer":"Clear and reassuring answer"}]}

PROBLEM: {"type":"problem","headline":"Do You Recognize Yourself?","intro":"Empathy statement","pain_points":[{"text":"Specific pain point"}],"transition":"Transition phrase toward the solution","background":"light"}

STATS: {"type":"stats","headline":"Key Figures","background":"dark","items":[{"value":"3,200+","label":"Satisfied Clients"}]}

IMPORTANT : Retourne UNIQUEMENT le JSON valide, sans texte avant ou apres, sans balises markdown, sans code fences.`;

  const fullPrompt = `${systemPrompt}\n\nPage description: ${prompt}\n\nGenerate the landing page:`;
  const raw = await callGrok(fullPrompt, 4096);
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
