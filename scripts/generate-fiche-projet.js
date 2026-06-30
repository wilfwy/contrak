const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const OUTPUT = path.join(__dirname, '..', 'FICHE_PROJET_CONTRAK.pdf');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 55, right: 55 },
  info: { Title: 'Contrak - Fiche Projet', Author: 'Contrak' }
});

doc.pipe(fs.createWriteStream(OUTPUT));

const GREEN_DARK = '#0a3020';
const GREEN_MID = '#1a6b48';
const GREEN_LIGHT = '#34d399';
const TEXT_DARK = '#1a1a2e';
const TEXT_MUTED = '#6b7280';
const WHITE = '#ffffff';

const dateStr = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

const PAGE_H = 842;
const TOP = 50;
const BOTTOM = 50;
const CONTENT_H = PAGE_H - TOP - BOTTOM;

let cursorY = TOP;
let sectionNum = 0;

function rect(x, y, w, h, color) {
  doc.rect(x, y, w, h).fill(color);
}

function drawHeaderBar() {
  rect(0, 0, doc.page.width, 8, GREEN_DARK);
}

function drawFooterBar() {
  rect(0, doc.page.height - 20, doc.page.width, 20, GREEN_DARK);
  doc.fillColor(WHITE).fontSize(8).font('Helvetica');
  doc.text('CONFIDENTIAL - Contrak Project Sheet', 55, doc.page.height - 14, { align: 'center' });
}

function needSpace(needed) {
  if (cursorY + needed > PAGE_H - BOTTOM - 10) {
    drawFooterBar();
    doc.addPage();
    drawHeaderBar();
    cursorY = TOP + 10;
  }
}

function sectionHeader(title) {
  sectionNum++;
  needSpace(70);
  doc.circle(55, cursorY + 4, 16).fillColor(GREEN_DARK).fill();
  doc.fillColor(WHITE).fontSize(14).font('Helvetica-Bold')
    .text(String(sectionNum).padStart(2, '0'), 50, cursorY - 4);
  doc.fillColor(GREEN_DARK).fontSize(18).font('Helvetica-Bold').text(title, 85, cursorY - 2);
  cursorY += 30;
  doc.moveTo(55, cursorY).lineTo(doc.page.width - 55, cursorY).strokeColor(GREEN_LIGHT).lineWidth(1.5).stroke();
  cursorY += 22;
}

function subheader(text) {
  needSpace(30);
  doc.fillColor(GREEN_MID).fontSize(12).font('Helvetica-Bold').text(text, 55, cursorY);
  cursorY += 22;
}

function bullet(text, note) {
  const lineW = doc.page.width - 133;
  const lines = doc.fontSize(9).font('Helvetica').widthOfString(text);
  const lineCount = Math.max(1, Math.ceil(lines / lineW));
  const noteLines = note ? Math.max(1, Math.ceil(doc.fontSize(7.5).font('Helvetica').widthOfString(note) / (doc.page.width - 145))) : 0;
  const needed = lineCount * 14 + (noteLines * 11 + 4) + 4;

  needSpace(needed);

  doc.circle(65, cursorY + 5, 3).fillColor(GREEN_LIGHT).fill();
  doc.fillColor(TEXT_DARK).fontSize(9).font('Helvetica').text(text, 78, cursorY, { width: lineW, lineGap: 3 });
  cursorY += lineCount * 14 + 4;

  if (note) {
    doc.fillColor(TEXT_MUTED).fontSize(7.5).font('Helvetica-Oblique').text(note, 90, cursorY - 2, { width: doc.page.width - 145 });
    cursorY += noteLines * 11 + 4;
  }
}

// ============ COVER PAGE ============
drawHeaderBar();

doc.fillColor(GREEN_DARK).fontSize(42).font('Helvetica-Bold');
doc.text('CONTRAK', 55, 120, { align: 'center' });

