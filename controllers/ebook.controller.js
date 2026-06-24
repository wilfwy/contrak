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
const {
  transcribeFromUrl,
  transcribeFromFile,
  isSupportedVideoUrl,
  hasOpenAIKey
} = require('../services/transcription.service');
const { createEbookRecord, countUserEbooks, listUserEbooks, getEbookByFileId } = require('../services/firebase.service');
const { recordAiUsage, getAiSuggestionsToday, getTranscriptionsThisMonth } = require('../services/quota.service');
const fs = require('fs');

async function saveEbookRecord(req, { ebookId, title, type, chapters, source, author }) {
  await createEbookRecord({
    userId: req.userId,
    ebookId,
    title,
    type: type || 'custom',
    chapters: chapters || 0,
    source: source || 'manual',
    author: author || 'Contrak AI'
  });
}

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
    await recordAiUsage(req.userId, 'suggestion');
    res.json({ suggestions });
  } catch (error) {
    console.error('Error getting AI ebook suggestions:', error);
    res.status(500).json({ error: 'Erreur lors de la génération des suggestions IA' });
  }
}

async function createFromVideo(req, res) {
  try {
    let { title, description, content, videoUrl } = req.body;

    if (!title && !videoUrl && !content) {
      return res.status(400).json({ error: 'Fournissez un titre, une URL ou une transcription' });
    }

    if (!content && videoUrl) {
      if (!isSupportedVideoUrl(videoUrl)) {
        return res.status(400).json({ error: 'URL non supportée. Utilisez YouTube, TikTok ou Instagram.' });
      }
      const result = await transcribeFromUrl(videoUrl);
      content = result.transcription;
      if (!title) title = result.title;
      if (!description) description = result.description;
    }

    if (!content) {
      return res.status(400).json({ error: 'La transcription est requise. Extrayez-la depuis l\'URL ou uploadez une vidéo.' });
    }

    if (!title) {
      return res.status(400).json({ error: 'Le titre est requis' });
    }

    const { filePath, ebookId } = await generateEbookFromVideo(
      { title, description, content, videoUrl },
      { allowAI: true }
    );

    await saveEbookRecord(req, { ebookId, title, type: 'video', source: 'video' });
    res.json({ success: true, ebookId, title, message: 'Ebook créé avec succès' });
  } catch (error) {
    console.error('Error creating ebook from video:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de la création de l\'ebook' });
  }
}

async function transcribeUrl(req, res) {
  try {
    const { url } = req.body;
    if (!url || !url.trim()) {
      return res.status(400).json({ error: 'L\'URL de la vidéo est requise' });
    }

    if (!isSupportedVideoUrl(url.trim())) {
      return res.status(400).json({ error: 'URL non supportée. Utilisez YouTube, TikTok ou Instagram.' });
    }

    const result = await transcribeFromUrl(url.trim());
    await recordAiUsage(req.userId, 'transcription');
    res.json(result);
  } catch (error) {
    console.error('Error transcribing URL:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de la transcription' });
  }
}

async function transcribeUpload(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier vidéo reçu' });
    }

    const result = await transcribeFromFile(req.file.path, req.file.originalname);
    await recordAiUsage(req.userId, 'transcription');
    res.json(result);
  } catch (error) {
    console.error('Error transcribing upload:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de la transcription du fichier' });
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
    const maxChapters = Infinity; // Removed chapter limit restriction

    const { filePath, ebookId } = await generateCustomEbook(ebookData, {
      allowAI: true,
      maxChapters
    });

    await saveEbookRecord(req, {
      ebookId,
      title: ebookData.title,
      type: 'custom',
      chapters: ebookData.chapters ? ebookData.chapters.length : 0,
      source: ebookData.chapters ? 'manual' : 'ai',
      author: ebookData.author
    });
    res.json({ success: true, ebookId, title: ebookData.title, message: 'Ebook créé avec succès' });
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
    const isPro = req.userPlan === 'pro';
    const limits = isPro
      ? { ebooks: null, aiSuggestionsPerDay: null, transcriptionsPerMonth: null }
      : { ebooks: BASIC_EBOOK_LIMIT, aiSuggestionsPerDay: 5, transcriptionsPerMonth: 5 };
    const usage = {
      ebooks: await countUserEbooks(req.userId),
      aiSuggestionsPerDay: await getAiSuggestionsToday(req.userId),
      transcriptionsPerMonth: await getTranscriptionsThisMonth(req.userId),
    };
    res.json({
      count: usage.ebooks,
      limit: isPro ? null : BASIC_EBOOK_LIMIT,
      plan: req.userPlan,
      aiEnabled: hasAnthropicKey(),
      transcriptionEnabled: hasOpenAIKey() || hasAnthropicKey(),
      limits,
      usage
    });
  } catch (error) {
    console.error('Error getting ebook stats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function listEbooks(req, res) {
  try {
    const ebooks = await listUserEbooks(req.userId);
    res.json({ ebooks });
  } catch (error) {
    console.error('Error listing ebooks:', error);
    res.status(500).json({ error: 'Erreur lors du chargement des ebooks' });
  }
}

module.exports = {
  getSuggestions,
  getAISuggestions,
  listEbooks,
  createFromVideo,
  createCustom,
  exportEbook,
  getEbookStats,
  transcribeUrl,
  transcribeUpload
};
