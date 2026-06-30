const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function read(p) { return fs.readFileSync(path.join(ROOT, p), 'utf-8'); }
function write(p, c) { fs.writeFileSync(path.join(ROOT, p), c, 'utf-8'); console.log('  Updated: ' + p); }
function replace(p, map) {
  let c = read(p);
  let changed = false;
  for (const [fr, en] of Object.entries(map)) {
    const idx = c.indexOf(fr);
    if (idx !== -1) {
      c = c.split(fr).join(en);
      changed = true;
    }
  }
  if (changed) write(p, c);
  else console.log('  No changes: ' + p);
}

// ==================== VIEWS ====================

// ebooks.html
console.log('\n--- ebooks.html ---');
const ebooksMap = {
  'aria-label="Ouvrir le menu"': 'aria-label="Open menu"',
  '<h1>G\xe9n\xe9rateur d\'Ebooks IA</h1>': '<h1>AI Ebook Generator</h1>',
  '<p>Cr\xe9ez des ebooks professionnels en quelques minutes \u2014 depuis des vid\xe9os, transcriptions, ou de z\xe9ro avec l\'IA.</p>': '<p>Create professional ebooks in minutes \u2014 from videos, transcriptions, or from scratch with AI.</p>',
  '<h2>Suggestions d\'Ebooks par IA</h2>': '<h2>AI Ebook Suggestions</h2>',
  'placeholder="Th\xe8me (ex: Marketing Digital, D\xe9veloppement Web, Finance...)"': 'placeholder="Topic (e.g. Digital Marketing, Web Development, Finance...)"',
  'G\xe9n\xe9rer des suggestions': 'Generate suggestions',
  'Chargement des suggestions...': 'Loading suggestions...',
  '<h2>Cr\xe9er un ebook</h2>': '<h2>Create an ebook</h2>',
  '>Depuis une Vid\xe9o<': '>From a Video<',
  '>Personnalis\xe9<': '>Custom<',
  'placeholder="Collez une URL YouTube, TikTok ou Instagram..."': 'placeholder="Paste a YouTube, TikTok or Instagram URL..."',
  '>Transcrire<': '>Transcribe<',
  'Titre de l\'ebook...': 'Ebook title...',
  'Description de l\'ebook...': 'Ebook description...',
  'Contenu (ou transcrivez depuis l\'URL ci-dessus)': 'Content (or transcribe from the URL above)',
  'Collez votre transcription ou contenu ici...': 'Paste your transcription or content here...',
  '>Options de design<': '>Design options<',
  'Couleur de couverture': 'Cover color',
  'Couleur d\'accent': 'Accent color',
  'Couleur du texte': 'Text color',
  'G\xe9n\xe9rer l\'ebook': 'Generate ebook',
  'Titre de l\'ebook<': 'Ebook title<',
  'Nom de l\'auteur...': 'Author name...',
  'Titre du chapitre 1': 'Chapter 1 title',
  'Contenu (laissez vide pour g\xe9n\xe9ration IA...)': 'Content (leave blank for AI generation...)',
  '+ Ajouter un chapitre': '+ Add a chapter',
};
replace('views\\ebooks.html', ebooksMap);

// Also fix <label>Titre</label> and <label>Auteur</label> and <label>Chapitres</label> in ebooks.html - need to be careful they don't conflict
let eh = read('views\\ebooks.html');
let ehChanged = false;
// Fix individual labels that might appear multiple times
// <label>Titre</label> - only in video form AND custom form for chapter title - same in both, translate to Title
// <label>Auteur</label> - translate to Author
// <label>Chapitres</label> - translate to Chapters
eh = eh.replace(/(<label>)Titre(<\/label>)/g, '$1Title$2');
eh = eh.replace(/(<label>)Auteur(<\/label>)/g, '$1Author$2');
eh = eh.replace(/(<label>)Chapitres(<\/label>)/g, '$1Chapters$2');
// Fix console.error French
eh = eh.replace(/console\.error\('Erreur auth:', error\)/g, "console.error('Auth error:', error)");
eh = eh.replace(/console\.error\('Erreur stats:', error\)/g, "console.error('Stats error:', error)");
eh = eh.replace(/console\.error\('Erreur chargement suggestions:', error\)/g, "console.error('Error loading suggestions:', error)");
eh = eh.replace(/console\.error\('Erreur:', error\)/g, "console.error('Error:', error)");
if (eh !== read('views\\ebooks.html')) { write('views\\ebooks.html', eh); }

