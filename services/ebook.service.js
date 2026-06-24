const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { callGrok, hasGrokKey, parseAIJsonResponse } = require('./grok.service');

const DEFAULT_DESIGN = {
  coverBg: '#052E2B',
  coverAccent: '#34D399',
  coverText: '#ffffff',
  tocTitle: '#052E2B',
  tocAccent: '#34D399',
  chapterLabel: '#34D399',
  chapterTitle: '#052E2B',
  chapterAccent: '#34D399',
  bodyText: '#1F2937',
  mutedText: '#6B7280',
  footerLine: '#0F766E',
  tocSeparator: '#E5E7EB'
};

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
  return hasGrokKey();
}

function ensureTempDir() {
  const tempDir = process.env.VERCEL ? '/tmp' : path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
}

function createPdfWriter() {
  const ebookId = 'ebook-' + Date.now();
  ensureTempDir();
  const outputPath = path.join(__dirname, '../temp', ebookId + '.pdf');
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 60, bottom: 60, left: 70, right: 70 },
    info: { Producer: 'Contrak.io', Creator: 'Contrak.io' }
  });
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

function renderCoverPage(doc, title, description, author, d) {
  const pw = doc.page.width, ph = doc.page.height, cx = pw / 2;

  doc.rect(0, 0, pw, ph).fill(d.coverBg);

  doc.fillColor(d.coverAccent).opacity(0.05);
  doc.rect(40, 40, pw - 80, ph - 80).fill();
  doc.opacity(1);

  doc.fillColor(d.coverAccent);
  doc.rect(cx - 70, 110, 140, 3).fill();
  doc.rect(cx - 50, 117, 100, 1).fill();

  doc.fillColor(d.coverText);
  doc.fontSize(32).font('Helvetica-Bold');
  doc.text(title, cx, 155, { align: 'center', width: pw - 160 });

  if (description) {
    doc.fontSize(13).font('Helvetica');
    doc.fillColor(d.coverAccent).opacity(0.8);
    doc.text(description, cx, doc.y + 18, { align: 'center', width: pw - 180 });
    doc.opacity(1);
  }

  if (author) {
    doc.fillColor(d.coverAccent);
    doc.fontSize(11).font('Helvetica');
    doc.text('Par ' + author, cx, ph - 200, { align: 'center' });
  }

  doc.fillColor(d.coverAccent).opacity(0.15);
  doc.rect(0, ph - 145, pw, 1).fill();
  doc.opacity(1);

  doc.fillColor(d.coverAccent).opacity(0.6);
  doc.fontSize(9).font('Helvetica');
  doc.text('CONTRAK.IO', cx, ph - 128, { align: 'center' });
  doc.opacity(1);
  doc.fontSize(8).fillColor(d.mutedText);
  doc.text(new Date().getFullYear().toString(), cx, ph - 112, { align: 'center' });
}

function renderTocPage(doc, chapters, d) {
  const pw = doc.page.width, cx = pw / 2;

  doc.fontSize(20).font('Helvetica-Bold').fillColor(d.tocTitle);
  doc.text('Table des matières', cx, 70, { align: 'center' });

  doc.fillColor(d.tocAccent);
  doc.rect(cx - 50, doc.y + 6, 100, 2).fill();
  doc.moveDown(2);

  const sy = doc.y + 15;
  chapters.forEach((ch, i) => {
    const y = sy + i * 32;
    const num = (i + 1).toString().padStart(2, '0');

    doc.fillColor(d.tocTitle);
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text(num + '.', 85, y, { width: 30 });

    doc.font('Helvetica');
    doc.text(ch.title, 115, y, { width: pw - 210 });

    doc.fillColor(d.tocAccent);
    doc.fontSize(11).font('Helvetica-Bold');
    const pn = 3 + i;
    doc.text(pn.toString(), pw - 85, y, { align: 'right' });

    doc.fillColor(d.tocSeparator);
    doc.rect(85, y + 24, pw - 170, 1).fill();
  });
}

