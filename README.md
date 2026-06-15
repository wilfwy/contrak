# 📄 Contrak - Application SaaS de génération de contrats

Application web SaaS permettant aux freelances de créer, générer et sauvegarder des contrats de prestation en PDF.

## 🚀 Fonctionnalités

- ✅ Authentification Firebase (Email / Password)
- ✅ Plans BASIC (gratuit) et PRO (payant)
- ✅ Génération de contrats PDF
- ✅ Sauvegarde dans Firestore
- ✅ Paiement Stripe pour le plan PRO
- ✅ Interface web responsive

## 📦 Installation

1. **Cloner le projet** (si applicable)
   ```bash
   cd contrak
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   ```bash
   cp .env.example .env
   ```
   
   Éditez `.env` et ajoutez vos clés :
   - Firebase Service Account
   - Stripe Secret Key
   - Stripe Webhook Secret

4. **Configurer Firebase**
   
   a. Créez un projet Firebase sur [Firebase Console](https://console.firebase.google.com)
   
   b. Activez Authentication (Email/Password) et Firestore
   
   c. Téléchargez votre fichier Service Account :
      - Aller dans Paramètres du projet > Comptes de service
      - Cliquer sur "Générer une nouvelle clé privée"
      - Sauvegarder le fichier JSON dans `config/firebase-service-account.json`
   
   d. Mettez à jour les fichiers HTML (`login.html`, `register.html`) avec vos clés Firebase :
      ```javascript
      const firebaseConfig = {
        apiKey: "VOTRE_API_KEY",
        authDomain: "VOTRE_PROJECT_ID.firebaseapp.com",
        projectId: "VOTRE_PROJECT_ID"
      };
      ```

5. **Configurer Stripe**
   
   a. Créez un compte sur [Stripe](https://stripe.com)
   
   b. Récupérez vos clés API (mode test pour commencer)
   
   c. Configurez le webhook Stripe :
      - URL : `https://votre-domaine.com/api/billing/webhook`
      - Événements : `checkout.session.completed`, `customer.subscription.deleted`

## 🏃 Lancer l'application

### Mode développement
```bash
npm run dev
```

### Mode production
```bash
npm start
```

L'application sera accessible sur `http://localhost:3000`

## 📁 Structure du projet

```
contrak/
├── server.js              # Point d'entrée
├── app.js                 # Configuration Express
├── routes/                # Routes API
│   ├── auth.routes.js
│   ├── contract.routes.js
│   └── billing.routes.js
├── controllers/           # Controllers
│   ├── auth.controller.js
│   ├── contract.controller.js
│   └── billing.controller.js
├── services/              # Services métier
│   ├── firebase.service.js
│   ├── pdf.service.js
│   └── stripe.service.js
├── middlewares/           # Middlewares
│   ├── auth.middleware.js
│   └── validation.middleware.js
├── views/                 # Vues HTML
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── contract-new.html
│   ├── pricing.html
│   └── 404.html
├── public/                # Fichiers statiques
│   └── style.css
└── config/                # Configuration (à créer)
    └── firebase-service-account.json
```

## 🔐 Sécurité

- Tokens Firebase vérifiés côté serveur
- Cookies HttpOnly pour les sessions
- Validation des données avec express-validator
- Protection CSRF (à implémenter si nécessaire)

## 💳 Plans utilisateurs

### BASIC (gratuit)
- 1 type de contrat
- Maximum 5 contrats
- Watermark sur le PDF
- Clauses limitées

### PRO (9.90€/mois)
- Contrats illimités
- Tous les modèles de contrats
- Aucun watermark
- Historique complet
- Accès aux futures fonctionnalités

## 🛠️ Technologies utilisées

- **Backend** : Node.js + Express.js
- **Base de données** : Firebase Firestore
- **Authentification** : Firebase Authentication
- **PDF** : pdf-lib
- **Paiement** : Stripe
- **Frontend** : HTML5 + CSS3 + JavaScript (vanilla)

## 📝 Notes

- L'application utilise Firebase Authentication côté client (SDK JS) pour l'authentification
- Le serveur vérifie les tokens Firebase avec Firebase Admin SDK
- Les fichiers HTML doivent être mis à jour avec vos propres clés Firebase

## 🐛 Dépannage

### Erreur Firebase
- Vérifiez que votre fichier `firebase-service-account.json` est correct
- Vérifiez que Authentication et Firestore sont activés dans Firebase Console

### Erreur Stripe
- Vérifiez vos clés API Stripe dans `.env`
- Configurez correctement le webhook Stripe

## 📄 Licence

ISC