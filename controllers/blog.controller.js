const { createArticle, listArticlesByOwner, listPublishedArticles, getArticleBySlug, getArticleById, updateArticleById, deleteArticleById } = require('../services/firebase.service');

async function list(req, res) {
  try {
    const articles = await listArticlesByOwner(req.userId);
    res.json({ articles });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

async function create(req, res) {
  try {
    const { title, slug, content, excerpt, coverImageUrl, status, tags } = req.body;
    if (!title || !slug || !content) return res.status(400).json({ error: 'title, slug, content required' });
    const article = await createArticle({ ownerId: req.userId, title, slug, content, excerpt: excerpt || null, coverImageUrl: coverImageUrl || null, status: status || 'draft', tags: tags || [] });
    res.json({ article });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

async function getOne(req, res) {
  try {
    const article = await getArticleById(req.params.articleId);
    if (!article || article.ownerId !== req.userId) return res.status(404).json({ error: 'Not found' });
    res.json({ article });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

async function update(req, res) {
  try {
    const existing = await getArticleById(req.params.articleId);
    if (!existing || existing.ownerId !== req.userId) return res.status(404).json({ error: 'Not found' });
    const { title, slug, content, excerpt, coverImageUrl, status, tags } = req.body;
    const article = await updateArticleById(req.params.articleId, { title, slug, content, excerpt, coverImageUrl, status, tags });
    res.json({ article });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

async function remove(req, res) {
  try {
    const existing = await getArticleById(req.params.articleId);
    if (!existing || existing.ownerId !== req.userId) return res.status(404).json({ error: 'Not found' });
    await deleteArticleById(req.params.articleId);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

// Public endpoints
async function publicList(req, res) {
  try {
    const articles = await listPublishedArticles();
    res.json({ articles });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

async function publicGet(req, res) {
  try {
    const article = await getArticleBySlug(req.params.slug);
    if (!article || article.status !== 'published') return res.status(404).json({ error: 'Article not found' });
    res.json({ article });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

module.exports = { list, create, getOne, update, remove, publicList, publicGet };
