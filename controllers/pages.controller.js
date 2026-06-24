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
    const { prompt } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'La description est requise' });
    }

    if (!hasAnthropicKey()) {
      return res.status(503).json({ error: 'Service IA non disponible. Clé API Anthropic manquante.' });
    }

    const result = await generatePageFromPrompt(prompt.trim());
    await recordAiUsage(req.userId, 'suggestion');
    res.json({ page: result });
  } catch (error) {
    console.error('aiGenerate error:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de la génération IA' });
  }
}

module.exports = { listPages, create, getOne, update, remove, aiGenerate };
