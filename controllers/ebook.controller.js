const {
  getEbookSuggestions,
  generateAIEbookSuggestions,
  generateEbookFromVideo,
  generateCustomEbook,
  getEbookFilePath,
  renderEbookPdf,
  mergeDesign,
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
const PDFDocument = require('pdfkit');
const fs = require('fs');

async function saveEbookRecord(req, { ebookId, title, type, chapters, chaptersData, source, author }) {
  await createEbookRecord({
    userId: req.userId,
    ebookId,
    title,
    type: type || 'custom',
    chapters: chapters || (chaptersData ? chaptersData.length : 0),
    chaptersData: chaptersData || [],
    source: source || 'manual',
    author: author || 'Contrak AI'
  });
}

async function checkBasicEbookLimit(req, res) {
  if (req.userPlan !== 'basic') return true;
  const count = await countUserEbooks(req.userId);
  if (count >= BASIC_EBOOK_LIMIT) {
    res.status(403).json({
      error: `Limit reached for the BASIC plan (${BASIC_EBOOK_LIMIT} ebooks max). Upgrade to PRO for unlimited creation.`,
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
    res.status(500).json({ error: 'Error loading suggestions' });
  }
}

async function getAISuggestions(req, res) {
  try {
    const { topic } = req.body;
    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    if (!hasAnthropicKey()) {
      return res.status(503).json({ error: 'AI service unavailable. Missing API key.' });
    }

    const suggestions = await generateAIEbookSuggestions(topic.trim());
    await recordAiUsage(req.userId, 'suggestion');
    res.json({ suggestions });
  } catch (error) {
    console.error('Error getting AI ebook suggestions:', error);
    res.status(500).json({ error: 'Error generating AI suggestions' });
  }
}

async function createFromVideo(req, res) {
  try {
    let { title, description, content, videoUrl } = req.body;

    if (!title && !videoUrl && !content) {
      return res.status(400).json({ error: 'Provide a title, URL, or transcription' });
    }

    if (!content && videoUrl) {
      if (!isSupportedVideoUrl(videoUrl)) {
        return res.status(400).json({ error: 'Unsupported URL. Use YouTube, TikTok, or Instagram.' });
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
      return res.status(400).json({ error: 'Title is required' });
    }

    const { filePath, ebookId, chapters } = await generateEbookFromVideo(
      { title, description, content, videoUrl },
      { allowAI: true }
    );

    await saveEbookRecord(req, { ebookId, title, type: 'video', chaptersData: chapters, source: 'video' });
    res.json({ success: true, ebookId, title, message: 'Ebook created successfully' });
  } catch (error) {
    console.error('Error creating ebook from video:', error);
    res.status(500).json({ error: error.message || 'Error creating ebook' });
  }
}

async function transcribeUrl(req, res) {
  try {
    const { url } = req.body;
    if (!url || !url.trim()) {
      return res.status(400).json({ error: 'L\'URL de la vidéo est requise' });
    }

    if (!isSupportedVideoUrl(url.trim())) {
      return res.status(400).json({ error: 'Unsupported URL. Use YouTube, TikTok, or Instagram.' });
    }

    const result = await transcribeFromUrl(url.trim());
    await recordAiUsage(req.userId, 'transcription');
    res.json(result);
  } catch (error) {
    console.error('Error transcribing URL:', error);
    res.status(500).json({ error: error.message || 'Error during transcription' });
  }
}

async function transcribeUpload(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file received' });
    }

    // Write buffer to temp file for transcription processing
    const fs = require('fs');
    const path = require('path');
    const tempDir = process.env.VERCEL ? '/tmp' : path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const tempPath = path.join(tempDir, req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'));
    fs.writeFileSync(tempPath, req.file.buffer);

    const result = await transcribeFromFile(tempPath, req.file.originalname);
    await recordAiUsage(req.userId, 'transcription');
    res.json(result);
  } catch (error) {
    console.error('Error transcribing upload:', error);
    res.status(500).json({ error: error.message || 'Error during transcription du fichier' });
  }
}

async function createCustom(req, res) {
  try {
    const ebookData = req.body;

    if (!ebookData.title || !ebookData.chapters || !ebookData.chapters.length) {
      return res.status(400).json({ error: 'Title and at least one chapter are required' });
    }

    if (!(await checkBasicEbookLimit(req, res))) return;

    const isPro = req.userPlan === 'pro';
    const maxChapters = Infinity; // Removed chapter limit restriction

    const { filePath, ebookId, chapters } = await generateCustomEbook(ebookData, {
      allowAI: true,
      maxChapters
    });

    await saveEbookRecord(req, {
      ebookId,
      title: ebookData.title,
      type: 'custom',
      chaptersData: chapters,
      source: ebookData.chapters ? 'manual' : 'ai',
      author: ebookData.author
    });
    res.json({ success: true, ebookId, title: ebookData.title, message: 'Ebook created successfully' });
  } catch (error) {
    console.error('Error creating custom ebook:', error);
    res.status(500).json({ error: 'Error creating ebook' });
  }
}

async function exportEbook(req, res) {
  try {
    const { ebookId } = req.params;
    const ebook = await getEbookByFileId(ebookId, req.userId);

    if (!ebook) {
      return res.status(404).json({ error: 'Ebook not found' });
    }

    const chapters = (ebook.chaptersData || []).map(function(ch) {
      if (typeof ch === 'string') return { title: ch, content: '' };
      return { title: ch.title || '', content: ch.content || '' };
    });

    if (chapters.length === 0) {
      return res.status(404).json({ error: 'No content in this ebook' });
    }

    const filename = encodeURIComponent((ebook.title || 'ebook').replace(/[^a-zA-Z0-9]/g, '_')) + '.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 60, bottom: 60, left: 70, right: 70 },
      info: {
        Producer: 'Contrak.io',
        Creator: 'Contrak.io',
        Title: ebook.title || 'Ebook'
      }
    });

    doc.pipe(res);
    await renderEbookPdf(doc, ebook.title || 'Ebook', ebook.description || null, ebook.author || 'Contrak AI', chapters, ebook.design || ebook.designSettings);
  } catch (error) {
    console.error('Error exporting ebook:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error exporting ebook' });
    }
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
    res.status(500).json({ error: 'Server error' });
  }
}

async function getEbookData(req, res) {
  try {
    const { ebookId } = req.params;
    const ebook = await getEbookByFileId(ebookId, req.userId);
    if (!ebook) return res.status(404).json({ error: 'Ebook not found' });

    const description = ebook.source === 'video' ? 'Created from your video' : 'Custom ebook';
    res.json({
      ebook: {
        ebookId: ebook.ebookId,
        title: ebook.title || 'Ebook',
        author: ebook.author || 'Contrak AI',
        description: ebook.description || description,
        source: ebook.source || 'manual',
        chapters: (ebook.chaptersData || []).map(function(ch) {
          if (typeof ch === 'string') return { title: ch, content: '' };
          return { title: ch.title || '', content: ch.content || '' };
        })
      }
    });
  } catch (error) {
    console.error('Error getting ebook data:', error);
    res.status(500).json({ error: 'Error loading ebook' });
  }
}

async function listEbooks(req, res) {
  try {
    const ebooks = await listUserEbooks(req.userId);
    res.json({ ebooks });
  } catch (error) {
    console.error('Error listing ebooks:', error);
    res.status(500).json({ error: 'Error loading ebooks' });
  }
}

module.exports = {
  getSuggestions,
  getAISuggestions,
  listEbooks,
  getEbookData,
  createFromVideo,
  createCustom,
  exportEbook,
  getEbookStats,
  transcribeUrl,
  transcribeUpload
};