function renderChapterPage(doc, chapter, index, totalChapters, d) {
  const pw = doc.page.width, m = doc.options.margins.left;

  doc.fillColor(d.chapterAccent).opacity(0.08);
  doc.rect(0, 0, pw, 55).fill();
  doc.opacity(1);

  doc.fillColor(d.chapterLabel);
  doc.fontSize(10).font('Helvetica');
  doc.text('CHAPITRE ' + (index + 1), m, 18);

  doc.fillColor(d.chapterTitle);
  doc.fontSize(20).font('Helvetica-Bold');
  doc.text(chapter.title, m, 32);

  doc.fillColor(d.chapterAccent);
  doc.rect(m, doc.y + 4, 60, 3).fill();

  doc.fillColor(d.chapterAccent).opacity(0.08);
  doc.rect(0, doc.y + 12, pw, 1).fill();
  doc.opacity(1);

  const content = chapter.content || 'Contenu du chapitre...';
  doc.fillColor(d.bodyText);
  doc.fontSize(11).font('Helvetica');
  doc.text(content, m, doc.y + 20, {
    align: 'justify',
    lineGap: 6,
    paragraphGap: 10
  });
}

function addFooter(doc, pageNum, d) {
  const pw = doc.page.width;
  doc.fillColor(d.chapterAccent).opacity(0.1);
  doc.rect(70, doc.page.height - 48, pw - 140, 1).fill();
  doc.opacity(1);
  doc.fillColor(d.mutedText);
  doc.fontSize(8).font('Helvetica');
  doc.text(pageNum.toString(), pw / 2, doc.page.height - 40, { align: 'center' });
}

function mergeDesign(custom) {
  if (!custom) return { ...DEFAULT_DESIGN };
  return {
    coverBg: custom.coverBg || DEFAULT_DESIGN.coverBg,
    coverAccent: custom.coverAccent || DEFAULT_DESIGN.coverAccent,
    coverText: custom.coverText || DEFAULT_DESIGN.coverText,
    tocTitle: custom.tocTitle || DEFAULT_DESIGN.tocTitle,
    tocAccent: custom.tocAccent || DEFAULT_DESIGN.tocAccent,
    chapterLabel: custom.chapterLabel || DEFAULT_DESIGN.chapterLabel,
    chapterTitle: custom.chapterTitle || DEFAULT_DESIGN.chapterTitle,
    chapterAccent: custom.chapterAccent || DEFAULT_DESIGN.chapterAccent,
    bodyText: custom.bodyText || DEFAULT_DESIGN.bodyText,
    mutedText: custom.mutedText || DEFAULT_DESIGN.mutedText,
    footerLine: custom.footerLine || DEFAULT_DESIGN.footerLine,
    tocSeparator: custom.tocSeparator || DEFAULT_DESIGN.tocSeparator
  };
}

async function renderEbookPdf(doc, title, description, author, chapters, design) {
  const d = mergeDesign(design);
  renderCoverPage(doc, title, description, author, d);
  addFooter(doc, 1, d);

  doc.addPage();
  renderTocPage(doc, chapters, d);
  addFooter(doc, 2, d);

  chapters.forEach((chapter, i) => {
    doc.addPage();
    renderChapterPage(doc, chapter, i, chapters.length, d);
    addFooter(doc, 3 + i, d);
  });

  doc.end();
}

async function generateAIEbookSuggestions(topic) {
  if (!hasGrokKey()) {
    throw new Error('Clé API IA non configurée');
  }

  const content = await callGrok(
    `Output ONLY valid JSON array. No markdown or explanation.

Génère 3 suggestions d'ebooks sur le thème: "${topic}".
Format EXACT: [{"title":"...","description":"...","chapters":["...","...","...","..."]},...]`,
    1024
  );

  const suggestions = parseAIJsonResponse(content);
  if (!Array.isArray(suggestions)) {
    throw new Error('Format de réponse IA invalide');
  }
  return suggestions;
}