doc.fillColor(GREEN_MID).fontSize(16).font('Helvetica');
doc.text('Fiche Projet', 55, 172, { align: 'center' });

doc.moveTo(55, 205).lineTo(doc.page.width - 55, 205).strokeColor(GREEN_LIGHT).lineWidth(2).stroke();

doc.fillColor(TEXT_MUTED).fontSize(11).font('Helvetica');
doc.text('Plateforme tout-en-un pour creer, vendre et publier', 55, 225, { align: 'center' });
doc.text('du contenu digital avec intelligence artificielle', 55, 242, { align: 'center' });

doc.fillColor(TEXT_MUTED).fontSize(9);
doc.text('contrak-copie.vercel.app', 55, 280, { align: 'center' });

const badges = [
  { label: 'Node.js / Express', x: 90 },
  { label: 'Firestore', x: 200 },
  { label: 'Stripe', x: 290 },
  { label: 'Groq AI', x: 355 },
  { label: 'Cloudinary', x: 440 },
  { label: 'Vercel', x: 200, y2: true },
  { label: 'PDFKit', x: 275, y2: true },
  { label: 'Chart.js', x: 350, y2: true }
];

badges.forEach(b => {
  const by = b.y2 ? 378 : 350;
  const w = doc.fontSize(8).font('Helvetica').widthOfString(b.label) + 20;
  doc.roundedRect(b.x, by, w, 22, 11).fillColor(GREEN_DARK).fill();
  doc.fillColor(GREEN_LIGHT).fontSize(8).text(b.label, b.x + 10, by + 6);
});

drawFooterBar();
cursorY = TOP + 10;
doc.addPage();
drawHeaderBar();

// ============ TABLE OF CONTENTS ============
cursorY = TOP + 10;
doc.fillColor(GREEN_DARK).fontSize(22).font('Helvetica-Bold');
doc.text('Table des matieres', 55, cursorY);
cursorY += 28;
doc.moveTo(55, cursorY).lineTo(doc.page.width - 55, cursorY).strokeColor(GREEN_LIGHT).lineWidth(1.5).stroke();
cursorY += 12;

const tocItems = [
  '1. Generation IA (via Groq)',
  '2. Ebooks Premium',
  '3. Page Builder',
  '4. Ecommerce',
  '5. Gestion des Ventes',
  '6. Blog & Academy',
  '7. Contrats Legaux',
  '8. SEO & Visibilite',
  '9. Abonnements',
  '10. Architecture Technique',
  '11. Deployment & Securite',
  '12. Roadmap'
];

doc.fontSize(11).font('Helvetica');
tocItems.forEach((item, i) => {
  doc.fillColor(GREEN_DARK).text(item, 55, cursorY);
  doc.moveTo(55, cursorY + 16).lineTo(doc.page.width - 55, cursorY + 16).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
  cursorY += 22;
});

// ============ CONTENT SECTIONS ============

sectionHeader('Generation IA (via Groq)');
bullet('Creation d\'ebooks complete par IA : suggestions automatiques, generation de chapitres et contenu redactionnel');
bullet('Generation de landing pages entieres depuis une simple description en langage naturel');
bullet('Regeneration de sections individuelles sans refaire toute la page');
bullet('Generation de copies marketing (headlines, descriptions, emails)');
bullet('Transcription video vers texte via Whisper (YouTube, TikTok, Instagram)');
bullet('Structure AIDA pour les contenus marketing (Attention, Interest, Desire, Action)');
bullet('4 tons disponibles : professionnel, detendu, inspirant, urgent');
bullet('3 langues supportees : Francais, Anglais, Espagnol');
bullet('Contenu 100% authentique : aucune utilisation de Lorem ipsum');
bullet('Quota IA : 5 suggestions/jour en BASIC, illimite en PRO');

