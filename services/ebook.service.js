const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { Anthropic } = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-3-haiku-20240307';

const ebookSuggestions = [
  {
    id: 1,
    title: 'Guide du Freelance Démarrant',
    description: 'Tout ce que vous devez savoir pour commencer votre carrière de freelance',
    chapters: [
      'Introduction au Freelancing',
      'Fixer vos tarifs',
      'Trouver vos premiers clients',
      'Gérer votre activité'
    ]
  },
  {
    id: 2,
    title: 'Productivité pour Développeurs',
    description: 'Astuces et outils pour coder plus efficacement',
    chapters: [
      'Gestion du temps',
      'Outils essentiels',
      'Bonnes pratiques de code',
      'Apprentissage continu'
    ]
  },
  {
    id: 3,
    title: 'Marketing Digital Basique',
    description: 'Les fondamentaux du marketing en ligne pour entrepreneurs',
    chapters: [
      'SEO et contenu',
      'Réseaux sociaux',
      'Email marketing',
      'Analyse des résultats'
    ]
  }
];

function getEbookSuggestions() {
  return ebookSuggestions;
}

function hasAnthropicKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function parseAIJsonResponse(text) {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    return JSON.parse(fenceMatch[1].trim());
  }
  const arrayMatch = trimmed.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return JSON.parse(arrayMatch[0]);
  }
  const objectMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return JSON.parse(objectMatch[0]);
  }
  return JSON.parse(trimmed);
}

function ensureTempDir() {
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
}

function createPdfWriter() {
  const ebookId = 'ebook-' + Date.now();
  ensureTempDir();
  const outputPath = path.join(__dirname, '../temp', ebookId + '.pdf');
  const doc = new PDFDocument();
  const writeStream = fs.createWriteStream(outputPath);
  doc.pipe(writeStream);
  return { doc, writeStream, outputPath, ebookId };
}

function waitForPdf(writeStream) {
  return new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
}

async function callAnthropic(prompt, maxTokens = 1024) {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }]
  });
  return message.content[0].text;
}

async function generateAIEbookSuggestions(topic) {
  if (!hasAnthropicKey()) {
    throw new Error('Clé API Anthropic non configurée');
  }

  const content = await callAnthropic(
    `Génère 3 suggestions d'ebooks sur le thème: "${topic}". Pour chaque suggestion, donne un titre, une description et 4 chapitres. Réponds en JSON seulement, pas de texte autour. Format: [{"title": "...", "description": "...", "chapters": ["...", "...", "...", "..."]}, ...]`,
    1024
  );

  const suggestions = parseAIJsonResponse(content);
  if (!Array.isArray(suggestions)) {
    throw new Error('Format de réponse IA invalide');
  }
  return suggestions;
}

async function structureVideoIntoChapters(content, title) {
  const raw = await callAnthropic(
    `Tu es un éditeur d'ebooks professionnel. À partir de cette transcription, crée un ebook structuré avec 3 à 5 chapitres cohérents.\nTitre de l'ebook: "${title}"\n\nRéponds UNIQUEMENT en JSON, sans texte autour:\n{"chapters":[{"title":"Titre du chapitre","content":"Contenu détaillé du chapitre (300-500 mots)"}]}\n\nTranscription:\n${content}`,
    4096
  );

  const parsed = parseAIJsonResponse(raw);
  if (parsed.chapters && Array.isArray(parsed.chapters)) {
    return parsed.chapters;
  }
  if (Array.isArray(parsed)) {
    return parsed;
  }
  throw new Error('Impossible de structurer le contenu vidéo');
}

async function generateChapterContent(chapterTitle, ebookTitle) {
  return callAnthropic(
    `Écris un chapitre d'ebook de 300 mots sur le thème: "${chapterTitle}" pour l'ebook "${ebookTitle}". Rédige de façon professionnelle et informative.`,
    1024
  );
}

async function generateEbookFromVideo(videoData, options = {}) {
  const { allowAI = true } = options;
  let chapters = [];

  if (videoData.content && allowAI && hasAnthropicKey()) {
    chapters = await structureVideoIntoChapters(videoData.content, videoData.title || 'Ebook Généré');
  } else if (videoData.content) {
    chapters = [{ title: 'Introduction', content: videoData.content }];
  } else {
    chapters = [{ title: 'Introduction', content: 'Contenu extrait de la vidéo...' }];
  }

  const { doc, writeStream, outputPath, ebookId } = createPdfWriter();

  doc.fontSize(24).text(videoData.title || 'Ebook Généré', { align: 'center' });
  doc.moveDown();
  doc.fontSize(14).text(videoData.description || 'Créé à partir de votre vidéo', { align: 'center' });
  doc.moveDown(2);

  chapters.forEach((chapter, i) => {
    if (i > 0) doc.addPage();
    doc.fontSize(18).text('Chapitre ' + (i + 1) + ': ' + chapter.title);
    doc.moveDown();
    doc.fontSize(12).text(chapter.content || '');
  });

  doc.end();
  await waitForPdf(writeStream);
  return { filePath: outputPath, ebookId };
}

async function generateCustomEbook(ebookData, options = {}) {
  const { allowAI = true, maxChapters = Infinity } = options;
  const chapters = ebookData.chapters.slice(0, maxChapters);

  const { doc, writeStream, outputPath, ebookId } = createPdfWriter();

  doc.fontSize(24).text(ebookData.title, { align: 'center' });
  doc.moveDown();
  if (ebookData.author) {
    doc.fontSize(14).text('Par ' + ebookData.author, { align: 'center' });
    doc.moveDown();
  }
  doc.moveDown(2);

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    let chapterContent = chapter.content;

    if ((!chapterContent || chapterContent.trim() === '') && allowAI && hasAnthropicKey()) {
      chapterContent = await generateChapterContent(chapter.title, ebookData.title);
    }

    if (i > 0) doc.addPage();
    doc.fontSize(18).text('Chapitre ' + (i + 1) + ': ' + chapter.title);
    doc.moveDown();
    doc.fontSize(12).text(chapterContent || 'Contenu du chapitre...');
  }

  doc.end();
  await waitForPdf(writeStream);
  return { filePath: outputPath, ebookId };
}

function getEbookFilePath(ebookId) {
  const safeId = path.basename(ebookId);
  return path.join(__dirname, '../temp', safeId + '.pdf');
}

module.exports = {
  getEbookSuggestions,
  generateAIEbookSuggestions,
  generateEbookFromVideo,
  generateCustomEbook,
  getEbookFilePath,
  hasAnthropicKey,
  BASIC_EBOOK_LIMIT: 3,
  BASIC_MAX_CHAPTERS: 4
};
