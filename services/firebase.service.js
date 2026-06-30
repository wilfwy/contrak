const admin = require('firebase-admin');

// Initialisation Firebase Admin (non-fatale si échoue)
if (!admin.apps.length) {
  try {
    let serviceAccount;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
      serviceAccount = require('../config/firebase-service-account.json');
    }
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    // Enable ignoreUndefinedProperties to prevent Firestore errors from undefined fields
    admin.firestore().settings({ ignoreUndefinedProperties: true });
  } catch (e) {
    console.error('Firebase init failed (server will run without Firebase):', e.message);
  }
}

function getDb() {
  if (!admin.apps.length) throw new Error('Firebase not initialized');
  return admin.firestore();
}
function getAuth() {
  if (!admin.apps.length) throw new Error('Firebase not initialized');
  return admin.auth();
}

/**
 * Vérifie un token Firebase ID
 */
async function verifyIdToken(idToken) {
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * Crée un utilisateur dans Firestore
 */
async function createUser(uid, email, plan = 'basic', role = 'user') {
  const userRef = getDb().collection('users').doc(uid);
  await userRef.set({
    uid,
    email,
    plan,
    role,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return userRef.get();
}

/**
 * Récupère un utilisateur par UID
 */
async function getUser(uid) {
  const userRef = getDb().collection('users').doc(uid);
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
  const userRef = getDb().collection('users').doc(uid);
  await userRef.update({ plan });
  return getUser(uid);
}

/**
 * Crée un contrat
 */
async function createContract(contractData) {
  const contractRef = getDb().collection('contracts').doc();
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
  const contractsRef = getDb().collection('contracts');
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
  const contractRef = getDb().collection('contracts').doc(contractId);
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
  const contractsRef = getDb().collection('contracts');
  const snapshot = await contractsRef.where('userId', '==', userId).get();
  return snapshot.size;
}

/**
 * Enregistre un ebook généré
 */
async function createEbookRecord(ebookData) {
  const ebookRef = getDb().collection('ebooks').doc();
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
  const snapshot = await getDb().collection('ebooks').where('userId', '==', userId).get();
  return snapshot.size;
}

/**
 * Liste tous les ebooks d'un utilisateur
 */
async function listUserEbooks(userId) {
  const snapshot = await getDb().collection('ebooks')
    .where('userId', '==', userId)
    .get();
  const ebooks = snapshot.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt && typeof data.createdAt.toDate === 'function'
        ? data.createdAt.toDate().toISOString()
        : null
    };
  });
  ebooks.sort((a, b) => {
    if (!a.createdAt) return 1;
    if (!b.createdAt) return -1;
    return b.createdAt.localeCompare(a.createdAt);
  });
  return ebooks;
}

/**
 * Récupère un ebook par son identifiant fichier
 */
async function getEbookByFileId(ebookId, userId) {
  const snapshot = await getDb().collection('ebooks')
    .where('userId', '==', userId)
    .where('ebookId', '==', ebookId)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

async function createProduct(productData) {
  const docRef = getDb().collection('products').doc();
  await docRef.set({
    ...productData,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  const snap = await docRef.get();
  return { id: snap.id, ...snap.data() };
}

async function listProductsByOwner(ownerId) {
  const snapshot = await getDb().collection('products')
    .where('ownerId', '==', ownerId)
    .get();
  const products = snapshot.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt && typeof data.createdAt.toDate === 'function'
        ? data.createdAt.toDate().toISOString()
        : null
    };
  });
  products.sort((a, b) => {
    if (!a.createdAt) return 1;
    if (!b.createdAt) return -1;
    return b.createdAt.localeCompare(a.createdAt);
  });
  return products;
}

async function getProductBySlug(slug) {
  const snapshot = await getDb().collection('products')
    .where('slug', '==', slug)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

async function listVersionsByProduct(productId) {
  const snapshot = await getDb().collection('product_versions')
    .where('productId', '==', productId)
    .get();
  const versions = snapshot.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt && typeof data.createdAt.toDate === 'function'
        ? data.createdAt.toDate().toISOString()
        : null
    };
  });
  versions.sort((a, b) => {
    if (!a.createdAt) return 1;
    if (!b.createdAt) return -1;
    return b.createdAt.localeCompare(a.createdAt);
  });
  return versions;
}