sectionHeader('Ebooks Premium');
subheader('Creation');
bullet('Creation depuis video : coller une URL YouTube/TikTok/Instagram -> transcription automatique -> ebook genere');
bullet('Creation personnalisee avec chapitres : titre + contenu redige par l\'utilisateur ou genere par IA');
bullet('3 suggestions d\'ebooks predefinies par theme pour demarrer rapidement');
bullet('Generation automatique du contenu des chapitres par IA avec contexte et coherence');

subheader('Design & Export');
bullet('PDF professionnel avec couverture design, table des matieres interactive et chapitres formates');
bullet('Options de design : couleur de couverture, couleur d\'accent, style typographique');
bullet('Preview HTML interactive avant telechargement avec rendu en direct');
bullet('Export PDF illimite en PRO, 3 exports en BASIC');
bullet('Generation PDF a la demande depuis Firestore (compatible Vercel serverless)');
bullet('Chapitres stockes en base de donnees avec format titre + contenu structure');

sectionHeader('Page Builder');
subheader('Sections disponibles (8 types)');
bullet('Hero enrichi : eyebrow, headline, subheadline, CTA, social proof, layout (centre/gauche/droite)');
bullet('Features : items avec icone/titre/description, grille 2 ou 3 colonnes');
bullet('Testimonials : citations avec auteur, role, note');
bullet('CTA : titre, sous-titre, texte de garantie, texte d\'urgence');
bullet('FAQ : questions/reponses avec accordeon');
bullet('Problem : points de douleur + phrase de transition vers la solution');
bullet('Stats : metriques avec valeur et etiquette (ex: 10 000+ utilisateurs)');
bullet('Content : bloc HTML libre pour contenu riche');

subheader('Fonctionnalites');
bullet('Wizard de generation IA en 3 etapes : prompt -> parametres -> generation animee');
bullet('Editeurs inline specifiques par type de section avec champs adaptes');
bullet('Reorder des sections par fleches haut/bas');
bullet('Suppression et collapse/expand des sections');
bullet('Regeneration IA par section individuelle sans perdre le reste');
bullet('Personnalisation : tons, langues, sections souhaitees');
bullet('Theme couleurs : background, texte, accent configurables');
bullet('Publication immediate -> page publique /l/[slug]');

sectionHeader('Ecommerce');
subheader('Produits');
bullet('Produits digitaux avec versions multiples (prix, devise, contenu differents par version)');
bullet('13 devises supportees : EUR, USD, GBP, JPY, CAD, AUD, CHF, CNY, SEK, NOK, DKK, BRL, INR');
bullet('Codes promo / coupons : pourcentage, montant fixe, max utilisations, date d\'expiration');
bullet('Duplication de produits en un clic');
bullet('Pages de vente produits style Carrd.co : hero centre, couverture, prix, details, avis, CTA');
bullet('Couverture produit avec media picker visuel (thumbnails Cloudinary)');
bullet('Avis et notes produits : 1 a 5 etoiles avec moderation');

subheader('Checkout & Paiements');
bullet('Panier d\'achat multi-items avec mise a jour en temps reel');
bullet('Checkout Stripe securise (one-time et abonnement recurring)');
bullet('Guest checkout : achat sans creation de compte utilisateur');
bullet('Multi-items checkout : validation et paiement de plusieurs produits simultanement');
bullet('Page de remerciement post-achat avec recapitulatif');

subheader('Livraison');
bullet('Livraison automatique : PDF disponible en telechargement immediat apres paiement');
bullet('Email de confirmation avec lien de telechargement');
bullet('Acces permanent aux achats dans l\'historique du profil');

sectionHeader('Gestion des Ventes');
subheader('Tableau de bord');
bullet('Dashboard analytique : CA 30 jours, top produits, nombre de commandes/jour');
bullet('Graphiques interactifs Chart.js : ligne (CA), barres (commandes), doughnut (statuts)');
bullet('Top 10 produits par revenu');

subheader('Commandes');
bullet('Gestion complete des commandes avec tous les statuts (en_attente, paye, envoye, rembourse, annule)');
bullet('Recherche et filtres par statut');
bullet('Export CSV des commandes pour comptabilite');

