# TODO - Clone shoplit.com (progressif)

## Terminé ✅

### Étape 0 — Préparation
- [x] Cartographie du repo existant (auth Firebase, Stripe subscription, contrats PDFs, ebooks, pages statiques)
- [x] Intégration MVP : produits (products/product_versions) backend skeleton
- [x] Définir schéma Firestore (orders, transactions, pages, media, customers/segments, analytics_events, notifications)

### Étape 1 — Backend data model + RBAC + routes (MVP commerce)
- [x] Ajouter/compléter `services/firebase.service.js` avec CRUD Firestore pour :
  - [x] products
  - [x] product_versions
  - [x] orders
  - [x] transactions
  - [x] media
  - [x] customers/segments (skeleton)
- [x] Ajouter middlewares RBAC : `requireRole`, `requireOwner`, `requirePlan`
- [x] Ajouter routes/controllers :
  - [x] `routes/products.routes.js`, `controllers/products.controller.js`
  - [x] `routes/orders.routes.js`, `controllers/orders.controller.js`
  - [x] `routes/exports.routes.js` → Export PDF implémenté
  - [x] `routes/pages.routes.js` → CRUD complet

### Étape 2 — Paiements par commande (Stripe) + webhook → orders/transactions
- [x] Étendre `services/stripe.service.js` pour checkout "digital product"
- [x] URLs de retour personnalisées (success/cancel)
- [x] Page publique produit (`/p/:slug`) avec bouton d'achat
- [x] Page de gestion des produits (`/products`) avec création/édition/suppression
- [x] Création de versions avec prix, devise, contenu (chapitres)

### Étape 3 — Export PDF de versions produits
- [x] `services/ebook.service.js` → `generateProductVersionPdf()`
- [x] Endpoint `/api/exports/product-versions/:versionId` avec téléchargement PDF
- [x] Bouton PDF dans la page produits

### Étape 4 — Page builder MVP (JSON sections) + rendu landing public
- [x] Collection `pages` dans Firestore
- [x] CRUD complet (`/api/pages`)
- [x] Interface admin d'édition (`/pages`) avec sections et thème
- [x] Rendu public : `GET /l/:slug`

### Étape 5 — Dashboard & Analytics MVP
- [x] Collection `analytics_events` dans Firestore
- [x] Tracking des vues produits et pages landing
- [x] Endpoint agrégats pour le dashboard
- [x] Dashboard mis à jour avec stats et bar charts (7 jours)

### Étape 6 — Marketing / Media / Academy
- [x] Coupons/promos : CRUD + validation (collection `coupons`)
- [x] Media : upload URL + listing (collection `media`)
- [x] Academy : courses/lessons + CRUD (collections `courses`, `lessons`)

### Étape 7 — IA (au-delà des suggestions ebooks)
- [x] Génération landing page par IA (via Anthropic)
- [x] Génération copywriting marketing
- [x] Génération d'emails marketing

### Fonctionnalités Shoplite supplémentaires
- [x] SEO meta tags (og:title, twitter:card, description) sur pages publiques
- [x] Partage réseaux sociaux (Twitter/X, Facebook, LinkedIn)
- [x] Multi-devise (EUR, USD, GBP dans les sélecteurs)
- [x] Navigation unifiée avec accès à toutes les sections

### Changements demandés — Ebook focus + Design + Super Admin
- [x] Design vert foncé interactif (style.css réécrit avec dégradés, glassmorphism, animations)
- [x] Landing page centrée sur l'ebook (hero, how it works, features, CTA)
- [x] Dashboard priorise les ebooks (stats, tabs, navigation)
- [x] Super admin route + middleware + controller
- [x] Script seed-superuser.js (node scripts/seed-superuser.js)
- [ ] Lancer `node scripts/seed-superuser.js` pour promouvoir wilfriedezi7@gmail.com

### Bugs corrigés (Suggestion IA)
- [x] Bug 1: `renderSuggestions` — onclick avec guillemets simples cassé par les apostrophes françaises (remplacé par addEventListener + escapeHtml)
- [x] Bug 2: `parseAIJsonResponse` — regex greedy qui matche du premier `[` au dernier `]` (remplacé par indexOf/lastIndexOf)
- [x] Même fix appliqué à `services/ai.service.js`

### Quotas BASIC plan
- [x] Service centralisé `services/quota.service.js` avec limites:
  - Ebooks: 3, Contrats: 5, Produits: 5, Pages: 5, Media: 10
  - Suggestions IA: 5/jour, Transcriptions: 5/mois
- [x] Middleware `quotaMiddleware(feature)` appliqué aux routes:
  - `POST /api/ebooks/custom` et `/from-video` (ebooks)
  - `POST /api/contracts` (contracts)
  - `POST /api/products` (products)
  - `POST /api/pages` (pages)
  - `POST /api/media/upload` (media)
  - `POST /api/ebooks/ai-suggestions` (aiSuggestionsPerDay)
  - `POST /api/ebooks/transcribe-url` et `transcribe-upload` (transcriptionsPerMonth)
- [x] Enregistrement d'usage AI (`recordAiUsage`) dans les endpoints concernés
- [x] Stats endpoint enrichi avec `limits` et `usage`
- [x] Quotas affichés dans la page ebook et la page profil
- [x] Page de tarification mise à jour avec les quotas précis

### Design & Navigation
- [x] `ebooks.html` — thème dark green + navigation cohérente (CONTRAK.IO)
- [x] `products.html` — thème dark green + navigation cohérente
- [x] `pages.html` — thème dark green + navigation cohérente
- [x] Logo uniformisé `CONTRAK.IO` partout (login, register, pricing, 404, contract-new)
- [x] Ordre de navigation uniforme: Dashboard → Ebooks → Products → Pages → Pricing → Profile
- [x] Lien "Profile" ajouté dans la navigation des pages authentifiées

### Pages manquantes
- [x] `views/profile.html` — page profil avec email, plan, UID, usage, billing, reset password
- [x] Route `GET /profile` dans `app.js`
- [x] `public/robots.txt`
- [x] Section Super Admin visible seulement pour les super admins sur la page profil

## Prochaines améliorations possibles (post-MVP)

- [ ] Paiement multi-devise automatique (conversion de prix)
- [ ] Multi-langue (i18n) avec sélecteur de langue
- [ ] Firebase Storage pour upload d'images/fichiers
- [ ] Emailing automatisé (SendGrid / Mailgun)
- [ ] Gestion des clients / segments
- [ ] Drag & drop pour le page builder
- [ ] PWA / mode offline
- [ ] Tests automatisés
- [ ] CI/CD
