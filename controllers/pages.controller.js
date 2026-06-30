const {
  createPage, listPagesByOwner, getPageById, getPageBySlug,
  updatePageById, deletePageById
} = require('../services/firebase.service');
const { generatePageFromPrompt, hasAnthropicKey } = require('../services/ai.service');
const { recordAiUsage } = require('../services/quota.service');

async function listPages(req, res) {
  try {
    const pages = await listPagesByOwner(req.userId);
    res.json({ pages });
  } catch (error) {
    console.error('listPages error:', error);
    res.status(500).json({ error: 'Error fetching pages' });
  }
}

async function create(req, res) {
  try {
    const payload = req.body;
    const created = await createPage({
      ownerId: req.userId,
      title: payload.title,
      slug: payload.slug,
      description: payload.description || null,
      status: payload.status || 'draft',
      sections: payload.sections || [],
      theme: payload.theme || { background: '#ffffff', textColor: '#111827', accentColor: '#2563EB' },
      createdBy: req.userId
    });
    res.status(201).json({ page: created });
  } catch (error) {
    console.error('createPage error:', error);
    res.status(500).json({ error: 'Error creating page' });
  }
}

async function getOne(req, res) {
  try {
    const { pageId } = req.params;
    const page = await getPageById(pageId);
    if (!page) return res.status(404).json({ error: 'Page not found' });
    if (page.ownerId !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    res.json({ page });
  } catch (error) {
    console.error('getPage error:', error);
    res.status(500).json({ error: 'Error fetching page' });
  }
}

async function update(req, res) {
  try {
    const { pageId } = req.params;
    const existing = await getPageById(pageId);
    if (!existing) return res.status(404).json({ error: 'Page not found' });
    if (existing.ownerId !== req.userId) return res.status(403).json({ error: 'Forbidden' });

    const payload = req.body;
    const updated = await updatePageById(pageId, {
      title: payload.title,
      slug: payload.slug,
      description: payload.description,
      status: payload.status,
      sections: payload.sections,
      theme: payload.theme
    });
    res.json({ page: updated });
  } catch (error) {
    console.error('updatePage error:', error);
    res.status(500).json({ error: 'Error updating page' });
  }
}

async function remove(req, res) {
  try {
    const { pageId } = req.params;
    const existing = await getPageById(pageId);
    if (!existing) return res.status(404).json({ error: 'Page not found' });
    if (existing.ownerId !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    await deletePageById(pageId);
    res.json({ message: 'Page deleted' });
  } catch (error) {
    console.error('deletePage error:', error);
    res.status(500).json({ error: 'Error deleting page' });
  }
}

async function aiGenerate(req, res) {
  try {
    const { prompt, product_name, target_audience, tone, language, sections_wanted } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Description is required' });
    }

    if (!hasAnthropicKey()) {
      return res.status(503).json({ error: 'AI service unavailable. Missing Anthropic API key.' });
    }

    const context = {
      product_name,
      target_audience,
      tone: tone || 'professional',
      language: language || 'fr',
      sections_wanted: sections_wanted || ['hero', 'features', 'features', 'cta']
    };

    const result = await generatePageFromPrompt(prompt.trim(), context);
    await recordAiUsage(req.userId, 'suggestion');
    res.json({ page: result });
  } catch (error) {
    console.error('aiGenerate error:', error);
    res.status(500).json({ error: error.message || 'Error during AI generation' });
  }
}

async function regenerateSection(req, res) {
  try {
    const { section_type, prompt, page_context } = req.body;
    if (!section_type) {
      return res.status(400).json({ error: 'Section type is required' });
    }
    if (!hasAnthropicKey()) {
      return res.status(503).json({ error: 'AI service unavailable.' });
    }

    const { callGrok, parseAIJsonResponse } = require('../services/grok.service');

    const systemPrompt = `You are a copywriting expert.
Generate only a section of type "${section_type}" pour une landing page.

${
  section_type === 'hero' ? `Retourne ce JSON exact :
{"type":"hero","eyebrow":"...","headline":"...","subheadline":"...","cta_primary_text":"...","cta_primary_url":"#","cta_secondary_text":"","social_proof_text":"...","layout":"centered","background":"dark","image":""}` :
  section_type === 'features' ? `Retourne ce JSON exact :
{"type":"features","headline":"...","subheadline":"","layout":"grid-3","background":"light","items":[{"icon":"1","title":"...","description":"..."}]}` :
  section_type === 'testimonials' ? `Retourne ce JSON exact :
{"type":"testimonials","headline":"What Our Clients Say","layout":"grid","background":"dark","items":[{"quote":"...","author":"...","role":"...","stars":5,"result_highlight":"..."}]}` :
  section_type === 'cta' ? `Retourne ce JSON exact :
{"type":"cta","headline":"...","subheadline":"...","cta_primary_text":"...","cta_primary_url":"#","guarantee_text":"...","urgency_text":"","background":"accent"}` :
  section_type === 'faq' ? `Retourne ce JSON exact :
{"type":"faq","headline":"Frequently Asked Questions","background":"light","items":[{"question":"...","answer":"..."}]}` :
  section_type === 'problem' ? `Retourne ce JSON exact :
{"type":"problem","headline":"Do You Recognize Yourself?","intro":"...","pain_points":[{"text":"..."}],"transition":"...","background":"light"}` :
  section_type === 'stats' ? `Retourne ce JSON exact :
{"type":"stats","headline":"Key Figures","background":"dark","items":[{"value":"...","label":"..."}]}` :
  `Retourne un objet JSON avec type:"${section_type}" et les champs appropries`
}

Authentic and persuasive content. ${prompt ? 'Contexte : ' + prompt : ''}
Return ONLY the JSON, no text before or after.`;

    const raw = await callGrok(systemPrompt, 1500);
    const data = parseAIJsonResponse(raw);
    res.json({ section: data });
  } catch (error) {
    console.error('regenerateSection error:', error);
    res.status(500).json({ error: error.message || 'Error during regeneration' });
  }
}

module.exports = { listPages, create, getOne, update, remove, aiGenerate, regenerateSection };