subheader('Clients');
bullet('Liste des clients avec email, total depense, produits achetes');
bullet('Historique commandes par client');
bullet('Notifications email pour chaque nouvelle commande');

sectionHeader('Blog & Academy');
subheader('Blog');
bullet('Articles avec statut publie/draft, slug personnalisable, excerpt, image de couverture, tags');
bullet('Pages publiques optimisees SEO avec meta descriptions');
bullet('Administration CRUD complete depuis le dashboard');

subheader('Academy');
bullet('Cours avec lecons, videos, duree, ordre chronologique');
bullet('CRUD complet pour cours et lecons');
bullet('Structure hierarchique : cours -> lecons ordonnees');

subheader('Media Library');
bullet('Upload de fichiers par drag-drop ou selection');
bullet('Stockage Cloudinary avec transformation d\'images');
bullet('Grille de visuels avec preview modal et copie d\'URL');
bullet('Selection visuelle dans les formulaires (media picker)');

sectionHeader('Contrats Legaux');
bullet('Creation de contrats freelance : prestataire, client, mission, prix, clauses personnalisees');
bullet('Generation PDF avec design professionnel et mise en page soignee');
bullet('Preview HTML avant telechargement');
bullet('Filigrane BASIC visible sur les contrats gratuits');
bullet('Sans filigrane en PRO');
bullet('Limite : 5 contrats en BASIC, illimite en PRO');
bullet('Stockage securise dans Firestore avec historique');

sectionHeader('SEO & Visibilite');
bullet('Sitemap.xml automatique generant toutes les URLs publiques (produits, pages, articles)');
bullet('Meta tags Open Graph + Twitter Cards pour le partage social');
bullet('JSON-LD schema.org/Product pour les resultats enrichis Google');
bullet('Robots.txt configure pour les crawlers');
bullet('Pages produits publiques : /p/[slug]');
bullet('Landing pages publiques : /l/[slug]');
bullet('Blog public : /blog/[slug]');

sectionHeader('Abonnements');
subheader('Plan BASIC (gratuit)');
bullet('3 ebooks', 'limite');
bullet('5 contrats', 'limite');
bullet('5 produits', 'limite');
bullet('5 landing pages', 'limite');
bullet('10 medias', 'limite');
bullet('5 suggestions IA / jour', 'limite');
bullet('5 transcriptions video / mois', 'limite');
bullet('Filigrane PDF contrat', 'present');
bullet('Paiements Stripe', 'non inclus');

subheader('Plan PRO (9,90 EUR/mois)');
bullet('Ebooks illimites');
bullet('Contrats illimites');
bullet('Produits illimites');
bullet('Landing pages illimitees');
bullet('Medias illimites');
bullet('Suggestions IA illimitees');
bullet('Transcriptions video illimitees');
bullet('Sans filigrane PDF contrat');
bullet('Paiements Stripe actives');
bullet('Support prioritaire');

sectionHeader('Architecture Technique');
subheader('Stack');
bullet('Backend : Node.js + Express (serverless sur Vercel)');
bullet('Base de donnees : Firestore (NoSQL, echelle automatique)');
bullet('Paiements : Stripe (Checkout + Webhooks)');
bullet('IA : Groq API via Llama 3.3 70B (OpenAI-compatible)');
bullet('Stockage media : Cloudinary (images, videos)');
bullet('Frontend : HTML/CSS/JS vanilla avec theme dark green');
bullet('PDF : PDFKit avec design personnalise');
bullet('Graphiques : Chart.js');
bullet('Email : Nodemailer (Ethereal dev / SendGrid production)');

subheader('Base de donnees (collections Firestore)');
bullet('users, ebooks, products, product_versions, orders, transactions');
bullet('coupons, contracts, pages, reviews, articles, courses, lessons');
bullet('media, carts, analytics_events, blog, academy');