// ebook-preview.html
console.log('\n--- ebook-preview.html ---');
const epMap = {
  'Chargement de l\'aper\xe7u...': 'Loading preview...',
  'Aucun ebook sp\xe9cifi\xe9.': 'No ebook specified.',
  'Erreur de chargement': 'Loading error',
  'Table des mati\xe8res': 'Table of Contents',
  'Contenu \xe0 venir...': 'Content coming soon...',
};
replace('views\\ebook-preview.html', epMap);
let ep = read('views\\ebook-preview.html');
ep = ep.replace(/"Par "/g, '"By "');
ep = ep.replace(/'Par '/g, "'By '");
ep = ep.replace(/'Chapitre '/g, "'Chapter '");
ep = ep.replace(/\{error:'Erreur'\}/g, "{error:'Error'}");
if (ep !== read('views\\ebook-preview.html')) { write('views\\ebook-preview.html', ep); }

// pages.html
console.log('\n--- pages.html ---');
const pagesMap = {
  'Landing page pour vendre un ebook sur la perte de poids naturelle, avec temoignages et appel a action': 'Landing page to sell an ebook on natural weight loss, with testimonials and call to action',
  'Page de vente pour un programme coaching fitness en ligne 12 semaines, public cible hommes 25-40 ans': 'Sales page for a 12-week online fitness coaching program, target audience men 25-40',
  'Landing page pour une formation en ligne sur le marketing digital, avec benefices, statistiques et FAQ': 'Landing page for an online digital marketing course, with benefits, statistics and FAQ',
  'Page de vente pour un programme de meditation et gestion du stress, tons doux et apaisants': 'Sales page for a meditation and stress management program, soft and soothing tones',
  'Landing page pour un outil SaaS de gestion de projets pour freelances, design moderne bleu/violet': 'Landing page for a SaaS project management tool for freelancers, modern blue/purple design',
  'Portfolio pour photographe professionnel specialise mariage, avec temoignages clients': 'Portfolio for a professional wedding photographer, with client testimonials',
  'Decris ta page en quelques mots...': 'Describe your page in a few words...',
  'Personnalise ta page': 'Customize your page',
  'Nom du produit / marque (optionnel)': 'Product name / brand (optional)',
  'ex: FitPro, Mon Ebook Sante': 'e.g. FitPro, My Health Ebook',
  'Ton de la page': 'Page tone',
  'Pro & Serie': 'Professional',
  'Inspirant': 'Inspirational',
  'Langue': 'Language',
  'Sections a inclure': 'Sections to include',
  'Benefices': 'Benefits',
  'Temoignages': 'Testimonials',
  'Generer ma page': 'Generate my page',
  "L'IA construit ta page...": 'AI is building your page...',
  'Analyse du brief': 'Analyzing brief',
  'Redaction du contenu...': 'Writing content...',
  'Mise en forme des sections...': 'Formatting sections...',
  'Generation des couleurs...': 'Generating colors...',
  'NOUVEAUTE \xb7 EBOOK GRATUIT': 'NEW \xb7 FREE EBOOK',
  'Titre principal accrocheur': 'Catchy main title',
  'Sous-titre benefice': 'Benefit sub-headline',
  'Telecharger maintenant': 'Download now',
  'Preuve sociale': 'Social proof',
  '+3 200 lecteurs \xb7 Note 4.9/5': '+3,200 readers \xb7 Rating 4.9/5',
  'Satisfait ou rembourse 7 jours': 'Satisfied or refunded within 7 days',
  'Offre valable jusqu au...': 'Offer valid until...',
  'Commencer maintenant': 'Start now',
  'Contenu HTML (paragraphes, listes)': 'HTML content (paragraphs, lists)',
  'Regenerer avec IA': 'Regenerate with AI',
};
replace('views\\pages.html', pagesMap);
let ph = read('views\\pages.html');
ph = ph.replace(/>Suivant/g, '>Next');
ph = ph.replace(/Retour/g, 'Back');
ph = ph.replace(/Francais/g, 'French');
ph = ph.replace(/Espanol/g, 'Spanish');
ph = ph.replace(/Detendu/g, 'Casual');
ph = ph.replace(/Urgent/g, 'Urgent');
ph = ph.replace(/CTA Principal/g, 'Primary CTA');
ph = ph.replace(/Lien CTA/g, 'CTA Link');
ph = ph.replace(/Centre/g, 'Centered');
ph = ph.replace(/Gauche/g, 'Left');
ph = ph.replace(/3 colonnes/g, '3 columns');
ph = ph.replace(/2 colonnes/g, '2 columns');
ph = ph.replace(/Garantie/g, 'Guarantee');
ph = ph.replace(/Urgence/g, 'Urgency');
ph = ph.replace(/Lien</g, 'Link<');
ph = ph.replace(/Auteur</g, 'Author<');
ph = ph.replace(/Titre</g, 'Title<');
// Fix specific labels
ph = ph.replace(/l'appel/g, 'the call');
if (ph !== read('views\\pages.html')) { write('views\\pages.html', ph); }

// contract-new.html
console.log('\n--- contract-new.html ---');
let cn = read('views\\contract-new.html');
cn = cn.replace("console.error('Erreur auth:', error)", "console.error('Auth error:', error)");
// Also fix French comments
cn = cn.replace('// V\xe9rifier l\'authentification', '// Check authentication');
cn = cn.replace('// Cr\xe9er le contrat', '// Create contract');
cn = cn.replace("// R\xe9cup\xe9rer les clauses s\xe9lectionn\xe9es", '// Get selected clauses');
cn = cn.replace("// Enregistrer le contrat", "// Save contract");
if (cn !== read('views\\contract-new.html')) { write('views\\contract-new.html', cn); }

// pricing.html
let pr = read('views\\pricing.html');
pr = pr.replace('aria-label="Ouvrir le menu"', 'aria-label="Open menu"');
pr = pr.replace('// Afficher le bouton upgrade seulement si pas d\xe9j\xe0 PRO', '// Show upgrade button only if not already PRO');
if (pr !== read('views\\pricing.html')) { write('views\\pricing.html', pr); }

// dashboard.html
let db = read('views\\dashboard.html');
db = db.replace("console.error('Erreur auth:', error)", "console.error('Auth error:', error)");
db = db.replace("'Erreur'", "'Error'");
if (db !== read('views\\dashboard.html')) { write('views\\dashboard.html', db); }

// product-page.html
let pp = read('views\\product-page.html');
pp = pp.replace('<html lang="fr">', '<html lang="en">');
pp = pp.replace('Chargement...</p>', 'Loading...</p>');
if (pp !== read('views\\product-page.html')) { write('views\\product-page.html', pp); }

// page-public.html
let pbp = read('views\\page-public.html');
pbp = pbp.replace('<html lang="fr">', '<html lang="en">');
pbp = pbp.replace('Chargement...</p>', 'Loading...</p>');
if (pbp !== read('views\\page-public.html')) { write('views\\page-public.html', pbp); }

// ==================== CONTROLLERS ====================

// ebook.controller.js
console.log('\n--- controllers/ebook.controller.js ---');
const ecMap = {
  'Limite atteinte pour le plan BASIC (': 'Limit reached for the BASIC plan (',
  ' ebooks max). Passez au plan PRO pour une cr\xe9ation illimit\xe9e.': ' ebooks max). Upgrade to PRO for unlimited creation.',
  'Erreur lors du chargement des suggestions': 'Error loading suggestions',
  'Le sujet est requis': 'Topic is required',
  'Service IA non disponible. Cl\xe9 API Anthropic manquante.': 'AI service unavailable. Missing API key.',
  'Erreur lors de la g\xe9n\xe9ration des suggestions IA': 'Error generating AI suggestions',
  'Fournissez un titre, une URL ou une transcription': 'Provide a title, URL, or transcription',
  'URL non support\xe9e. Utilisez YouTube, TikTok ou Instagram.': 'Unsupported URL. Use YouTube, TikTok, or Instagram.',
  "La transcription est requise. Extrayez-la depuis l'URL ou uploadez une vid\xe9o.": 'Transcription is required. Extract it from the URL or upload a video.',
  'Le titre est requis': 'Title is required',
  'Ebook cr\xe9\xe9 avec succ\xe8s': 'Ebook created successfully',
  "Erreur lors de la cr\xe9ation de l'ebook": 'Error creating ebook',
  "L'URL de la vid\xe9o est requise": 'Video URL is required',
  'Erreur lors de la transcription': 'Error during transcription',
  'Aucun fichier vid\xe9o re\xe7u': 'No video file received',
  'Erreur lors de la transcription du fichier': 'Error transcribing file',
  'Le titre et au moins un chapitre sont requis': 'Title and at least one chapter are required',
  'Ebook introuvable': 'Ebook not found',
  'Aucun contenu dans cet ebook': 'No content in this ebook',
  "Erreur lors de l'export de l'ebook": 'Error exporting ebook',
  "Créé à partir de votre vidéo": 'Created from your video',
  'Ebook personnalis\xe9': 'Custom ebook',
  "Erreur lors du chargement de l'ebook": 'Error loading ebook',
  "Erreur lors du chargement des ebooks": 'Error loading ebooks',
};
replace('controllers\\ebook.controller.js', ecMap);

// pages.controller.js
console.log('\n--- controllers/pages.controller.js ---');
let pc = read('controllers\\pages.controller.js');
const pcMap = {
  'La description est requise': 'Description is required',
  'Erreur lors de la g\xe9n\xe9ration IA': 'Error during AI generation',
  'Type de section requis': 'Section type is required',
  'Service IA non disponible.': 'AI service unavailable.',
  "Erreur lors de la regeneration": "Error during regeneration",
};
for (const [fr, en] of Object.entries(pcMap)) { pc = pc.split(fr).join(en); }
// Fix AI prompt strings in pages controller
pc = pc.replace('Tu es un expert en copywriting.', 'You are a copywriting expert.');
pc = pc.replace("Genere uniquement une section de type", "Generate only a section of type");
pc = pc.replace('"headline":"Ce que disent nos clients"', '"headline":"What Our Clients Say"');
pc = pc.replace('"headline":"Questions frequentes"', '"headline":"Frequently Asked Questions"');
pc = pc.replace('"headline":"Vous reconnaissez-vous ?"', '"headline":"Do You Recognize Yourself?"');
pc = pc.replace('"headline":"Chiffres cles"', '"headline":"Key Figures"');
pc = pc.replace('Contenu authentique et persuasif.', 'Authentic and persuasive content.');
pc = pc.replace("Retourne UNIQUEMENT le JSON, sans texte avant/apres.", "Return ONLY the JSON, no text before or after.");
pc = pc.replace('"guarantee_text":"Satisfait ou rembourse 7 jours"', '"guarantee_text":"Satisfied or refunded within 7 days"');
if (pc !== read('controllers\\pages.controller.js')) { write('controllers\\pages.controller.js', pc); }

// ==================== SERVICES ====================

// ebook.service.js
console.log('\n--- services/ebook.service.js ---');
let es = read('services\\ebook.service.js');
const esMap = {
  "title: 'Guide du Freelance D\u00e9marrant'": "title: 'Freelance Starter Guide'",
  "description: 'Tout ce que vous devez savoir pour commencer votre carri\u00e8re de freelance'": "description: 'Everything you need to know to start your freelance career'",
  "'Introduction au Freelancing'": "'Introduction to Freelancing'",
  "'Fixer vos tarifs'": "'Setting Your Rates'",
  "'Trouver vos premiers clients'": "'Finding Your First Clients'",
  "'G\u00e9rer votre activit\u00e9'": "'Managing Your Business'",
  "title: 'Productivit\u00e9 pour D\u00e9veloppeurs'": "title: 'Productivity for Developers'",
  "description: 'Astuces et outils pour coder plus efficacement'": "description: 'Tips and tools to code more efficiently'",
  "'Gestion du temps'": "'Time Management'",
  "'Outils essentiels'": "'Essential Tools'",
  "'Bonnes pratiques de code'": "'Code Best Practices'",
  "'Apprentissage continu'": "'Continuous Learning'",
  "title: 'Marketing Digital Basique'": "title: 'Basic Digital Marketing'",
  "description: 'Les fondamentaux du marketing en ligne pour entrepreneurs'": "description: 'The fundamentals of online marketing for entrepreneurs'",
  "'SEO et contenu'": "'SEO and Content'",
  "'R\u00e9seaux sociaux'": "'Social Media'",
  "'Email marketing'": "'Email Marketing'",
  "'Analyse des r\u00e9sultats'": "'Results Analysis'",
};
for (const [fr, en] of Object.entries(esMap)) { es = es.split(fr).join(en); }
es = es.replace("doc.text('Par ' + author, cx", "doc.text('By ' + author, cx");
es = es.replace("doc.text('Table des mati\u00e8res', cx", "doc.text('Table of Contents', cx");
es = es.replace("'CHAPITRE ' + (index + 1)", "'CHAPTER ' + (index + 1)");
es = es.replace("chapter.content || 'Contenu du chapitre...'", "chapter.content || 'Chapter content...'");
es = es.replace("throw new Error('Cl\u00e9 API IA non configur\u00e9e')", "throw new Error('AI API key not configured')");
es = es.replace("G\u00e9n\u00e8re 3 suggestions d'ebooks sur le th\u00e8me:", "Generate 3 ebook suggestions on the topic:");
es = es.replace("throw new Error('Format de r\u00e9ponse IA invalide')", "throw new Error('Invalid AI response format')");
es = es.replace("Tu es un \u00e9diteur d'ebooks professionnel. \u00c0 partir de cette transcription, cr\u00e9e un ebook structur\u00e9 avec 3 \u00e0 5 chapitres coh\u00e9rents.", "You are a professional ebook editor. From this transcription, create a structured ebook with 3 to 5 coherent chapters.");
es = es.replace("throw new Error('Impossible de structurer le contenu vid\u00e9o')", "throw new Error('Unable to structure the video content')");
es = es.replace("videoData.title || 'Ebook G\u00e9n\u00e9r\u00e9'", "videoData.title || 'Generated Ebook'");
es = es.replace("content: 'Contenu extrait de la vid\u00e9o...'", "content: 'Content extracted from the video...'");
es = es.replace("videoData.description || 'Cr\u00e9\u00e9 \u00e0 partir de votre vid\u00e9o'", "videoData.description || 'Created from your video'");
es = es.replace("throw new Error('Impossible de g\u00e9n\u00e9rer les chapitres')", "throw new Error('Unable to generate chapters')");
es = es.replace("title: 'Contenu \u00e0 venir'", "title: 'Content coming soon'");
es = es.replace("content: 'Cette version ne contient pas encore de contenu.'", "content: 'This version does not contain any content yet.'");
// Fix AI prompts - these are long strings
es = es.replace(
  "\u00c9cris un chapitre d'ebook d'environ 300 mots sur le th\u00e8me:",
  "Write an ebook chapter of about 300 words on the topic:"
);
es = es.replace(
  "R\u00e9dige de fa\u00e7on professionnelle et informative. Ne mets pas de titre en en-t\u00eate, seulement le contenu.",
  "Write in a professional and informative manner. Do not include a heading, only the content."
);
es = es.replace(
  "Tu es un auteur d'ebooks professionnel. Cr\u00e9e 4 chapitres pour un ebook intitul\u00e9",
  "You are a professional ebook author. Create 4 chapters for an ebook titled"
);
es = es.replace(
  "sur le th\u00e8me:",
  "on the topic:"
);
if (es !== read('services\\ebook.service.js')) { write('services\\ebook.service.js', es); }

// ai.service.js
console.log('\n--- services/ai.service.js ---');
let ai = read('services\\ai.service.js');
const aiMap = {
  "G\xe9n\xe8re tout le contenu en francais. Utilise un francais naturel et fluide.": "Generate all content in English. Use natural, fluent English.",
  "Tu es un expert en copywriting et creation de landing pages haute conversion.": "You are an expert in copywriting and high-conversion landing page creation.",
  "G\xe9n\xe8re une landing page complete au format JSON. Contenu 100% authentique et persuasif, jamais de Lorem ipsum ou de placeholders.": "Generate a complete landing page in JSON format. 100% authentic and persuasive content, never Lorem ipsum or placeholders.",
  "REGLES STRICTES :": "STRICT RULES:",
  "- Contenu 100% authentique et specifique au sujet, jamais de texte generique": "- 100% authentic content specific to the topic, never generic text",
  "- Chaque section doit contenir du texte persuasif, oriente conversion": "- Each section must contain persuasive, conversion-oriented text",
  "- Structure AIDA : Attention \u2192 Interet \u2192 Desir \u2192 Action": "- AIDA structure: Attention \u2192 Interest \u2192 Desire \u2192 Action",
  "- Adapte le ton, le vocabulaire et le style a l audience decrite": "- Adapt the tone, vocabulary, and style to the described audience",
  "- Inclus des chiffres et des benefices concrets": "- Include figures and concrete benefits",
  "Ton professionnel et credible, vocabulaire soutenu mais accessible.": "Professional and credible tone, sophisticated yet accessible vocabulary.",
  "Ton detendu et accessible, comme une conversation entre amis.": "Relaxed and approachable tone, like a conversation between friends.",
  "Ton inspirant et motivant, qui pousse a l action.": "Inspiring and motivating tone that drives action.",
  "Ton direct et urgent, qui cree un sentiment d urgence.": "Direct and urgent tone that creates a sense of urgency.",
  "- G\xe9n\xe8re des couleurs coherentes avec le type de page (ex: bien-etre = tons doux, tech = bleu/violet)": "- Generate colors consistent with the page type (e.g., wellness = soft tones, tech = blue/purple)",
  "- Le slug doit etre en francais (ou dans la langue choisie), en kebab-case": "- The slug must be in English (or the chosen language), in kebab-case",
  "- La description est une meta description SEO max 155 caracteres": "- The description is a meta description for SEO, max 155 characters",
  '"title": "Titre accrocheur de la page"': '"title": "Catchy page title"',
  '"description": "Meta description SEO, max 155 caracteres"': '"description": "SEO meta description, max 155 characters"',
  '"slug": "slug-en-kebab-case"': '"slug": "slug-in-kebab-case"',
  '"eyebrow":"Petit texte au-dessus du titre"': '"eyebrow":"Small text above the title"',
  '"headline":"Titre principal accrocheur, max 10 mots"': '"headline":"Catchy main headline, max 10 words"',
  '"subheadline":"Sous-titre benefice 1-2 phrases"': '"subheadline":"Benefit subheading 1-2 sentences"',
  '"cta_primary_text":"Texte bouton principal"': '"cta_primary_text":"Main button text"',
  '"cta_secondary_text":"Texte bouton secondaire (optionnel)"': '"cta_secondary_text":"Secondary button text (optional)"',
  '"social_proof_text":"+XXXX personnes ont deja..."': '"social_proof_text":"+XXXX people already..."',
  '"headline":"Titre section benefices"': '"headline":"Benefits section title"',
  '"subheadline":"Description courte"': '"subheadline":"Short description"',
  '"title":"Titre du benefice"': '"title":"Benefit title"',
  '"description":"Description concrete avec chiffres"': '"description":"Concrete description with figures"',
  '"headline":"Titre"': '"headline":"Title"',
  '"body":"Contenu HTML (paragraphes, listes ul/li autorisees)"': '"body":"HTML content (paragraphs, ul/li lists allowed)"',
  '"image_placeholder":"Description de l image ideale"': '"image_placeholder":"Description of the ideal image"',
  '"headline":"Titre appel a action"': '"headline":"Call-to-action title"',
  '"subheadline":"Phrase qui leve les dernieres hesitations"': '"subheadline":"Phrase that removes final hesitations"',
  '"cta_primary_text":"Texte du bouton"': '"cta_primary_text":"Button text"',
  '"guarantee_text":"Satisfait ou rembourse 7 jours"': '"guarantee_text":"Satisfied or refunded within 7 days"',
  '"urgency_text":"Offre valable jusqu a epuisement des stocks"': '"urgency_text":"Offer valid while stocks last"',
  '"headline":"Ce que disent nos clients"': '"headline":"What Our Clients Say"',
  '"quote":"Temoignage realiste avec resultat concret"': '"quote":"Realistic testimonial with concrete result"',
  '"author":"Prenom N."': '"author":"First Name L."',
  '"role":"Profession"': '"role":"Profession"',
  '"result_highlight":"-8kg en 3 semaines"': '"result_highlight":"-8kg in 3 weeks"',
  '"headline":"Questions frequentes"': '"headline":"Frequently Asked Questions"',
  '"question":"Question reelle"': '"question":"Real question"',
  '"answer":"Reponse claire et rassurante"': '"answer":"Clear and reassuring answer"',
  '"headline":"Vous reconnaissez-vous ?"': '"headline":"Do You Recognize Yourself?"',
  '"intro":"Phrase d empathie"': '"intro":"Empathy statement"',
  '"pain_points":[{"text":"Point de douleur specifique"}]': '"pain_points":[{"text":"Specific pain point"}]',
  '"transition":"Phrase de transition vers la solution"': '"transition":"Transition phrase toward the solution"',
  '"headline":"Chiffres cles"': '"headline":"Key Figures"',
  '"value":"3 200+"': '"value":"3,200+"',
  '"label":"Clients satisfaits"': '"label":"Satisfied Clients"',
};
for (const [fr, en] of Object.entries(aiMap)) { ai = ai.split(fr).join(en); }
// Fix the default language
ai = ai.replace(/language: language \|\| 'fr'/g, "language: language || 'en'");
ai = ai.replace(/const language = \(context && context\.language\) \|\| 'fr'/g, "const language = (context && context.language) || 'en'");
// Fix the page description prompt
ai = ai.replace(
  "Description de la page :",
  "Page description:"
);
ai = ai.replace(
  "Genere la landing page :",
  "Generate the landing page:"
);
// Fix "bien-etre" (well-being) in color rule string
ai = ai.replace(/bien-etre/, "wellness");
if (ai !== read('services\\ai.service.js')) { write('services\\ai.service.js', ai); }

// transcription.service.js
console.log('\n--- services/transcription.service.js ---');
let ts = read('services\\transcription.service.js');
ts = ts.replace("title: info.title || 'Vid\u00e9o sans titre'", "title: info.title || 'Untitled Video'");
ts = ts.replace("throw new Error('Impossible de t\u00e9l\u00e9charger l'audio de la vid\u00e9o')", "throw new Error('Unable to download video audio')");
ts = ts.replace("throw new Error('Vid\u00e9o trop longue pour la transcription automatique (essayez une vid\u00e9o plus courte)')", "throw new Error('Video too long for automatic transcription (try a shorter video)')");
ts = ts.replace("throw new Error('Cl\u00e9 API Groq requise pour transcrire l'audio. Ajoutez GROK_API_KEY dans .env')", "throw new Error('Groq API key required to transcribe audio. Add GROK_API_KEY to .env')");
ts = ts.replace("throw new Error('URL non support\u00e9e. Utilisez un lien YouTube, TikTok ou Instagram.')", "throw new Error('Unsupported URL. Use a YouTube, TikTok, or Instagram link.')");
ts = ts.replace("throw new Error('Format de fichier non support\u00e9. Utilisez MP4, MOV, MP3, WAV ou WebM.')", "throw new Error('Unsupported file format. Use MP4, MOV, MP3, WAV, or WebM.')");
// Change Whisper language from fr to en
ts = ts.replace(/language: 'fr'/g, "language: 'en'");
if (ts !== read('services\\transcription.service.js')) { write('services\\transcription.service.js', ts); }

// quota.service.js
console.log('\n--- services/quota.service.js ---');
let qs = read('services\\quota.service.js');
qs = qs.replace(
  "Limite du plan BASIC atteinte pour ",
  "BASIC plan limit reached for "
);
qs = qs.replace(
  " max). Passez au PRO pour une utilisation illimit\u00e9e.",
  " max). Upgrade to PRO for unlimited use."
);
if (qs !== read('services\\quota.service.js')) { write('services\\quota.service.js', qs); }

// stripe.service.js
console.log('\n--- services/stripe.service.js ---');
let ss = read('services\\stripe.service.js');
ss = ss.replace('Acc\u00e8s illimit\u00e9 \u00e0 tous les contrats sans watermark', 'Unlimited access to all contracts without watermark');
ss = ss.replace('Acc\u00e8s \u00e0 votre version digitale', 'Access to your digital version');
ss = ss.replace("name: 'Plan PRO - Contrak'", "name: 'PRO Plan - Contrak'");
if (ss !== read('services\\stripe.service.js')) { write('services\\stripe.service.js', ss); }

// firebase.service.js
console.log('\n--- services/firebase.service.js ---');
let fb = read('services\\firebase.service.js');
fb = fb.replace("throw new Error('Token invalide')", "throw new Error('Invalid token')");
if (fb !== read('services\\firebase.service.js')) { write('services\\firebase.service.js', fb); }

// pdf.service.js
console.log('\n--- services/pdf.service.js ---');
let pdf = read('services\\pdf.service.js');
pdf = pdf.replace("'fr-FR'", "'en-US'");
if (pdf !== read('services\\pdf.service.js')) { write('services\\pdf.service.js', pdf); }

// ==================== ADDITIONAL VIEW FIXES ====================

// Fix <html lang="fr"> in any remaining views
console.log('\n--- Fixing lang="fr" in remaining views ---');
const viewFiles = ['index.html', 'login.html', 'register.html', '404.html', 'cart.html',
  'coupons.html', 'customers.html', 'media.html', 'orders-admin.html', 'products.html',
  'profile.html', 'sales-analytics.html', 'super-admin.html', 'thank-you.html',
  'blog-admin.html', 'blog.html', 'article.html', 'pricing.html', 'products.html'];
viewFiles.forEach(f => {
  const fp = 'views\\' + f;
  if (fs.existsSync(path.join(ROOT, fp))) {
    let c = read(fp);
    if (c.includes('<html lang="fr">')) {
      c = c.replace('<html lang="fr">', '<html lang="en">');
      write(fp, c);
    }
  }
});

// Fix remaining French that might have been missed in ebooks.html: <label>Titre</label> etc
eh = read('views\\ebooks.html');
// Fix <label>Description</label> - already English but check context
// Fix anything else
if (eh.includes('aria-label="Ouvrir le menu"')) {
  eh = eh.replace('aria-label="Ouvrir le menu"', 'aria-label="Open menu"');
  write('views\\ebooks.html', eh);
}

console.log('\n=== TRANSLATION COMPLETE ===');