async function structureVideoIntoChapters(content, title) {
  const raw = await callGrok(
    `Output ONLY valid JSON. No markdown or explanation.

Tu es un éditeur d'ebooks professionnel. À partir de cette transcription, crée un ebook structuré avec 3 à 5 chapitres cohérents.
Titre de l'ebook: "${title}"

Format EXACT: {"chapters":[{"title":"...","content":"... (300-500 mots)"}]}

Transcription:
${content}`,
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
  return callGrok(
    `Écris un chapitre d'ebook d'environ 300 mots sur le thème: "${chapterTitle}" pour l'ebook "${ebookTitle}". Rédige de façon professionnelle et informative. Ne mets pas de titre en en-tête, seulement le contenu.`,
    1024
  );
}

async function generateEbookFromVideo(videoData, options = {}) {
  const { allowAI = true } = options;
  let chapters = [];

  if (videoData.content && allowAI && hasGrokKey()) {
    chapters = await structureVideoIntoChapters(videoData.content, videoData.title || 'Ebook Généré');
  } else if (videoData.content) {
    chapters = [{ title: 'Introduction', content: videoData.content }];
  } else {
    chapters = [{ title: 'Introduction', content: 'Contenu extrait de la vidéo...' }];
  }

  const { doc, writeStream, outputPath, ebookId } = createPdfWriter();
  await renderEbookPdf(
    doc,
    videoData.title || 'Ebook Généré',
    videoData.description || 'Créé à partir de votre vidéo',
    'Contrak AI',
    chapters,
    videoData.design
  );
  await waitForPdf(writeStream);
  return { filePath: outputPath, ebookId };
}

async function generateEbookChapters(title, description) {
  const raw = await callGrok(
    `Output ONLY valid JSON. No markdown or explanation.

Tu es un auteur d'ebooks professionnel. Crée 4 chapitres pour un ebook intitulé "${title}"${description ? ' sur le thème: "' + description + '"' : ''}.

Format EXACT: {"chapters":[{"title":"...","content":"300-500 mots de contenu détaillé et professionnel"}]}

Chaque chapitre doit avoir un titre accrocheur et un contenu substantiel, informatif et bien structuré.`,
    4096
  );

  const parsed = parseAIJsonResponse(raw);
  if (parsed.chapters && Array.isArray(parsed.chapters)) {
    return parsed.chapters;
  }
  if (Array.isArray(parsed)) {
    return parsed;
  }
  throw new Error('Impossible de générer les chapitres');
}

async function generateCustomEbook(ebookData, options = {}) {
  const { allowAI = true, maxChapters = Infinity } = options;
  let chapters = ebookData.chapters || [];

  if (chapters.length === 0 && allowAI && hasGrokKey()) {
    chapters = await generateEbookChapters(ebookData.title, ebookData.description);
  }

  chapters = chapters.slice(0, maxChapters);

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    if ((!chapter.content || chapter.content.trim() === '') && allowAI && hasGrokKey()) {
      chapter.content = await generateChapterContent(chapter.title, ebookData.title);
    }
  }

  const { doc, writeStream, outputPath, ebookId } = createPdfWriter();
  await renderEbookPdf(
    doc,
    ebookData.title,
    ebookData.description || null,
    ebookData.author || 'Contrak AI',
    chapters,
    ebookData.design
  );
  await waitForPdf(writeStream);
  return { filePath: outputPath, ebookId };
}

function getEbookFilePath(ebookId) {
  const safeId = path.basename(ebookId);
  return path.join(__dirname, '../temp', safeId + '.pdf');
}

async function generateProductVersionPdf(version, product) {
  const payload = version.ebookPayload || {};
  const chapters = payload.chapters || [];

  const { doc, writeStream, outputPath, ebookId } = createPdfWriter();
  await renderEbookPdf(
    doc,
    product.title || 'Product',
    'Version: ' + (version.versionLabel || '1.0'),
    null,
    chapters.length > 0 ? chapters : [{ title: 'Contenu à venir', content: 'Cette version ne contient pas encore de contenu.' }],
    payload.design
  );
  await waitForPdf(writeStream);
  return { filePath: outputPath, ebookId };
}

module.exports = {
  getEbookSuggestions,
  generateAIEbookSuggestions,
  generateEbookFromVideo,
  generateCustomEbook,
  getEbookFilePath,
  generateProductVersionPdf,
  hasAnthropicKey,
  BASIC_EBOOK_LIMIT: 3,
  BASIC_MAX_CHAPTERS: 4
};
