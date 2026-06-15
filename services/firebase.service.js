const admin = require('firebase-admin');

// Initialisation Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : require('../config/firebase-service-account.json');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const auth = admin.auth();

/**
 * Vérifie un token Firebase ID
 */
async function verifyIdToken(idToken) {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw new Error('Token invalide');
  }
}

/**
 * Crée un utilisateur dans Firestore
 */
async function createUser(uid, email, plan = 'basic') {
  const userRef = db.collection('users').doc(uid);
  await userRef.set({
    uid,
    email,
    plan,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return userRef.get();
}

/**
 * Récupère un utilisateur par UID
 */
async function getUser(uid) {
  const userRef = db.collection('users').doc(uid);
  const doc = await userRef.get();
  if (!doc.exists) {
    return null;
  }
  return { id: doc.id, ...doc.data() };
}

/**
 * Met à jour le plan d'un utilisateur
 */
async function updateUserPlan(uid, plan) {
  const userRef = db.collection('users').doc(uid);
  await userRef.update({ plan });
  return getUser(uid);
}

/**
 * Crée un contrat
 */
async function createContract(contractData) {
  const contractRef = db.collection('contracts').doc();
  await contractRef.set({
    ...contractData,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return contractRef.get();
}

/**
 * Récupère tous les contrats d'un utilisateur
 */
async function getUserContracts(userId) {
  const contractsRef = db.collection('contracts');
  const snapshot = await contractsRef.where('userId', '==', userId).get();
  
  const contracts = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    const createdAtIso = data.createdAt && typeof data.createdAt.toDate === 'function'
      ? data.createdAt.toDate().toISOString()
      : null;
    contracts.push({ id: doc.id, ...data, createdAt: createdAtIso });
  });
  
  return contracts;
}

/**
 * Récupère un contrat par ID
 */
async function getContractById(contractId) {
  const contractRef = db.collection('contracts').doc(contractId);
  const doc = await contractRef.get();
  if (!doc.exists) {
    return null;
  }
  const data = doc.data();
  const createdAtIso = data.createdAt && typeof data.createdAt.toDate === 'function'
    ? data.createdAt.toDate().toISOString()
    : null;
  return { id: doc.id, ...data, createdAt: createdAtIso };
}

/**
 * Compte le nombre de contrats d'un utilisateur
 */
async function countUserContracts(userId) {
  const contractsRef = db.collection('contracts');
  const snapshot = await contractsRef.where('userId', '==', userId).get();
  return snapshot.size;
}

/**
 * Enregistre un ebook généré
 */
async function createEbookRecord(ebookData) {
  const ebookRef = db.collection('ebooks').doc();
  await ebookRef.set({
    ...ebookData,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return ebookRef.get();
}

/**
 * Compte le nombre d'ebooks d'un utilisateur
 */
async function countUserEbooks(userId) {
  const snapshot = await db.collection('ebooks').where('userId', '==', userId).get();
  return snapshot.size;
}

/**
 * Récupère un ebook par son identifiant fichier
 */
async function getEbookByFileId(ebookId, userId) {
  const snapshot = await db.collection('ebooks')
    .where('userId', '==', userId)
    .where('ebookId', '==', ebookId)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

module.exports = {
  verifyIdToken,
  createUser,
  getUser,
  updateUserPlan,
  createContract,
  getUserContracts,
  getContractById,
  countUserContracts,
  createEbookRecord,
  countUserEbooks,
  getEbookByFileId,
  db,
  auth
};