sectionHeader('Deploiement & Securite');
subheader('Deploiement');
bullet('Platforme : Vercel (serverless, haute disponibilite)');
bullet('URL : https://contrak-copie.vercel.app/');
bullet('Git : https://github.com/wilfwy/contrak.git (branch master)');
bullet('Export serverless via app dans server.js');

subheader('Securite');
bullet('Authentification Firebase : tokens JWT avec cookies httpOnly');
bullet('Middleware d\'autorisation : authenticateFirebase, loadUserInfo, requireSuperAdmin');
bullet('Variables d\'environnement : toutes les cles API en .env + Vercel Dashboard');
bullet('Webhook Stripe : body parse en raw avant express.json()');
bullet('CSRF : sameSite strict sur les cookies');
bullet('Firebase Admin : init non-fatale (le serveur demarre meme sans credentials)');
bullet('Tri Firestore en memoire systematique (pas d\'index composites requis)');

subheader('Points d\'attention');
bullet('Cloudinary credentials a definir dans Vercel Dashboard pour l\'upload media');
bullet('SMTP Ethereal (dev) a remplacer par SendGrid/Mailgun en production');
bullet('Firebase Admin SDK generatePasswordResetLink indisponible sur Vercel (fallback lien direct)');
bullet('PDF ebook regenere a la demande depuis Firestore (pas de fichier persistant)');
bullet('Tous les mkdirSync utilisent /tmp/ pour la compatibilite Vercel serverless');

sectionHeader('Roadmap');
subheader('Prochaines etapes');
bullet('Definir Cloudinary credentials dans Vercel Dashboard');
bullet('Remplacer SMTP Ethereal par SendGrid ou Mailgun');
bullet('Ameliorer le design PDF des ebooks (plus premium / structure)');
bullet('Tester les endpoints AI generate et regenerate-section en condition reelle');
bullet('Ajouter des templates de pages predefinies');
bullet('Systeme de notifications en temps reel');
bullet('Analytics avancees avec export PDF des rapports');
bullet('API publique pour integrations tierces');
bullet('Application mobile PWA');
bullet('MarchePlace entre createurs de contenu');

// ============ FINAL PAGE ============
needSpace(400);
drawFooterBar();
doc.addPage();
drawHeaderBar();

cursorY = 140;
doc.fillColor(GREEN_DARK).fontSize(28).font('Helvetica-Bold');
doc.text('CONTRAK', 55, cursorY, { align: 'center' });
cursorY += 40;

doc.fillColor(GREEN_MID).fontSize(13).font('Helvetica');
doc.text('creer, vendre, publier', 55, cursorY, { align: 'center' });
cursorY += 25;

doc.moveTo(55, cursorY).lineTo(doc.page.width - 55, cursorY).strokeColor(GREEN_LIGHT).lineWidth(2).stroke();
cursorY += 25;

doc.fillColor(TEXT_MUTED).fontSize(10).font('Helvetica');
doc.text('Cette fiche projet a ete generee automatiquement', 55, cursorY, { align: 'center' });
cursorY += 16;
doc.text('par l\'assistant de developpement', 55, cursorY, { align: 'center' });
cursorY += 30;

doc.fillColor(GREEN_DARK).fontSize(10).font('Helvetica-Bold');
doc.text(dateStr, 55, cursorY, { align: 'center' });
cursorY += 40;

const footerNote = [
  'Toutes les informations contenues dans ce document sont basees',
  'sur l\'etat actuel du projet au ' + dateStr + '.',
  'Contrak est un projet open-source sous licence MIT.'
];
doc.fillColor(TEXT_MUTED).fontSize(8).font('Helvetica-Oblique');
footerNote.forEach((line) => {
  doc.text(line, 55, cursorY, { align: 'center' });
  cursorY += 14;
});

drawFooterBar();
doc.end();

console.log('PDF generated: ' + OUTPUT);