async function getProductById(productId) {
  const doc = await getDb().collection('products').doc(productId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

async function updateProductById(productId, updateData) {
  await getDb().collection('products').doc(productId).update({
    ...updateData,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return getProductById(productId);
}

async function deleteProductById(productId) {
  await getDb().collection('products').doc(productId).delete();
}

async function createProductVersion(versionData) {
  const docRef = getDb().collection('product_versions').doc();
  await docRef.set({
    ...versionData,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  const snap = await docRef.get();
  return { id: snap.id, ...snap.data() };
}

async function getProductVersionById(versionId) {
  const doc = await getDb().collection('product_versions').doc(versionId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

async function updateProductVersionById(versionId, updateData) {
  await getDb().collection('product_versions').doc(versionId).update({
    ...updateData,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return getProductVersionById(versionId);
}

async function deleteProductVersionById(versionId) {
  await getDb().collection('product_versions').doc(versionId).delete();
}

/**
 * ===== Orders & Transactions (MVP commerce) =====
 */

async function createOrder(orderData) {
  const docRef = getDb().collection('orders').doc();
  await docRef.set({
    ...orderData,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  const snap = await docRef.get();
  return { id: snap.id, ...snap.data() };
}

function normalizeTimestampField(data) {
  if (!data) return null;
  return data && typeof data.toDate === 'function' ? data.toDate().toISOString() : null;
}

async function getOrderById(orderId, userId) {
  let query = getDb().collection('orders').doc(orderId);

  // Si userId fourni, on valide l'appartenance côté serveur via lecture
  const doc = await query.get();
  if (!doc.exists) return null;

  const data = doc.data();
  if (userId && data.userId !== userId) return null;

  return {
    id: doc.id,
    ...data,
    createdAt: normalizeTimestampField(data.createdAt),
    updatedAt: normalizeTimestampField(data.updatedAt)
  };
}

async function listOrdersByUser(userId) {
  const snapshot = await getDb()
    .collection('orders')
    .where('userId', '==', userId)
    .get();

  const orders = snapshot.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: normalizeTimestampField(data.createdAt),
      updatedAt: normalizeTimestampField(data.updatedAt)
    };
  });
  orders.sort((a, b) => {
    if (!a.createdAt) return 1; if (!b.createdAt) return -1; return b.createdAt.localeCompare(a.createdAt);
  });
  return orders;
}

async function createTransaction(transactionData) {
  const docRef = getDb().collection('transactions').doc();
  await docRef.set({
    ...transactionData,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  const snap = await docRef.get();
  return { id: snap.id, ...snap.data() };
}

async function listTransactionsByOrder(orderId) {
  const snapshot = await getDb()
    .collection('transactions')
    .where('orderId', '==', orderId)
    .get();

  const txs = snapshot.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: normalizeTimestampField(data.createdAt),
      updatedAt: normalizeTimestampField(data.updatedAt)
    };
  });
  txs.sort((a, b) => {
    if (!a.createdAt) return 1; if (!b.createdAt) return -1; return b.createdAt.localeCompare(a.createdAt);
  });
  return txs;
}

async function getTransactionByStripeSessionId(stripeSessionId) {
  if (!stripeSessionId) return null;

  const snapshot = await getDb()
    .collection('transactions')
    .where('stripeSessionId', '==', stripeSessionId)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: normalizeTimestampField(data.createdAt),
    updatedAt: normalizeTimestampField(data.updatedAt)
  };
}

async function updateOrderStatus(orderId, updateData) {
  await getDb().collection('orders').doc(orderId).update({
    ...updateData,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  // Retour utile
  const doc = await getDb().collection('orders').doc(orderId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

async function updateTransactionStatus(transactionId, updateData) {
  await getDb().collection('transactions').doc(transactionId).update({
    ...updateData,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  const doc = await getDb().collection('transactions').doc(transactionId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

// ===== Coupons =====

async function createCoupon(couponData) {
  const docRef = getDb().collection('coupons').doc();
  await docRef.set({ ...couponData, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  const snap = await docRef.get();
  return { id: snap.id, ...snap.data() };
}

async function listCouponsByOwner(ownerId) {
  const snapshot = await getDb().collection('coupons').where('ownerId', '==', ownerId).get();
  const coupons = snapshot.docs.map(d => {
    const data = d.data();
    return { id: d.id, ...data, createdAt: normalizeTimestampField(data.createdAt) };
  });
  coupons.sort((a, b) => {
    if (!a.createdAt) return 1; if (!b.createdAt) return -1; return b.createdAt.localeCompare(a.createdAt);
  });
  return coupons;
}

async function getCouponByCode(code) {
  const snapshot = await getDb().collection('coupons').where('code', '==', code.toUpperCase()).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

async function updateCouponById(couponId, updateData) {
  await getDb().collection('coupons').doc(couponId).update({ ...updateData, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  const doc = await getDb().collection('coupons').doc(couponId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

async function deleteCouponById(couponId) {
  await getDb().collection('coupons').doc(couponId).delete();
}

// ===== Media (simple URL-based) =====

async function createMedia(mediaData) {
  const docRef = getDb().collection('media').doc();
  await docRef.set({ ...mediaData, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  const snap = await docRef.get();
  return { id: snap.id, ...snap.data() };
}

async function listMediaByOwner(ownerId) {
  const snapshot = await getDb().collection('media').where('ownerId', '==', ownerId).get();
  const media = snapshot.docs.map(d => {
    const data = d.data();
    return { id: d.id, ...data, createdAt: normalizeTimestampField(data.createdAt) };
  });
  media.sort((a, b) => {
    if (!a.createdAt) return 1; if (!b.createdAt) return -1; return b.createdAt.localeCompare(a.createdAt);
  });
  return media;
}

async function deleteMediaById(mediaId) {
  await getDb().collection('media').doc(mediaId).delete();
}

// ===== Academy =====

async function createCourse(courseData) {
  const docRef = getDb().collection('courses').doc();
  await docRef.set({ ...courseData, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  const snap = await docRef.get();
  return { id: snap.id, ...snap.data() };
}

async function listCoursesByOwner(ownerId) {
  const snapshot = await getDb().collection('courses').where('ownerId', '==', ownerId).get();
  const courses = snapshot.docs.map(d => {
    const data = d.data();
    return { id: d.id, ...data, createdAt: normalizeTimestampField(data.createdAt) };
  });
  courses.sort((a, b) => {
    if (!a.createdAt) return 1; if (!b.createdAt) return -1; return b.createdAt.localeCompare(a.createdAt);
  });
  return courses;
}

async function getCourseById(courseId) {
  const doc = await getDb().collection('courses').doc(courseId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

async function updateCourseById(courseId, updateData) {
  await getDb().collection('courses').doc(courseId).update({ ...updateData, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  return getCourseById(courseId);
}

async function deleteCourseById(courseId) {
  await getDb().collection('courses').doc(courseId).delete();
}

async function createLesson(lessonData) {
  const docRef = getDb().collection('lessons').doc();
  await docRef.set({ ...lessonData, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  const snap = await docRef.get();
  return { id: snap.id, ...snap.data() };
}

async function listLessonsByCourse(courseId) {
  const snapshot = await getDb().collection('lessons').where('courseId', '==', courseId).get();
  const lessons = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  lessons.sort((a, b) => (a.order || 0) - (b.order || 0));
  return lessons;
}

async function getLessonById(lessonId) {
  const doc = await getDb().collection('lessons').doc(lessonId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

async function updateLessonById(lessonId, updateData) {
  await getDb().collection('lessons').doc(lessonId).update({ ...updateData, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  return getLessonById(lessonId);
}

async function deleteLessonById(lessonId) {
  await getDb().collection('lessons').doc(lessonId).delete();
}

// ===== Analytics =====

async function trackEvent(eventData) {
  const docRef = getDb().collection('analytics_events').doc();
  await docRef.set({
    ...eventData,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return { id: docRef.id };
}

async function getAnalyticsStats(ownerId) {
  const events = await getDb().collection('analytics_events')
    .where('ownerId', '==', ownerId)
    .get();

  const stats = { totalViews: 0, totalPurchases: 0, totalRevenue: 0, viewsByProduct: {}, purchasesByProduct: {}, last7Days: [] };

  const days = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days[key] = { date: key, views: 0, purchases: 0, revenue: 0 };
  }

  events.forEach(doc => {
    const data = doc.data();
    const ts = data.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().toISOString().split('T')[0] : null;

    if (data.type === 'page_view' || data.type === 'product_view') {
      stats.totalViews++;
      const pid = data.productId || 'unknown';
      stats.viewsByProduct[pid] = (stats.viewsByProduct[pid] || 0) + 1;
      if (ts && days[ts]) days[ts].views++;
    }
    if (data.type === 'purchase') {
      stats.totalPurchases++;
      stats.totalRevenue += data.amount || 0;
      const pid = data.productId || 'unknown';
      stats.purchasesByProduct[pid] = (stats.purchasesByProduct[pid] || 0) + 1;
      if (ts && days[ts]) {
        days[ts].purchases++;
        days[ts].revenue += data.amount || 0;
      }
    }
  });

  stats.last7Days = Object.values(days);
  return stats;
}

// ===== Cart =====

async function getCart(userId) {
  const doc = await getDb().collection('carts').doc(userId).get();
  if (!doc.exists) return { id: userId, items: [] };
  return { id: doc.id, ...doc.data() };
}

async function setCart(userId, items) {
  await getDb().collection('carts').doc(userId).set({
    items,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return getCart(userId);
}

/**
 * Check if a user has purchased (has a paid order for) a specific product version
 */
async function hasUserPurchasedVersion(userId, versionId) {
  if (!userId || !versionId) return false;
  const snapshot = await getDb().collection('orders')
    .where('userId', '==', userId)
    .where('status', '==', 'paid')
    .get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    // Single item orders
    if (data.productVersionId === versionId) return true;
    // Multi-item orders (items array)
    if (data.items && Array.isArray(data.items)) {
      if (data.items.some(item => item.productVersionId === versionId)) return true;
    }
  }
  return false;
}

// ===== Pages (page builder) =====

async function createPage(pageData) {
  const docRef = getDb().collection('pages').doc();
  await docRef.set({ ...pageData, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  const snap = await docRef.get();
  return { id: snap.id, ...snap.data() };
}

async function listPagesByOwner(ownerId) {
  const snapshot = await getDb().collection('pages').where('ownerId', '==', ownerId).get();
  const pages = snapshot.docs.map(d => {
    const data = d.data();
    return { id: d.id, ...data, createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().toISOString() : null };
  });
  pages.sort((a, b) => {
    if (!a.createdAt) return 1;
    if (!b.createdAt) return -1;
    return b.createdAt.localeCompare(a.createdAt);
  });
  return pages;
}

async function getPageById(pageId) {
  const doc = await getDb().collection('pages').doc(pageId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

async function getPageBySlug(slug) {
  const snapshot = await getDb().collection('pages').where('slug', '==', slug).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

async function updatePageById(pageId, updateData) {
  await getDb().collection('pages').doc(pageId).update({ ...updateData, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  return getPageById(pageId);
}

async function deletePageById(pageId) {
  await getDb().collection('pages').doc(pageId).delete();
}

// ===== Reviews =====

async function createReview(reviewData) {
  const docRef = getDb().collection('reviews').doc();
  await docRef.set({
    ...reviewData,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  const snap = await docRef.get();
  return { id: snap.id, ...snap.data() };
}

async function listReviewsByProduct(productId) {
  const snapshot = await getDb().collection('reviews').where('productId', '==', productId).get();
  const reviews = snapshot.docs.map(d => {
    const data = d.data();
    return { id: d.id, ...data, createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().toISOString() : null };
  });
  reviews.sort((a, b) => {
    if (!a.createdAt) return 1; if (!b.createdAt) return -1; return b.createdAt.localeCompare(a.createdAt);
  });
  return reviews;
}

async function getAverageRating(productId) {
  const snapshot = await getDb().collection('reviews').where('productId', '==', productId).get();
  if (snapshot.empty) return { average: 0, count: 0 };
  let total = 0;
  snapshot.forEach(doc => { total += doc.data().rating || 0; });
  return { average: Math.round((total / snapshot.size) * 10) / 10, count: snapshot.size };
}

async function hasUserReviewedProduct(userId, productId) {
  // Check by fetching all user reviews and filtering in-memory to avoid composite index
  const snapshot = await getDb().collection('reviews').where('userId', '==', userId).get();
  return snapshot.docs.some(doc => doc.data().productId === productId);
}

// ===== Blog / Articles =====

async function createArticle(articleData) {
  const docRef = getDb().collection('articles').doc();
  await docRef.set({
    ...articleData,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  const snap = await docRef.get();
  return { id: snap.id, ...snap.data() };
}

async function listArticlesByOwner(ownerId) {
  const snapshot = await getDb().collection('articles').where('ownerId', '==', ownerId).get();
  const articles = snapshot.docs.map(d => {
    const data = d.data();
    return { id: d.id, ...data, createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().toISOString() : null };
  });
  articles.sort((a, b) => {
    if (!a.createdAt) return 1; if (!b.createdAt) return -1; return b.createdAt.localeCompare(a.createdAt);
  });
  return articles;
}

async function listPublishedArticles() {
  const snapshot = await getDb().collection('articles').where('status', '==', 'published').get();
  const articles = snapshot.docs.map(d => {
    const data = d.data();
    return { id: d.id, ...data, createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().toISOString() : null };
  });
  articles.sort((a, b) => {
    if (!a.createdAt) return 1; if (!b.createdAt) return -1; return b.createdAt.localeCompare(a.createdAt);
  });
  return articles;
}

async function getArticleBySlug(slug) {
  const snapshot = await getDb().collection('articles').where('slug', '==', slug).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

async function getArticleById(articleId) {
  const doc = await getDb().collection('articles').doc(articleId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

async function updateArticleById(articleId, updateData) {
  await getDb().collection('articles').doc(articleId).update({
    ...updateData,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return getArticleById(articleId);
}

async function deleteArticleById(articleId) {
  await getDb().collection('articles').doc(articleId).delete();
}

async function getEbookByDocId(docId) {
  const doc = await getDb().collection('ebooks').doc(docId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

async function getSalesAnalytics(ownerId) {
  const db = getDb();
  const ordersSnap = await db.collection('orders').where('userId', '==', ownerId).get();
  const productsSnap = await db.collection('products').where('ownerId', '==', ownerId).get();
  const productMap = {};
  productsSnap.forEach(d => { productMap[d.id] = d.data().title || 'Untitled'; });

  let totalRevenue = 0;
  let totalOrders = 0;
  let paidOrders = 0;
  let refundedOrders = 0;
  let refundedAmount = 0;
  const productRevenue = {};
  const dayBuckets = {};

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    dayBuckets[key] = { date: key, revenue: 0, orders: 0 };
  }

  ordersSnap.forEach(doc => {
    const o = doc.data();
    totalOrders++;
    if (o.status === 'paid') paidOrders++;
    if (o.status === 'refunded') { refundedOrders++; refundedAmount += o.totalAmount || 0; }
    totalRevenue += o.totalAmount || 0;

    const ts = o.createdAt && typeof o.createdAt.toDate === 'function' ? o.createdAt.toDate().toISOString().split('T')[0] : null;
    if (ts && dayBuckets[ts]) {
      dayBuckets[ts].revenue += o.totalAmount || 0;
      dayBuckets[ts].orders++;
    }

    const items = o.items || (o.productId ? [{ productId: o.productId }] : []);
    items.forEach(item => {
      const pid = item.productId || 'unknown';
      const rev = item.price || 0;
      productRevenue[pid] = (productRevenue[pid] || 0) + rev;
    });
  });

  const topProducts = Object.entries(productRevenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, rev]) => ({ id, title: productMap[id] || 'Deleted product', revenue: rev }));

  const avgOrderValue = paidOrders > 0 ? Math.round(totalRevenue / paidOrders) : 0;

  return {
    totalRevenue,
    totalOrders,
    paidOrders,
    refundedOrders,
    refundedAmount,
    avgOrderValue,
    topProducts,
    daily: Object.values(dayBuckets)
  };
}

// ===== Super Admin =====

async function listAllUsers() {
  const snapshot = await getDb().collection('users').get();
  const users = snapshot.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt && typeof data.createdAt.toDate === 'function'
        ? data.createdAt.toDate().toISOString()
        : null
    };
  });
  users.sort((a, b) => {
    if (!a.createdAt) return 1;
    if (!b.createdAt) return -1;
    return b.createdAt.localeCompare(a.createdAt);
  });
  return users;
}

async function getSiteWideStats() {
  const db = getDb();
  const [
    usersSnap, ebooksSnap, productsSnap, pagesSnap,
    ordersSnap, contractsSnap, mediaSnap, couponsSnap,
    coursesSnap, articlesSnap, reviewsSnap
  ] = await Promise.all([
    db.collection('users').get(),
    db.collection('ebooks').get(),
    db.collection('products').get(),
    db.collection('pages').get(),
    db.collection('orders').get(),
    db.collection('contracts').get(),
    db.collection('media').get(),
    db.collection('coupons').get(),
    db.collection('courses').get(),
    db.collection('articles').get(),
    db.collection('reviews').get()
  ]);

  // Revenue / order stats
  let totalRevenue = 0;
  let totalOrders = 0;
  let paidOrders = 0;
  const planCounts = { basic: 0, pro: 0 };
  const roleCounts = { user: 0, super_admin: 0 };

  usersSnap.forEach(d => {
    const data = d.data();
    planCounts[data.plan] = (planCounts[data.plan] || 0) + 1;
    roleCounts[data.role] = (roleCounts[data.role] || 0) + 1;
  });

  ordersSnap.forEach(d => {
    const o = d.data();
    totalOrders++;
    if (o.status === 'paid') paidOrders++;
    totalRevenue += o.totalAmount || 0;
  });

  // 30-day daily signups
  const signupBuckets = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    signupBuckets[key] = { date: key, count: 0 };
  }
  usersSnap.forEach(d => {
    const data = d.data();
    const ts = data.createdAt && typeof data.createdAt.toDate === 'function'
      ? data.createdAt.toDate().toISOString().split('T')[0]
      : null;
    if (ts && signupBuckets[ts]) signupBuckets[ts].count++;
  });

  return {
    users: { total: usersSnap.size, plans: planCounts, roles: roleCounts },
    ebooks: ebooksSnap.size,
    products: productsSnap.size,
    pages: pagesSnap.size,
    orders: { total: totalOrders, paid: paidOrders, revenue: totalRevenue },
    contracts: contractsSnap.size,
    media: mediaSnap.size,
    coupons: couponsSnap.size,
    courses: coursesSnap.size,
    articles: articlesSnap.size,
    reviews: reviewsSnap.size,
    dailySignups: Object.values(signupBuckets)
  };
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
  listUserEbooks,
  getEbookByFileId,
  getEbookByDocId,
  // Shoplit clone (MVP commerce)
  createProduct,
  listProductsByOwner,
  getProductById,
  getProductBySlug,
  updateProductById,
  deleteProductById,
  createProductVersion,
  getProductVersionById,
  updateProductVersionById,
  deleteProductVersionById,
  listVersionsByProduct,

  // Orders & Transactions
  createOrder,
  getOrderById,
  listOrdersByUser,
  createTransaction,
  listTransactionsByOrder,
  getTransactionByStripeSessionId,
  updateOrderStatus,
  updateTransactionStatus,

  // Coupons
  createCoupon,
  listCouponsByOwner,
  getCouponByCode,
  updateCouponById,
  deleteCouponById,
  // Media
  createMedia,
  listMediaByOwner,
  deleteMediaById,
  // Academy
  createCourse,
  listCoursesByOwner,
  getCourseById,
  updateCourseById,
  deleteCourseById,
  createLesson,
  listLessonsByCourse,
  getLessonById,
  updateLessonById,
  deleteLessonById,
  // Analytics
  trackEvent,
  getAnalyticsStats,
  getSalesAnalytics,

  // Cart
  getCart,
  setCart,
  hasUserPurchasedVersion,

  // Reviews
  createReview,
  listReviewsByProduct,
  getAverageRating,
  hasUserReviewedProduct,

  // Blog / Articles
  createArticle,
  listArticlesByOwner,
  listPublishedArticles,
  getArticleBySlug,
  getArticleById,
  updateArticleById,
  deleteArticleById,

  // Pages
  createPage,
  listPagesByOwner,
  getPageById,
  getPageBySlug,
  updatePageById,
  deletePageById,

  // Super Admin
  listAllUsers,
  getSiteWideStats,

  getDb,
  getAuth,
  admin
};

