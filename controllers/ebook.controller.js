const {
  getEbookSuggestions,
  generateAIEbookSuggestions,
  generateEbookFromVideo,
  generateCustomEbook,
  getEbookFilePath,
  hasAnthropicKey,
  BASIC_EBOOK_LIMIT,
  BASIC_MAX_CHAPTERS
} = require('../services/ebook.service');
const { createEbookRecord, countUserEbooks, getEbookByFileId } = require('../services/firebase.service');
const fs = require('fs');

async function checkBasicEbookLimit(req, res) {
  if (req.userPlan !== 'basic') return true;

  const count = await countUserEbooks(req.userId);
  if (count >= BASIC_EBOOK_LIMIT) {
    res.status(403).json({
      error: `Limite atteinte pour le plan BASIC (${BASIC_EBOOK_LIMIT} ebooks max). Passez au plan PRO pour une création illimitée.`,
      upgradeRequired: true
    });
    return false;
  }
  return true;
}

async function saveEbookRecord(req, { ebookId, title, type }) {
  await createEbookRecord({
    userId: req.userId,
    ebookId,
    title,
    type
  });
}

async function getSuggestions(req, res) {
  try {
    const suggestions = getEbookSuggestions();
    res.json({ suggestions });
  } catch (error) {
    console.error('Error getting ebook suggestions:', error);
    res.status(500).json({ error: 'Erreur lors du chargement des suggestions' });
  }
}

async function getAISuggestions(req, res) {
  try {
    const { topic } = req.body;
    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'Le sujet est requis' });
    }

    if (!hasAnthropicKey()) {
      return res.status(503).json({ error: 'Service IA non disponible. Clé API Anthropic manquante.' });
    }

    const suggestions = await generateAIEbookSuggestions(topic.trim());
    res.json({ suggestions });
  } catch (error) {
    console.error('Error getting AI ebook suggestions:', error);
    res.status(500).json({ error: 'Erreur lors de la génération des suggestions IA' });
  }
}

async function createFromVideo(req, res) {
  try {
    const { title, description, content, videoUrl } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Le titre et la transcription sont requis' });
    }

    const { filePath, ebookId } = await generateEbookFromVideo(
      { title, description, content, videoUrl },
      { allowAI: true }
    );

    await saveEbookRecord(req, { ebookId, title, type: 'video' });
    res.download(filePath, (title || 'ebook') + '.pdf');
  } catch (error) {
    console.error('Error creating ebook from video:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'ebook' });
  }
}

async function createCustom(req, res) {
  try {
    const ebookData = req.body;

    if (!ebookData.title || !ebookData.chapters || !ebookData.chapters.length) {
      return res.status(400).json({ error: 'Le titre et au moins un chapitre sont requis' });
    }

    if (!(await checkBasicEbookLimit(req, res))) return;

    const isPro = req.userPlan === 'pro';
    const maxChapters = isPro ? Infinity : BASIC_MAX_CHAPTERS;

    if (!isPro && ebookData.chapters.length > BASIC_MAX_CHAPTERS) {
      return res.status(403).json({
        error: `Le plan BASIC permet ${BASIC_MAX_CHAPTERS} chapitres maximum. Passez au plan PRO pour plus de chapitres.`,
        upgradeRequired: true
      });
    }

    const hasEmptyChapters = ebookData.chapters.some(c => !c.content || !c.content.trim());
    if (hasEmptyChapters && !isPro) {
      return res.status(403).json({
        error: 'La génération de contenu par IA est réservée au plan PRO. Remplissez les chapitres manuellement ou passez au PRO.',
        upgradeRequired: true
      });
    }

    const { filePath, ebookId } = await generateCustomEbook(ebookData, {
      allowAI: isPro,
      maxChapters
    });

    await saveEbookRecord(req, { ebookId, title: ebookData.title, type: 'custom' });
    res.download(filePath, (ebookData.title || 'ebook') + '.pdf');
  } catch (error) {
    console.error('Error creating custom ebook:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'ebook' });
  }
}

async function exportEbook(req, res) {
  try {
    const { ebookId } = req.params;
    const ebook = await getEbookByFileId(ebookId, req.userId);

    if (!ebook) {
      return res.status(404).json({ error: 'Ebook introuvable' });
    }

    const ebookPath = getEbookFilePath(ebookId);
    if (!fs.existsSync(ebookPath)) {
      return res.status(404).json({ error: 'Fichier PDF introuvable' });
    }

    res.download(ebookPath, (ebook.title || 'ebook') + '.pdf');
  } catch (error) {
    console.error('Error exporting ebook:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export de l\'ebook' });
  }
}

async function getEbookStats(req, res) {
  try {
    const count = await countUserEbooks(req.userId);
    const isPro = req.userPlan === 'pro';
    res.json({
      count,
      limit: isPro ? null : BASIC_EBOOK_LIMIT,
      plan: req.userPlan,
      aiEnabled: isPro && hasAnthropicKey()
    });
  } catch (error) {
    console.error('Error getting ebook stats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = {
  getSuggestions,
  getAISuggestions,
  createFromVideo,
  createCustom,
  exportEbook,
  getEbookStats
};
