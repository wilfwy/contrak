# 🚀 Guide de démarrage rapide - Contrak

## Étapes d'installation

### 1. Installer les dépendances
```bash
npm install
```

### 2. Configurer Firebase

#### a. Créer un projet Firebase
1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Créez un nouveau projet
3. Activez **Authentication** (Email/Password)
4. Activez **Firestore Database**

#### b. Télécharger le Service Account
1. Allez dans **Paramètres du projet** > **Comptes de service**
2. Cliquez sur **Générer une nouvelle clé privée**
3. Téléchargez le fichier JSON
4. Placez-le dans `config/firebase-service-account.json`

#### c. Configurer Firebase côté client
1. Allez dans **Paramètres du projet** > **Vos applications**
2. Créez une nouvelle application web
3. Copiez les clés de configuration
4. Éditez `public/firebase-config.js` et remplacez les valeurs :
   ```javascript
   const firebaseConfig = {
     apiKey: "VOTRE_API_KEY",
     authDomain: "VOTRE_PROJECT_ID.firebaseapp.com",
     projectId: "VOTRE_PROJECT_ID",
     // ... etc
   };
   ```

### 3. Configurer Stripe

1. Créez un compte sur [Stripe](https://stripe.com)
2. Allez dans **Developers** > **API keys**
3. Récupérez votre **Secret key** (mode test pour commencer)
4. Créez un fichier `.env` à la racine :
   ```env
   PORT=3000
   FRONTEND_URL=http://localhost:3000
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NODE_ENV=development
   ```

#### Configurer le webhook Stripe (optionnel, pour la production)
1. Allez dans **Developers** > **Webhooks**
2. Ajoutez un endpoint : `https://votre-domaine.com/api/billing/webhook`
3. Sélectionnez les événements :
   - `checkout.session.completed`
   - `customer.subscription.deleted`
4. Copiez le **Webhook signing secret** dans `.env`

### 4. Démarrer l'application

```bash
# Mode développement (avec nodemon)
npm run dev

# Mode production
npm start
```

L'application sera accessible sur `http://localhost:3000`

## ✅ Vérification

1. Ouvrez `http://localhost:3000`
2. Créez un compte
3. Connectez-vous
4. Créez un contrat
5. Testez la génération PDF

## 🔧 Problèmes courants

### Erreur Firebase
- Vérifiez que `config/firebase-service-account.json` existe
- Vérifiez que Authentication et Firestore sont activés

### Erreur Stripe
- Vérifiez vos clés dans `.env`
- Utilisez les clés de test (commencent par `sk_test_`)

### Erreur CORS
- Vérifiez que `FRONTEND_URL` dans `.env` correspond à votre URL

## 📝 Notes

- Pour la production, changez `NODE_ENV=production` dans `.env`
- Utilisez les clés Stripe de production pour les vrais paiements
- Configurez HTTPS pour les cookies sécurisés