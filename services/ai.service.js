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
  const language = (context && context.language) || 'fr';
  const productName = (context && context.product_name) || '';
  const targetAudience = (context && context.target_audience) || '';

  let toneDesc = '';
  if (tone === 'professional') toneDesc = 'Ton professionnel et credible, vocabulaire soutenu mais accessible.';
  else if (tone === 'casual') toneDesc = 'Ton detendu et accessible, comme une conversation entre amis.';
  else if (tone === 'inspirational') toneDesc = 'Ton inspirant et motivant, qui pousse a l action.';
  else if (tone === 'urgent') toneDesc = 'Ton direct et urgent, qui cree un sentiment d urgence.';

  let langInstruction = '';
  if (language === 'fr') langInstruction = 'Genere tout le contenu en francais. Utilise un francais naturel et fluide.';
  else if (language === 'en') langInstruction = 'Generate all content in English. Use natural, fluent English.';
  else if (language === 'es') langInstruction = 'Genera todo el contenido en espanol. Usa espanol natural y fluido.';

  const systemPrompt = `Tu es un expert en copywriting et creation de landing pages haute conversion.

Genere une landing page complete au format JSON. Contenu 100% authentique et persuasif, jamais de Lorem ipsum ou de placeholders.

REGLES STRICTES :
- Contenu 100% authentique et specifique au sujet, jamais de texte generique
- Chaque section doit contenir du texte persuasif, oriente conversion
- Structure AIDA : Attention → Interet → Desir → Action
- Adapte le ton, le vocabulaire et le style a l audience decrite
- Inclus des chiffres et des benefices concrets
- ${toneDesc}
- ${langInstruction}
- ${productName ? 'Nom du produit/marque : ' + productName : ''}
- ${targetAudience ? 'Audience cible : ' + targetAudience : ''}
- Genere des couleurs coherentes avec le type de page (ex: bien-etre = tons doux, tech = bleu/violet)
- Le slug doit etre en francais (ou dans la langue choisie), en kebab-case
- La description est une meta description SEO max 155 caracteres

FORMAT JSON A RETOURNER (structure exacte) :
{
  "title": "Titre accrocheur de la page",
  "description": "Meta description SEO, max 155 caracteres",
  "slug": "slug-en-kebab-case",
  "theme": {
    "background": "#hex",
    "textColor": "#hex",
    "accentColor": "#hex"
  },
  "sections": [ ... ]
}

TYPES DE SECTIONS DISPONIBLES (choisis uniquement parmi ${JSON.stringify(sectionsWanted)}) :

HERO: {"type":"hero","eyebrow":"Petit texte au-dessus du titre","headline":"Titre principal accrocheur, max 10 mots","subheadline":"Sous-titre benefice 1-2 phrases","cta_primary_text":"Texte bouton principal","cta_primary_url":"#","cta_secondary_text":"Texte bouton secondaire (optionnel)","social_proof_text":"+XXXX personnes ont deja...","layout":"centered","background":"dark","image":""}

FEATURES: {"type":"features","headline":"Titre section benefices","subheadline":"Description courte","layout":"grid-3","background":"light","items":[{"icon":"1","title":"Titre du benefice","description":"Description concrete avec chiffres"}]}

CONTENT: {"type":"content","headline":"Titre","body":"Contenu HTML (paragraphes, listes ul/li autorisees)","layout":"centered","background":"light","image_placeholder":"Description de l image ideale"}

CTA: {"type":"cta","headline":"Titre appel a action","subheadline":"Phrase qui leve les dernieres hesitations","cta_primary_text":"Texte du bouton","cta_primary_url":"#","guarantee_text":"Satisfait ou rembourse 7 jours","urgency_text":"Offre valable jusqu a epuisement des stocks","background":"accent"}

TESTIMONIALS: {"type":"testimonials","headline":"Ce que disent nos clients","layout":"grid","background":"dark","items":[{"quote":"Temoignage realiste avec resultat concret","author":"Prenom N.","role":"Profession","stars":5,"result_highlight":"-8kg en 3 semaines"}]}

FAQ: {"type":"faq","headline":"Questions frequentes","background":"light","items":[{"question":"Question reelle","answer":"Reponse claire et rassurante"}]}

PROBLEM: {"type":"problem","headline":"Vous reconnaissez-vous ?","intro":"Phrase d empathie","pain_points":[{"text":"Point de douleur specifique"}],"transition":"Phrase de transition vers la solution","background":"light"}

STATS: {"type":"stats","headline":"Chiffres cles","background":"dark","items":[{"value":"3 200+","label":"Clients satisfaits"}]}

IMPORTANT : Retourne UNIQUEMENT le JSON valide, sans texte avant ou apres, sans balises markdown, sans code fences.`;

  const fullPrompt = `${systemPrompt}\n\nDescription de la page : ${prompt}\n\nGenere la landing page :`;
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
